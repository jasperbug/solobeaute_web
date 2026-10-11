import { createMcpHandler, originValidationResponse } from '@modelcontextprotocol/server'
import { waitUntil } from '@vercel/functions'

import { checkRateLimit, clientIp } from '@/lib/mcp/rateLimit'
import { createSoloBeauteMcpServer } from '@/lib/mcp/server'
import { buildEvents, recordUsage, usageConfig } from '@/lib/mcp/usage'

// ---------------------------------------------------------------------------
// https://www.solobeaute.com/mcp — SoloBeauté read-only MCP server.
// Stateless Streamable HTTP (MCP 2026-07-28; 2025-era clients are served by
// the SDK's stateless legacy fallback). One McpServer per request, JSON
// responses (no SSE), no sessions, no auth: every tool is read-only and only
// returns public, whitelisted data. See src/lib/mcp/.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const handler = createMcpHandler(() => createSoloBeauteMcpServer(), {
  responseMode: 'json',
  maxRequestBodySize: 64 * 1024,
  onerror: (error) => console.error('[mcp]', error.message),
})

// Browser requests must come from SoloBeauté itself (MCP spec: validate
// Origin against DNS rebinding / CSRF). Requests without Origin — every
// server-side MCP client — pass.
const ALLOWED_ORIGIN_HOSTS = [
  'www.solobeaute.com',
  'solobeaute.com',
  ...(process.env.NODE_ENV === 'production' ? [] : ['localhost', '127.0.0.1']),
]

const STATS_MAX_BODY = 64 * 1024
const STATS_READ_TIMEOUT_MS = 10_000

async function readCapped(body: Request | Response): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<string>((resolve) => {
    timer = setTimeout(() => resolve(''), STATS_READ_TIMEOUT_MS)
  })
  try {
    const text = await Promise.race([body.text().catch(() => ''), timeout])
    return text.length > STATS_MAX_BODY ? '' : text
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Anonymous usage stats (src/lib/mcp/usage.ts). Only when the Redis env is set;
 * otherwise the response is returned untouched. Runs after the response via
 * waitUntil and swallows every error, so it can never block or break /mcp.
 */
function withUsage(request: Request | null, response: Response, startedAt: number): Response {
  const config = usageConfig()
  if (!config || !request || request.method !== 'POST') return response
  try {
    const durationMs = Date.now() - startedAt
    const forStats = response.clone()
    waitUntil(
      (async () => {
        try {
          const [requestBody, responseBody] = await Promise.all([readCapped(request), readCapped(forStats)])
          await recordUsage(buildEvents(requestBody, responseBody, response.status, durationMs), config)
        } catch {
          // stats are best-effort
        }
      })()
    )
  } catch {
    // stats are best-effort
  }
  return response
}

async function handle(request: Request): Promise<Response> {
  const startedAt = Date.now()
  let statsRequest: Request | null = null
  if (usageConfig() && request.method === 'POST') {
    try {
      statsRequest = request.clone()
    } catch {
      statsRequest = null
    }
  }
  const response = await handleMcp(request)
  return withUsage(statsRequest, response, startedAt)
}

async function handleMcp(request: Request): Promise<Response> {
  const rejected = originValidationResponse(request, ALLOWED_ORIGIN_HOSTS)
  if (rejected) return rejected

  const limit = checkRateLimit(clientIp(request.headers))
  if (!limit.ok) {
    return Response.json(
      { jsonrpc: '2.0', error: { code: -32000, message: 'Too many requests. Please retry later.' }, id: null },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds), 'Cache-Control': 'no-store' } }
    )
  }

  const response = await handler.fetch(request)
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'no-store')
  headers.set('X-Robots-Tag', 'noindex')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export { handle as DELETE, handle as GET, handle as POST }
