// Tests for the anonymous /mcp usage stats (src/lib/mcp/usage.ts + src/app/mcp/route.ts).
// Runs an in-process mock of the Upstash Redis REST API and checks what /mcp sends to it.
//
//   npm run build
//   MCP_USAGE_REDIS_REST_URL=http://127.0.0.1:3490 MCP_USAGE_REDIS_REST_TOKEN=usage-test-token \
//     MCP_RATE_LIMIT_PER_IP=1000 npx next start -p 3000
//   MCP_URL=http://localhost:3000/mcp npm run test:mcp-usage
//
// Test token only — never a real one.

import http from 'node:http'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const MCP_URL = process.env.MCP_URL ?? 'http://localhost:3000/mcp'
const PORT = Number(process.env.MCP_USAGE_MOCK_PORT ?? 3490)
const TOKEN = 'usage-test-token'

// ---- mock Upstash REST (/pipeline: HINCRBY, EXPIRE, HGETALL) -------------
const store = new Map() // key → Map(field → number)
const ttl = new Map()
const raw = [] // every request body received
let mode = 'ok' // ok | error | hang
let authFailures = 0
const mock = http.createServer((req, res) => {
  let body = ''
  req.on('data', (c) => { body += c })
  req.on('end', () => {
    if (req.headers.authorization !== `Bearer ${TOKEN}`) { authFailures++; res.writeHead(401).end('{"error":"unauthorized"}'); return }
    raw.push({ path: req.url, body, headers: { ...req.headers } })
    if (mode === 'hang') return // never answer
    if (mode === 'error') { res.writeHead(500).end('{"error":"boom"}'); return }
    const cmds = JSON.parse(body)
    const out = cmds.map(([cmd, key, ...rest]) => {
      if (cmd === 'HINCRBY') {
        const h = store.get(key) ?? new Map(); store.set(key, h)
        h.set(rest[0], (h.get(rest[0]) ?? 0) + Number(rest[1])); return { result: h.get(rest[0]) }
      }
      if (cmd === 'EXPIRE') { ttl.set(key, Number(rest[0])); return { result: 1 } }
      if (cmd === 'HGETALL') { const h = store.get(key); return { result: h ? [...h].flatMap(([f, v]) => [f, String(v)]) : [] } }
      return { error: `unsupported ${cmd}` }
    })
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(out))
  })
})
await new Promise((r) => mock.listen(PORT, '127.0.0.1', r))

// ---- helpers ---------------------------------------------------------------
let passed = 0, failed = 0
const check = (name, ok, extra = '') => { if (ok) { passed++; console.log(`  ✓ ${name}`) } else { failed++; console.log(`  ✗ ${name} ${extra}`) } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const UA = 'UsageTest-UA/9.9 (unique-ua-marker-4f2a)'
let nextId = 1
async function post(body, headers = {}) {
  const t0 = Date.now()
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-06-18', 'User-Agent': UA, 'X-Forwarded-For': '203.0.113.77', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
  const text = await res.text()
  return { status: res.status, text, ms: Date.now() - t0 }
}
const rpc = (method, params) => post({ jsonrpc: '2.0', id: nextId++, method, params })
const call = (name, args) => rpc('tools/call', { name, arguments: args })
const taipeiDate = () => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
const usage = () => Object.fromEntries(store.get(`mcp:usage:${taipeiDate()}`) ?? [])
const count = (field) => usage()[field] ?? 0
async function settle(n) { for (let i = 0; i < 50 && raw.length < n; i++) await sleep(100) }

// ---- 1. recording ----------------------------------------------------------
console.log('== recording')
const SPACE_ID = 'bbbbbbbb-0000-4000-8000-00000000dead'
await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'usage-test-client', version: '1.0' } })
await rpc('tools/list', {})
const search = await call('search_spaces', { city: '台北市', limit: 1 })
await call('get_space_availability', { spaceId: SPACE_ID })
await call('get_space_availability', { spaceId: SPACE_ID, from: '1999-01-01', to: '1999-01-02' })
await call('evil_tool_secret_marker', { city: 'Kaohsiung-marker' })
await post('{not json')
await rpc('totally/unknown-method-marker', {})
await rpc('tools/list', { _meta: { 'io.modelcontextprotocol/clientInfo': { name: 'Claude <script>2026', version: '2' } } })
const foreign = await post({ jsonrpc: '2.0', id: nextId++, method: 'tools/list', params: {} }, { Origin: 'https://evil.example' })
await settle(10)
await sleep(300)
const u = usage()
check('search response still normal', search.status === 200 && search.text.includes('"spaces"'))
check('initialize counted', count('initialize|-|ok') === 1)
check('tools/list counted (incl. 2026 _meta request)', count('tools/list|-|ok') === 2)
check('tools/call search_spaces ok counted', count('tools/call|search_spaces|ok') === 1)
check('unknown space → tool_error:SPACE_NOT_FOUND', count('tools/call|get_space_availability|tool_error:SPACE_NOT_FOUND') === 1, JSON.stringify(u))
check('bad range → tool_error:INVALID_RANGE', count('tools/call|get_space_availability|tool_error:INVALID_RANGE') === 1, JSON.stringify(u))
check('unknown tool name stored as "unknown"', Object.keys(u).some((k) => k.startsWith('tools/call|unknown|')))
check('invalid JSON → invalid|-|http_4xx', Object.keys(u).some((k) => k.startsWith('invalid|-|')))
check('unknown method stored as "other"', Object.keys(u).some((k) => k.startsWith('other|-|')))
check('foreign Origin still 403', foreign.status === 403)
check('foreign Origin recorded as http_403', count('tools/list|-|http_403') === 1, JSON.stringify(u))
check('duration total recorded', (u['tools/call|search_spaces|ok|ms'] ?? -1) >= 0)
check('latency bucket recorded', Object.keys(u).some((k) => /^tools\/call\|search_spaces\|ok\|(lt300ms|lt1s|lt3s|ge3s)$/.test(k)))
const hours = store.get(`mcp:hours:${taipeiDate()}`)
check('hour histogram recorded', hours && [...hours.values()].reduce((a, b) => a + b, 0) >= 10)
const clients = Object.fromEntries(store.get(`mcp:clients:${taipeiDate()}`) ?? [])
check('client name from initialize', clients['usage-test-client'] === 1, JSON.stringify(clients))
check('client name from 2026 _meta, sanitised', clients['Claude script2026'] === 1, JSON.stringify(clients))
check('keys expire (TTL set)', ttl.get(`mcp:usage:${taipeiDate()}`) > 300 * 86400)
check('auth: bearer token sent', authFailures === 0 && raw.length > 0)

