// Basic fixed-window rate limit for /mcp, per client IP plus a per-instance
// ceiling. In-memory, so on Vercel it is per server instance — a guard
// against runaway agents, not a hard quota. The backend still applies its
// own global limit (100/min per IP; all MCP traffic reaches it from Vercel).
// Note: hosted AI clients (ChatGPT, Claude, …) call from shared egress IPs,
// so the per-IP limit is deliberately generous.

const WINDOW_MS = 60_000
function limitFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name])
  return Number.isInteger(value) && value > 0 ? value : fallback
}

/** Requests per minute; override with MCP_RATE_LIMIT_PER_IP / MCP_RATE_LIMIT_GLOBAL (server env). */
export const PER_IP_LIMIT = limitFromEnv('MCP_RATE_LIMIT_PER_IP', 120)
export const GLOBAL_LIMIT = limitFromEnv('MCP_RATE_LIMIT_GLOBAL', 600)
const MAX_TRACKED_IPS = 5_000

type Window = { start: number; count: number }

const perIp = new Map<string, Window>()
let globalWindow: Window = { start: 0, count: 0 }

function bump(window: Window | undefined, now: number): Window {
  if (!window || now - window.start >= WINDOW_MS) return { start: now, count: 1 }
  return { start: window.start, count: window.count + 1 }
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  return first || headers.get('x-real-ip')?.trim() || 'unknown'
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number }

export function checkRateLimit(ip: string, now: number = Date.now()): RateLimitResult {
  globalWindow = bump(globalWindow, now)
  if (globalWindow.count > GLOBAL_LIMIT) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((globalWindow.start + WINDOW_MS - now) / 1000)) }
  }

  if (perIp.size >= MAX_TRACKED_IPS) {
    perIp.forEach((window, key) => {
      if (now - window.start >= WINDOW_MS) perIp.delete(key)
    })
    if (perIp.size >= MAX_TRACKED_IPS) perIp.clear()
  }

  const next = bump(perIp.get(ip), now)
  perIp.set(ip, next)
  if (next.count > PER_IP_LIMIT) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((next.start + WINDOW_MS - now) / 1000)) }
  }
  return { ok: true }
}
