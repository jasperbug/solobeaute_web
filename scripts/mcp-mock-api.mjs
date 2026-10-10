// Mock of the SoloBeauté backend for `npm run test:mcp` (MCP_MOCK_API mode).
// Proxies everything to the real API, except GET /api/v1/public/spaces/:id/availability
// and a few fake spaces, which follow the response format and error codes of
// backend PR jasperbug/solobeaute#192. Records every upstream path so the smoke
// test can assert what the MCP server did (and did not) call, and whether each
// request carried X-Partner-Key (recorded as none / valid / invalid — never the key).
//
//   MOCK_PARTNER_KEYS=<test key ≥ 32 chars> node scripts/mcp-mock-api.mjs   # listens on :3480
//   NEXT_PUBLIC_API_URL=http://127.0.0.1:3480/api/v1 npm run build
//   [SOLOBEAUTE_PUBLIC_API_PARTNER_KEY=<test key>] MCP_RATE_LIMIT_PER_IP=1000 npx next start -p 3000
//   MCP_URL=http://localhost:3000/mcp MCP_MOCK_API=http://127.0.0.1:3480 npm run test:mcp
//
// Like #192, a request to /api/v1/public/* with an X-Partner-Key that matches none of
// MOCK_PARTNER_KEYS gets 401 INVALID_PARTNER_KEY. The header is never forwarded upstream.

import http from 'node:http'

const PORT = Number(process.env.PORT ?? 3480)
const UPSTREAM = process.env.UPSTREAM ?? 'https://api.solobeaute.com'

const MOCK_SPACES = {
  ok: 'aaaaaaaa-0000-4000-8000-000000000192', // availability fixture below
  gone: 'aaaaaaaa-0000-4000-8000-000000000404', // availability → 404 SPACE_NOT_FOUND (became inactive)
  limited: 'aaaaaaaa-0000-4000-8000-000000000429', // availability → 429
  badRange: 'aaaaaaaa-0000-4000-8000-000000000400', // availability → 400 INVALID_DATE_RANGE
  preLaunch: 'aaaaaaaa-0000-4000-8000-000000000000', // availability route missing (before #192 ships)
}
const MOCK_IDS = new Set(Object.values(MOCK_SPACES))

// Test-only keys (never a real one). Like the backend, keys shorter than 32 chars are ignored.
const PARTNER_KEYS = (process.env.MOCK_PARTNER_KEYS ?? '').split(',').map((k) => k.trim()).filter((k) => k.length >= 32)

const requests = [] // 'GET /path?query'
const partnerLog = [] // { request, partnerKey: 'none' | 'valid' | 'invalid' }

