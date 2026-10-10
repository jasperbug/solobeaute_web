import { createMcpHandler, originValidationResponse } from '@modelcontextprotocol/server'

import { checkRateLimit, clientIp } from '@/lib/mcp/rateLimit'
import { createSoloBeauteMcpServer } from '@/lib/mcp/server'

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

async function handle(request: Request): Promise<Response> {
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
