import 'server-only'

// ---------------------------------------------------------------------------
// Anonymous /mcp usage stats → daily counters in Upstash Redis (REST API).
//
// Off unless both env vars are set (server-only, no NEXT_PUBLIC_):
//   MCP_USAGE_REDIS_REST_URL / MCP_USAGE_REDIS_REST_TOKEN, or the names the
//   Vercel Marketplace "Upstash for Redis" integration injects:
//   KV_REST_API_URL / KV_REST_API_TOKEN (UPSTASH_REDIS_REST_URL / _TOKEN also work).
//
// What is stored (per Asia/Taipei day, kept USAGE_TTL_DAYS days):
//   mcp:usage:{YYYY-MM-DD}   hash  "{method}|{tool}|{status}" → count
//                                  "{method}|{tool}|{status}|ms" → total duration (ms)
//                                  "{method}|{tool}|{status}|{bucket}" → count per latency bucket
//   mcp:hours:{YYYY-MM-DD}   hash  "00".."23" (Taipei hour) → messages
//   mcp:clients:{YYYY-MM-DD} hash  clientInfo.name (sanitised) → messages; from initialize
//                                  (2025 era) or _meta clientInfo on each request (2026-07-28 era)
// method / tool are whitelisted, status is a small fixed vocabulary plus the
// server's own UPPER_SNAKE error codes. Never stored: IPs, user agents, tool
// arguments (city, space id …), response content, the partner key.
//
// Recording never blocks or breaks a response: the caller hands the promise to
// waitUntil, every failure is swallowed, the Redis call has a short timeout.
// ---------------------------------------------------------------------------

export const USAGE_TTL_DAYS = 400
const TIMEOUT_MS = 2000

// Client → server methods of MCP (both protocol eras, SDK 2.3.1).
const KNOWN_METHODS = new Set([
  'initialize',
  'server/discover',
  'ping',
  'tools/list',
  'tools/call',
  'resources/list',
  'resources/read',
  'resources/templates/list',
  'resources/subscribe',
  'resources/unsubscribe',
  'prompts/list',
  'prompts/get',
  'completion/complete',
  'logging/setLevel',
  'subscriptions/listen',
  'tasks/get',
  'tasks/list',
  'tasks/result',
  'tasks/cancel',
  'notifications/initialized',
  'notifications/cancelled',
  'notifications/progress',
  'notifications/roots/list_changed',
])
// 2026-07-28 era: every request carries clientInfo in _meta (SHOULD).
const CLIENT_INFO_META_KEY = 'io.modelcontextprotocol/clientInfo'
const KNOWN_TOOLS = new Set([
  'search_spaces',
  'get_space',
  'get_space_availability',
  'search_beauticians',
  'get_beautician',
  'list_regions',
  'get_price_overview',
  'get_brand_facts',
])
const CODE_RE = /^[A-Z][A-Z_]{2,39}$/

type UsageConfig = { url: string; token: string }

export function usageConfig(env: NodeJS.ProcessEnv = process.env): UsageConfig | null {
  const url = (env.MCP_USAGE_REDIS_REST_URL || env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || '').trim()
  const token = (env.MCP_USAGE_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || '').trim()
  if (!url || !token || !/^https?:\/\//.test(url)) return null
  return { url: url.replace(/\/+$/, ''), token }
}

export type UsageEvent = {
  method: string
  tool: string
  status: string
  durationMs: number
  clientName?: string
}

/** Whitelisted method name, or "other". */
export function safeMethod(value: unknown): string {
  return typeof value === 'string' && KNOWN_METHODS.has(value) ? value : 'other'
}

/** Whitelisted tool name, or "unknown". */
export function safeTool(value: unknown): string {
  return typeof value === 'string' && KNOWN_TOOLS.has(value) ? value : 'unknown'
}

/** Client product name only: printable ASCII-ish, no spaces runs, ≤ 40 chars. */
export function safeClientName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const cleaned = value.normalize('NFKC').replace(/[^A-Za-z0-9 ._\-/@()]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40)
  return cleaned || undefined
}

function safeCode(value: unknown): string | null {
  return typeof value === 'string' && CODE_RE.test(value) ? value : null
}

type JsonRpcMessage = { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown; result?: unknown; error?: unknown }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Parse a JSON-RPC request body (single message or batch). Never throws. */
export function parseRequestMessages(body: string): JsonRpcMessage[] {
  try {
    const parsed: unknown = JSON.parse(body)
    const list = Array.isArray(parsed) ? parsed : [parsed]
    return list.filter(isRecord) as JsonRpcMessage[]
  } catch {
    return []
  }
}

/** Parse a JSON or SSE (`data: …`) response body into JSON-RPC messages. Never throws. */
export function parseResponseMessages(body: string): JsonRpcMessage[] {
  const trimmed = body.trim()
  if (!trimmed) return []
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return parseRequestMessages(trimmed)
  const out: JsonRpcMessage[] = []
  for (const line of trimmed.split(/\r?\n/)) {
    if (line.startsWith('data:')) out.push(...parseRequestMessages(line.slice(5)))
  }
  return out
}

