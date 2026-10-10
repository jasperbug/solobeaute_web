import 'server-only'

// ---------------------------------------------------------------------------
// Partner key for the backend's public read-only API (jasperbug/solobeaute#192).
//
// When the server env SOLOBEAUTE_PUBLIC_API_PARTNER_KEY is set, requests to
// /public/* carry `X-Partner-Key`, so the backend counts them against the key's
// own bucket (600/min) instead of the shared per-IP anonymous limit (60/min) —
// all MCP traffic leaves Vercel from shared egress IPs. Unset → anonymous.
//
// Server only: the env name has no NEXT_PUBLIC_ prefix (never inlined into the
// browser bundle) and `server-only` makes a client import a build error. The key
// is never logged, cached or put in a tool result. The backend answers a wrong
// key with 401 (no fallback to the anonymous limit); see getUpstream in data.ts.
// ---------------------------------------------------------------------------

export const PARTNER_KEY_HEADER = 'X-Partner-Key'
/** Backend ignores keys shorter than this (MIN_PARTNER_KEY_LENGTH), so such a key always gets 401. */
const MIN_PARTNER_KEY_LENGTH = 32
/** Only the backend's /api/v1/public/* routes understand the header; nothing else receives the key. */
const PARTNER_PATH_PREFIX = '/public/'

let warnedShortKey = false

function partnerKey(): string | null {
  const key = process.env.SOLOBEAUTE_PUBLIC_API_PARTNER_KEY?.trim()
  return key ? key : null
}

export function partnerKeyConfigured(): boolean {
  return partnerKey() !== null
}

/** Extra request headers for an upstream path (relative to API_BASE_URL). */
export function partnerKeyHeaders(path: string): Record<string, string> {
  if (!path.startsWith(PARTNER_PATH_PREFIX)) return {}
  const key = partnerKey()
  if (!key) return {}
  if (key.length < MIN_PARTNER_KEY_LENGTH && !warnedShortKey) {
    warnedShortKey = true
    console.warn(
      `[mcp] SOLOBEAUTE_PUBLIC_API_PARTNER_KEY is shorter than ${MIN_PARTNER_KEY_LENGTH} characters; the backend ignores such keys and will answer 401`
    )
  }
  return { [PARTNER_KEY_HEADER]: key }
}