// --- #192 range rules (resolvePublicAvailabilityRange) ---
const taipeiToday = () => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
const addDays = (d, n) => { const x = new Date(`${d}T00:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10) }
const validDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v
function resolveRange(q) {
  const f = q.get('from') || undefined
  const t = q.get('to') || undefined
  if ((f && !validDate(f)) || (t && !validDate(t))) return null
  const today = taipeiToday()
  const maxDate = addDays(today, 30) // today + MAX_ADVANCE_DAYS
  const from = f ?? today
  if (from < addDays(today, -1) || from > maxDate) return null
  if (t && t > maxDate) return null
  const to = t ?? (addDays(from, 29) > maxDate ? maxDate : addDays(from, 29))
  const days = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1
  if (to < from || days > 30) return null
  return { from, to, maxDate }
}

// Day patterns, by index from `from` (mod 4). Extra fields must be dropped by the MCP server.
const PATTERNS = [
  { isOpen: true, openTime: '10:00', closeTime: '20:00', bookedSlots: [['13:00', '15:00']], blockedSlots: [] },
  { isOpen: true, openTime: '10:00', closeTime: '20:00', bookedSlots: [['10:00', '11:00'], ['12:30', '20:00']], blockedSlots: [] },
  { isOpen: false, openTime: null, closeTime: null, bookedSlots: [], blockedSlots: [] },
  { isOpen: true, openTime: '09:00', closeTime: '21:00', bookedSlots: [['11:00', '13:00'], ['12:00', '14:00'], ['21:30', '22:00']], blockedSlots: [['18:00', '19:00']] },
]
const slot = ([startTime, endTime], i) => ({ startTime, endTime, bookingId: `bk-${i}`, beauticianName: 'MOCK_SECRET_NAME', reason: 'MOCK_SECRET_REASON' })

function availabilityBody(id, range) {
  const days = []
  for (let d = range.from, i = 0; d <= range.to; d = addDays(d, 1), i += 1) {
    const p = PATTERNS[i % PATTERNS.length]
    days.push({
      date: d, dayOfWeek: new Date(`${d}T00:00:00Z`).getUTCDay(), isOpen: p.isOpen, openTime: p.openTime, closeTime: p.closeTime,
      isOverride: p.blockedSlots.length > 0, bookedSlots: p.bookedSlots.map(slot), blockedSlots: p.blockedSlots.map(slot),
    })
  }
  return { success: true, data: { spaceId: id, timezone: 'Asia/Taipei', from: range.from, to: range.to, minBookingHours: 2, maxAdvanceDays: 30, maxDate: range.maxDate, days } }
}

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers })
  res.end(JSON.stringify(body))
}
const appError = (code, message) => ({ success: false, error: code, code, message })

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://mock')
  if (url.pathname === '/__mock/requests') return send(res, 200, requests)
  if (url.pathname === '/__mock/partner') return send(res, 200, partnerLog)
  if (url.pathname === '/__mock/reset') {
    requests.length = 0
    partnerLog.length = 0
    return send(res, 200, { ok: true })
  }
  const line = `${req.method} ${url.pathname}${url.search}`
  requests.push(line)
  const presented = req.headers['x-partner-key']
  const partnerKey = presented === undefined ? 'none' : PARTNER_KEYS.includes(String(presented).trim()) ? 'valid' : 'invalid'
  partnerLog.push({ request: line, partnerKey })

  const detail = url.pathname.match(/^\/api\/v1\/spaces\/([0-9a-f-]{36})$/)
  if (detail && MOCK_IDS.has(detail[1])) {
    return send(res, 200, { success: true, data: {
      id: detail[1], status: 'ACTIVE', deletedAt: null, title: 'MOCK 測試空間', city: '台北市', district: '大安區',
      spaceType: 'PRIVATE_ROOM', hourlyRate: 300, minimumHours: 2, equipment: [], recommendedServices: [], prohibitedServices: [],
      address: 'MOCK_SECRET_ADDRESS', latitude: 25.03, longitude: 121.54, ratingAvg: 0, ratingCount: 0,
    } })
  }

  const avail = url.pathname.match(/^\/api\/v1\/public\/spaces\/([^/]+)\/availability$/)
  if (avail) {
    const id = avail[1]
    if (id === MOCK_SPACES.preLaunch) {
      return send(res, 404, { message: `Route GET:${url.pathname} not found`, error: 'Not Found', statusCode: 404 })
    }
    // #192 checks the key first: a wrong key is 401, never downgraded to the anonymous limit
    if (partnerKey === 'invalid') return send(res, 401, appError('INVALID_PARTNER_KEY', 'Invalid partner key'))
    if (!MOCK_IDS.has(id)) return proxy(req, res) // real spaces: whatever the real backend says
    if (id === MOCK_SPACES.gone) return send(res, 404, appError('SPACE_NOT_FOUND', 'Space not found'))
    if (id === MOCK_SPACES.limited) return send(res, 429, { statusCode: 429, error: 'Too Many Requests', message: 'Rate limit exceeded, retry in 1 minute' })
    const range = resolveRange(url.searchParams)
    if (id === MOCK_SPACES.badRange || !range) {
      return send(res, 400, appError('INVALID_DATE_RANGE', 'Invalid date range: use YYYY-MM-DD, from <= to, at most 30 days, not in the past'))
    }
    return send(res, 200, availabilityBody(id, range), { 'cache-control': 'public, max-age=60' })
  }
  return proxy(req, res)
}).listen(PORT, () => console.log(`mcp mock api on :${PORT} → ${UPSTREAM}`))

async function proxy(req, res) {
  try {
    const r = await fetch(UPSTREAM + req.url, { method: req.method, headers: { accept: req.headers.accept ?? 'application/json' } })
    res.writeHead(r.status, { 'content-type': r.headers.get('content-type') ?? 'application/json' })
    res.end(Buffer.from(await r.arrayBuffer()))
  } catch (error) {
    send(res, 502, { error: String(error) })
  }
}