// ---- 2. privacy: nothing identifying in what was sent ------------------------
console.log('== privacy')
const sent = raw.map((r) => r.body).join('\n')
const forbidden = ['203.0.113.77', '127.0.0.1', '::1', 'unique-ua-marker', 'UsageTest-UA', '台北市', SPACE_ID, '1999-01-01', 'Kaohsiung-marker', 'evil_tool_secret_marker', 'unknown-method-marker', 'SoloBeauté 官方網站', '"notice"', 'X-Partner-Key', 'partner']
for (const f of forbidden) check(`not stored: ${f}`, !sent.includes(f))
check('only HINCRBY/EXPIRE commands', raw.every((r) => JSON.parse(r.body).every((c) => c[0] === 'HINCRBY' || c[0] === 'EXPIRE')))
const allFields = [...store.values()].flatMap((h) => [...h.keys()])
check('every usage field matches the fixed format', allFields.every((f) => /^([a-z/_-]+\|[a-z_-]+\|[a-z0-9_:A-Z-]+(\|(ms|lt300ms|lt1s|lt3s|ge3s))?|\d\d|[A-Za-z0-9 ._\-/@()]{1,40})$/.test(f)), JSON.stringify(allFields))

// ---- 3. report script --------------------------------------------------------
console.log('== report script')
const run = promisify(execFile)
const env = { ...process.env, MCP_USAGE_REDIS_REST_URL: `http://127.0.0.1:${PORT}`, MCP_USAGE_REDIS_REST_READ_ONLY_TOKEN: TOKEN }
const { stdout: json } = await run('node', ['scripts/mcp-usage-report.mjs', '--days', '2', '--json'], { env })
const rep = JSON.parse(json)
check('report: tool calls counted', rep.totals.toolCalls === 4, String(rep.totals.toolCalls))
check('report: search_spaces ok 1', rep.totals.byTool.search_spaces?.ok === 1)
check('report: clients listed', rep.totals.clients['usage-test-client'] === 1)
const { stdout: text } = await run('node', ['scripts/mcp-usage-report.mjs', '--days', '2'], { env })
check('report: text output', text.includes('by tool') && text.includes('search_spaces'))
check('report: token never printed', !json.includes(TOKEN) && !text.includes(TOKEN))

// ---- 4. failures never affect /mcp ----------------------------------------------
console.log('== store failures do not affect /mcp')
const baseline = await rpc('tools/list', {})
for (const m of ['error', 'hang']) {
  mode = m
  const before = raw.length
  const r = await rpc('tools/list', {})
  const s = await call('get_brand_facts', {})
  check(`${m}: tools/list 200 and same body`, r.status === 200 && r.text.replace(/"id":\d+/, '') === baseline.text.replace(/"id":\d+/, ''))
  check(`${m}: tool call works`, s.status === 200 && s.text.includes('SoloBeauté'))
  check(`${m}: response not delayed (${r.ms} ms, ${s.ms} ms)`, r.ms < 1500 && s.ms < 3000)
  await settle(before + 2)
  check(`${m}: recording was attempted`, raw.length >= before + 2)
}
mode = 'ok'

mock.closeAllConnections?.()
mock.close()
console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