/** Status category of one JSON-RPC response message. */
export function messageStatus(message: JsonRpcMessage | undefined, httpStatus: number): string {
  if (!message) {
    if (httpStatus === 202) return 'accepted'
    return httpStatus >= 200 && httpStatus < 300 ? 'ok' : httpCategory(httpStatus)
  }
  if (isRecord(message.error)) {
    const code = typeof message.error.code === 'number' ? message.error.code : null
    return code === null ? 'rpc_error' : `rpc_error:${code}`
  }
  const result = message.result
  if (isRecord(result)) {
    const sc = isRecord(result.structuredContent) ? result.structuredContent : null
    if (result.isError === true) return `tool_error:${safeCode(sc?.error) ?? 'unknown'}`
    if (sc && sc.available === false) return `unavailable:${safeCode(sc.code) ?? 'unknown'}`
  }
  return 'ok'
}

export function httpCategory(status: number): string {
  if (status === 429) return 'http_429'
  if (status === 403) return 'http_403'
  if (status >= 500) return 'http_5xx'
  if (status >= 400) return 'http_4xx'
  return `http_${status}`
}

/** Build one event per request message, matching responses by id. */
export function buildEvents(
  requestBody: string,
  responseBody: string,
  httpStatus: number,
  durationMs: number
): UsageEvent[] {
  const requests = parseRequestMessages(requestBody)
  if (requests.length === 0) {
    return [{ method: 'invalid', tool: '-', status: httpCategory(httpStatus === 200 ? 400 : httpStatus), durationMs }]
  }
  const responses = parseResponseMessages(responseBody)
  const byId = new Map<string, JsonRpcMessage>()
  for (const r of responses) if (r.id !== undefined && r.id !== null) byId.set(JSON.stringify(r.id), r)
  const single = requests.length === 1 ? responses[0] : undefined
  return requests.map((req) => {
    const method = safeMethod(req.method)
    const params = isRecord(req.params) ? req.params : {}
    const tool = method === 'tools/call' ? safeTool(params.name) : '-'
    const isNotification = req.id === undefined || req.id === null
    const match = isNotification ? undefined : byId.get(JSON.stringify(req.id)) ?? single
    const status = httpStatus >= 400 ? httpCategory(httpStatus) : messageStatus(match, httpStatus)
    const meta = isRecord(params._meta) ? params._meta : {}
    const clientInfo = isRecord(params.clientInfo) ? params.clientInfo : isRecord(meta[CLIENT_INFO_META_KEY]) ? meta[CLIENT_INFO_META_KEY] : null
    return { method, tool, status, durationMs, clientName: safeClientName(clientInfo?.name) }
  })
}

/** Asia/Taipei date (YYYY-MM-DD) and hour (HH). */
export function taipeiParts(now: Date): { date: string; hour: string } {
  const t = new Date(now.getTime() + 8 * 3600_000).toISOString()
  return { date: t.slice(0, 10), hour: t.slice(11, 13) }
}

export function latencyBucket(ms: number): string {
  if (ms < 300) return 'lt300ms'
  if (ms < 1000) return 'lt1s'
  if (ms < 3000) return 'lt3s'
  return 'ge3s'
}

/** Redis commands (Upstash pipeline format) for a set of events. */
export function usageCommands(events: UsageEvent[], now: Date = new Date()): (string | number)[][] {
  const { date, hour } = taipeiParts(now)
  const usageKey = `mcp:usage:${date}`
  const hoursKey = `mcp:hours:${date}`
  const clientsKey = `mcp:clients:${date}`
  const ttl = USAGE_TTL_DAYS * 86400
  const cmds: (string | number)[][] = []
  let clients = false
  for (const e of events) {
    const field = `${e.method}|${e.tool}|${e.status}`
    const ms = Math.max(0, Math.round(e.durationMs))
    cmds.push(['HINCRBY', usageKey, field, 1])
    cmds.push(['HINCRBY', usageKey, `${field}|ms`, ms])
    cmds.push(['HINCRBY', usageKey, `${field}|${latencyBucket(ms)}`, 1])
    cmds.push(['HINCRBY', hoursKey, hour, 1])
    if (e.clientName) {
      cmds.push(['HINCRBY', clientsKey, e.clientName, 1])
      clients = true
    }
  }
  if (cmds.length === 0) return cmds
  cmds.push(['EXPIRE', usageKey, ttl], ['EXPIRE', hoursKey, ttl])
  if (clients) cmds.push(['EXPIRE', clientsKey, ttl])
  return cmds
}

/** Send counters to Redis. Never throws; resolves false on any failure. */
export async function recordUsage(events: UsageEvent[], config: UsageConfig | null = usageConfig()): Promise<boolean> {
  if (!config || events.length === 0) return false
  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(usageCommands(events)),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    return response.ok
  } catch {
    return false
  }
}
