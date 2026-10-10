// End-to-end check of the read-only MCP server (/mcp) with the official MCP
// TypeScript client, over both protocol eras (2025 legacy + 2026-07-28).
//
//   npm run build && MCP_RATE_LIMIT_PER_IP=1000 npx next start -p 3000   (the run makes ~120 calls)
//   MCP_URL=http://localhost:3000/mcp npm run test:mcp
//
// Optional: MCP_HIDDEN_BEAUTICIAN_IDS=<uuid>,<uuid> — profile ids that exist
// but are NOT public; get_beautician must answer "not found" for each.
// Optional: MCP_MOCK_API=http://127.0.0.1:3480 — the server was built against
// scripts/mcp-mock-api.mjs (backend #192 availability format); adds exact
// free-slot / error-code checks and an audit of every upstream request.
//   With it, MCP_EXPECT_PARTNER_KEY=none|valid|invalid says how the server was started:
//   none = no SOLOBEAUTE_PUBLIC_API_PARTNER_KEY, valid = one of the mock's MOCK_PARTNER_KEYS,
//   invalid = a key the mock does not know (→ 401 → 「暫時無法取得」). MCP_TEST_PARTNER_KEY is
//   that test key (scanned for in every response) and MCP_SERVER_LOG the server's log file
//   (checked for the 401 line, and that the key is never logged). Test keys only — never a real one.
// Works against production too: MCP_URL=https://www.solobeaute.com/mcp

import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client'

const MCP_URL = process.env.MCP_URL ?? 'http://localhost:3000/mcp'
const HIDDEN_IDS = (process.env.MCP_HIDDEN_BEAUTICIAN_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
const MOCK_API = process.env.MCP_MOCK_API ?? ''
const PARTNER = MOCK_API ? (process.env.MCP_EXPECT_PARTNER_KEY ?? 'none') : ''
const TEST_KEY = process.env.MCP_TEST_PARTNER_KEY ?? ''
const SERVER_LOG = process.env.MCP_SERVER_LOG ?? ''
if (PARTNER && !['none', 'valid', 'invalid'].includes(PARTNER)) throw new Error(`MCP_EXPECT_PARTNER_KEY=${PARTNER}?`)
if (MOCK_API) await fetch(`${MOCK_API}/__mock/reset`)

// Must match scripts/mcp-mock-api.mjs
const MOCK_SPACES = {
  ok: 'aaaaaaaa-0000-4000-8000-000000000192',
  gone: 'aaaaaaaa-0000-4000-8000-000000000404',
  limited: 'aaaaaaaa-0000-4000-8000-000000000429',
  badRange: 'aaaaaaaa-0000-4000-8000-000000000400',
  preLaunch: 'aaaaaaaa-0000-4000-8000-000000000000',
}

const taipeiNow = () => {
  const t = new Date(Date.now() + 8 * 3600_000)
  return { date: t.toISOString().slice(0, 10), minutes: t.getUTCHours() * 60 + t.getUTCMinutes() }
}
const addDays = (d, n) => { const x = new Date(`${d}T00:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10) }
const mins = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))

/** Invariants for any successful availability result. */
function freeSlotsSane(sc) {
  if (sc.available !== true) return true
  const now = taipeiNow()
  const min = (sc.minBookingHours ?? 2) * 60
  return sc.days.every((day) =>
    !('bookedSlots' in day) && !('blockedSlots' in day) &&
    (day.isOpen || day.freeSlots.length === 0) &&
    (day.date >= now.date || day.freeSlots.length === 0) &&
    day.freeSlots.every((slot, i) =>
      mins(slot.endTime) - mins(slot.startTime) >= min &&
      mins(slot.startTime) >= mins(day.openTime) && mins(slot.endTime) <= mins(day.closeTime) &&
      (i === 0 || mins(slot.startTime) > mins(day.freeSlots[i - 1].endTime)) &&
      (day.date !== now.date || mins(slot.startTime) >= now.minutes)))
}

const NOTICE = {
  'zh-TW':
    '資料來自 SoloBeauté 官方網站。美業職人預約空間需在 SoloBeauté App 內完成，並由屋主確認；租金到現場以現金付給屋主。價格以 App 內顯示為準。SoloBeauté 目前尚未開放消費者預約美業服務。',
  en: 'Data from the official SoloBeauté website. Beauty professionals book spaces in the SoloBeauté app, and each booking is confirmed by the host; rent is paid to the host in cash on site. Prices shown in the app prevail. Consumer booking of beauty services is not open yet on SoloBeauté.',
}

const EXPECTED_TOOLS = [
  'get_beautician',
  'get_brand_facts',
  'get_price_overview',
  'get_space',
  'get_space_availability',
  'list_regions',
  'search_beauticians',
  'search_spaces',
]

// Keys that must never appear anywhere in a result.
const FORBIDDEN_KEYS = new Set([
  'userId', 'user', 'email', 'phone', 'address', 'latitude', 'longitude', 'lat', 'lng',
  'reviewerId', 'reviewer', 'host', 'hostId', 'bookings', 'schedules', 'cameraLocations',
])

let failures = 0
let passes = 0
function check(name, condition, detail = '') {
  if (condition) {
    passes += 1
    console.log(`  ✓ ${name}`)
  } else {
    failures += 1
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function forbiddenKeys(value, path = '$', found = []) {
  if (Array.isArray(value)) value.forEach((item, i) => forbiddenKeys(item, `${path}[${i}]`, found))
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(key)) found.push(`${path}.${key}`)
      forbiddenKeys(child, `${path}.${key}`, found)
    }
  }
  return found
}

function linksOk(links) {
  if (!links?.canonical || !links?.share) return false
  const canonical = new URL(links.canonical)
  const share = new URL(links.share)
  return (
    canonical.hostname === 'www.solobeaute.com' &&
    !canonical.search.includes('utm_') &&
    share.searchParams.get('utm_medium') === 'ai_agent' &&
    share.searchParams.get('utm_campaign') === 'mcp' &&
    Boolean(share.searchParams.get('utm_source'))
  )
}

async function connect(mode) {
  const client = new Client({ name: `solobeaute-smoke-${mode}`, version: '1.0.0' }, {
    versionNegotiation: { mode: mode === 'modern' ? 'auto' : 'legacy' },
  })
  await client.connect(new StreamableHTTPClientTransport(new URL(MCP_URL)))
  return client
}

async function run(mode) {
  console.log(`\n== ${mode} era (${MCP_URL})`)
  const client = await connect(mode)
  check('era negotiated', mode === 'modern' ? Boolean(client.getDiscoverResult()) : !client.getDiscoverResult())

  const all = []
  async function call(name, args = {}) {
    const res = await client.callTool({ name, arguments: args })
    const sc = res.structuredContent
    all.push({ name, args, res })
    const locale = args.locale ?? 'zh-TW'
    check(`${name}(${JSON.stringify(args)}) carries the ${locale} notice`, sc?.notice === NOTICE[locale])
    check(`${name} result has canonical + UTM share link`, linksOk(sc?.links ?? sc?.space?.links ?? sc?.beautician?.links))
    check(`${name} text content mirrors structuredContent`, res.content?.[0]?.type === 'text' && JSON.parse(res.content[0].text).notice === sc?.notice)
    if (TEST_KEY) check(`${name} result never contains the partner key`, !JSON.stringify(res).includes(TEST_KEY))
    return { res, sc }
  }

  // tools/list
  const { tools } = await client.listTools()
  check('exactly the 8 approved tools', JSON.stringify(tools.map((t) => t.name).sort()) === JSON.stringify(EXPECTED_TOOLS), tools.map((t) => t.name).join(','))
  check('every tool is readOnlyHint', tools.every((t) => t.annotations?.readOnlyHint === true))
  check('no booking / payment / contact tool', !tools.some((t) => /book|pay|contact|message|reserve|order/i.test(t.name)))

  // spaces
  const spaces = await call('search_spaces', { limit: 5 })
  check('search_spaces returns spaces', spaces.sc.total > 0 && spaces.sc.spaces.length === Math.min(5, spaces.sc.total))
  const taipeiZh = await call('search_spaces', { city: '台北市', limit: 20 })
  const taipeiEn = await call('search_spaces', { city: 'Taipei', locale: 'en', limit: 20 })
  check('city filter: 台北市 == Taipei', taipeiZh.sc.total > 0 && taipeiZh.sc.total === taipeiEn.sc.total)
  check('en labels translated', taipeiEn.sc.spaces.every((s) => s.city === 'Taipei City'))
  const lash = await call('search_spaces', { services: ['美睫'], maxHourlyRate: 300 })
  check('service + price filter', lash.sc.spaces.every((s) => s.hourlyRate <= 300 && s.recommendedServices.some((r) => r.includes('睫'))))
  const none = await call('search_spaces', { city: '火星市' })
  check('unknown city → 0 results + city list', none.sc.total === 0 && Array.isArray(none.sc.citiesWithSpaces))

  const spaceId = spaces.sc.spaces[0].id
  const detail = await call('get_space', { spaceId })
  check('get_space returns the space', detail.sc.space?.id === spaceId && 'description' in detail.sc.space)
  const detailEn = await call('get_space', { spaceId, locale: 'en' })
  check('get_space en canonical is /en/spaces/{id}', detailEn.sc.space.links.canonical.endsWith(`/en/spaces/${spaceId}`))
  const ghost = await call('get_space', { spaceId: '00000000-0000-4000-8000-000000000000' })
  check('unknown space id → SPACE_NOT_FOUND', ghost.res.isError === true && ghost.sc.error === 'SPACE_NOT_FOUND')
  const junk = await call('get_space', { spaceId: '../admin' })
  check('non-UUID space id → SPACE_NOT_FOUND', junk.sc.error === 'SPACE_NOT_FOUND')

  // availability (real backend: #192 live → free slots; not live → 「時段查詢尚未開放」)
  const avail = await call('get_space_availability', { spaceId })
  check(
    'availability: free slots or 「時段查詢尚未開放」',
    avail.sc.available === true || (avail.sc.status === 'AVAILABILITY_NOT_OPEN' && avail.sc.message.includes('時段查詢尚未開放')) ||
      (PARTNER === 'invalid' && avail.sc.status === 'AVAILABILITY_UNAVAILABLE'),
    JSON.stringify(avail.sc.status ?? avail.sc.available)
  )
  check('availability: only free slots, sane', freeSlotsSane(avail.sc))
  const availEn = await call('get_space_availability', { spaceId, locale: 'en' })
  check('availability en message', availEn.sc.available === true || availEn.sc.message.startsWith('Availability lookup is not open yet') ||
    (PARTNER === 'invalid' && availEn.sc.status === 'AVAILABILITY_UNAVAILABLE'))
  const today = taipeiNow().date
  const tooLong = await call('get_space_availability', { spaceId, from: today, to: addDays(today, 14) })
  check('availability 15 days → INVALID_RANGE', tooLong.sc.error === 'INVALID_RANGE')
  const tooOld = await call('get_space_availability', { spaceId, from: addDays(today, -2), to: today })
  check('availability from 2 days ago → INVALID_RANGE', tooOld.sc.error === 'INVALID_RANGE')
  const reversed = await call('get_space_availability', { spaceId, from: addDays(today, 3), to: addDays(today, 1) })
  check('availability to < from → INVALID_RANGE', reversed.sc.error === 'INVALID_RANGE')
  const badDate = await call('get_space_availability', { spaceId, from: '2027-02-30' })
  check('availability impossible date → INVALID_RANGE', badDate.sc.error === 'INVALID_RANGE')
  const tooFar = await call('get_space_availability', { spaceId, from: addDays(today, 25), to: addDays(today, 31) })
  check('availability past today + 30 → INVALID_RANGE', tooFar.sc.error === 'INVALID_RANGE')
  const ghostAvail = await call('get_space_availability', { spaceId: '00000000-0000-4000-8000-000000000000' })
  check('availability for unknown space → SPACE_NOT_FOUND', ghostAvail.sc.error === 'SPACE_NOT_FOUND')

  if (MOCK_API && PARTNER === 'invalid') {
    const t1 = addDays(today, 1)
    const rejected = await call('get_space_availability', { spaceId: MOCK_SPACES.ok, from: t1, to: t1 })
    check('mock 401 INVALID_PARTNER_KEY → AVAILABILITY_UNAVAILABLE 「暫時無法取得」',
      rejected.res.isError === true && rejected.sc.status === 'AVAILABILITY_UNAVAILABLE' && rejected.sc.message.includes('暫時無法取得'),
      JSON.stringify(rejected.sc.status ?? rejected.sc.available))
    const rejectedEn = await call('get_space_availability', { spaceId: MOCK_SPACES.ok, from: t1, to: t1, locale: 'en' })
    check('mock 401 → en 「temporarily unavailable」', rejectedEn.sc.status === 'AVAILABILITY_UNAVAILABLE' && /temporarily unavailable/i.test(rejectedEn.sc.message))
    const rejectedText = JSON.stringify(rejected.sc, (k, v) => (k === 'generatedAt' ? undefined : v)) // a timestamp may contain "401"
    check('mock 401: no 401 / partner details in the result', !/(^|\D)401(\D|$)|partner/i.test(rejectedText))
    const mockSpace = await call('get_space', { spaceId: MOCK_SPACES.ok })
    check('mock 401: other tools unaffected (no key on non-public routes)', mockSpace.sc.space?.title === 'MOCK 測試空間')
  }

  if (MOCK_API && PARTNER !== 'invalid') {
    const t1 = addDays(today, 1)
    const mock = await call('get_space_availability', { spaceId: MOCK_SPACES.ok, from: t1, to: addDays(t1, 3) })
    const expected = [
      [{ startTime: '10:00', endTime: '13:00' }, { startTime: '15:00', endTime: '20:00' }],
      [], // only a 1.5 h gap → below minBookingHours
      [], // closed
      [{ startTime: '09:00', endTime: '11:00' }, { startTime: '14:00', endTime: '18:00' }, { startTime: '19:00', endTime: '21:00' }],
    ]
    check('mock #192: available, free_slots exposure', mock.sc.available === true && mock.sc.slotsShown === 'free_slots' && mock.sc.days.length === 4)
    check(
      'mock #192: free slots = opening hours − booked − blocked (≥ 2 h)',
      JSON.stringify(mock.sc.days.map((d) => d.freeSlots)) === JSON.stringify(expected),
      JSON.stringify(mock.sc.days.map((d) => d.freeSlots))
    )
    check('mock #192: closed day stays closed', mock.sc.days[2].isOpen === false)
    check('mock #192: no booked / blocked slots, ids, names or reasons leak',
      freeSlotsSane(mock.sc) && !/bookedSlots|blockedSlots|bk-|MOCK_SECRET/.test(mock.res.content[0].text))
    check('mock #192: slotsNote present', typeof mock.sc.slotsNote === 'string' && mock.sc.slotsNote.includes('2'))
    const mockEn = await call('get_space_availability', { spaceId: MOCK_SPACES.ok, from: t1, to: t1, locale: 'en' })
    check('mock #192: en note', mockEn.sc.slotsNote?.startsWith('freeSlots are the gaps'))
    const yesterday = await call('get_space_availability', { spaceId: MOCK_SPACES.ok, from: addDays(today, -1), to: today })
    check('mock #192: from = yesterday accepted, past day has no free slots',
      yesterday.sc.available === true && yesterday.sc.days[0].isPast === true && yesterday.sc.days[0].freeSlots.length === 0 && freeSlotsSane(yesterday.sc))
    const twoWeeks = await call('get_space_availability', { spaceId: MOCK_SPACES.ok, from: today, to: addDays(today, 13) })
    check('mock #192: 14 days accepted by MCP and backend rules', twoWeeks.sc.available === true && twoWeeks.sc.days.length === 14)
    check('mock #192: maxDate (today + 30) tolerated and passed through', twoWeeks.sc.maxDate === addDays(today, 30), String(twoWeeks.sc.maxDate))
    const lastDay = await call('get_space_availability', { spaceId: MOCK_SPACES.ok, from: addDays(today, 30) })
    check('mock #192: from = today + 30 accepted, default to clamped to maxDate',
      lastDay.sc.available === true && lastDay.sc.from === addDays(today, 30) && lastDay.sc.to === addDays(today, 30) && lastDay.sc.days.length === 1)
    const mockSpace = await call('get_space', { spaceId: MOCK_SPACES.ok })
    check('mock space: address / coordinates dropped', !/MOCK_SECRET|latitude|longitude/.test(mockSpace.res.content[0].text))
    const gone = await call('get_space_availability', { spaceId: MOCK_SPACES.gone, from: t1, to: t1 })
    check('mock #192: 404 SPACE_NOT_FOUND → SPACE_NOT_FOUND', gone.sc.error === 'SPACE_NOT_FOUND')
    const limited = await call('get_space_availability', { spaceId: MOCK_SPACES.limited, from: t1, to: t1 })
    check('mock #192: 429 → AVAILABILITY_UNAVAILABLE', limited.sc.status === 'AVAILABILITY_UNAVAILABLE')
    const badRange = await call('get_space_availability', { spaceId: MOCK_SPACES.badRange, from: t1, to: t1 })
    check('mock #192: 400 INVALID_DATE_RANGE → INVALID_RANGE', badRange.sc.error === 'INVALID_RANGE')
    const pre = await call('get_space_availability', { spaceId: MOCK_SPACES.preLaunch, from: t1, to: t1 })
    check('mock: route missing (before #192) → 「時段查詢尚未開放」', pre.sc.status === 'AVAILABILITY_NOT_OPEN')
  }

  // beauticians
  const bList = await call('search_beauticians', { limit: 20 })
  check('search_beauticians returns brand pages', bList.sc.total > 0)
  const withSlug = bList.sc.beauticians.find((b) => b.ref.startsWith('bty-'))
  const withoutSlug = bList.sc.beauticians.find((b) => /^[0-9a-f-]{36}$/.test(b.ref))
  if (withSlug) {
    const one = await call('get_beautician', { ref: withSlug.ref })
    check('get_beautician by slug', one.sc.beautician?.ref === withSlug.ref && Array.isArray(one.sc.beautician.services))
    check('slug lookup returns the full service list', one.sc.beautician.servicesComplete === true)
  }
  if (withoutSlug) {
    const one = await call('get_beautician', { ref: withoutSlug.ref })
    check('get_beautician by public-list ref (no slug)', one.sc.beautician?.ref === withoutSlug.ref)
  }
  const lashB = await call('search_beauticians', { specialty: 'lash', locale: 'en' })
  check('specialty filter (en keyword)', lashB.sc.total > 0)
  const nobody = await call('get_beautician', { ref: 'bty-00000000' })
  check('unknown slug → BEAUTICIAN_NOT_FOUND', nobody.res.isError === true && nobody.sc.error === 'BEAUTICIAN_NOT_FOUND')
  const random = await call('get_beautician', { ref: '00000000-0000-4000-8000-000000000000' })
  check('random UUID → BEAUTICIAN_NOT_FOUND', random.sc.error === 'BEAUTICIAN_NOT_FOUND')
  for (const id of HIDDEN_IDS) {
    const hidden = await call('get_beautician', { ref: id })
    check(`non-public profile ${id.slice(0, 8)}… → BEAUTICIAN_NOT_FOUND`, hidden.sc.error === 'BEAUTICIAN_NOT_FOUND')
    check(`non-public profile ${id.slice(0, 8)}… absent from search`, !bList.sc.beauticians.some((b) => b.ref === id))
  }

  // regions / prices / brand
  const regions = await call('list_regions')
  check('list_regions has cities', regions.sc.cities.length > 0)
  const price = await call('get_price_overview')
  check('price overview total == public spaces', price.sc.publicSpaces === spaces.sc.total)
  const priceTc = await call('get_price_overview', { city: 'Taichung', locale: 'en' })
  check('price overview for one city', priceTc.sc.publicSpaces > 0 && priceTc.sc.scope === 'Taichung City')
  const brandZh = await call('get_brand_facts')
  const brandEn = await call('get_brand_facts', { locale: 'en' })
  check('brand facts: consumer booking not open', brandZh.sc.consumerBookingOpen === false && brandEn.sc.consumerBookingOpen === false)

  // privacy scan over everything this run returned
  const leaks = all.flatMap(({ name, res }) => forbiddenKeys(res.structuredContent).map((p) => `${name}:${p}`))
  check('no forbidden keys (userId / phone / email / address / coordinates …)', leaks.length === 0, leaks.slice(0, 5).join(', '))

  await client.close()
}

await run('legacy')
await run('modern')

// Raw HTTP: Origin check
const evil = await fetch(MCP_URL, {
  method: 'POST',
  headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', origin: 'https://evil.example' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
})
console.log('\n== HTTP')
check('foreign Origin → 403', evil.status === 403, String(evil.status))

if (MOCK_API) {
  console.log('\n== upstream audit (mock API request log)')
  const log = await (await fetch(`${MOCK_API}/__mock/requests`)).json()
  const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  check('upstream requests recorded', log.length > 0, String(log.length))
  check('never GET /beauticians/<uuid>', !log.some((l) => new RegExp(`/beauticians/${uuid.source}`, 'i').test(l)))
  check('never GET /beauticians/:id/services', !log.some((l) => l.includes('/services')))
  check('never the old /spaces/:id/availability', !log.some((l) => /\/api\/v1\/spaces\/[^/]+\/availability/.test(l)))
  check('availability only via /public/spaces/:id/availability', log.filter((l) => l.includes('availability')).every((l) => l.includes('/api/v1/public/spaces/')))
  check('no out-of-range availability request reached the backend', !log.some((l) => l.includes('availability') && l.includes(`from=${addDays(taipeiNow().date, -2)}`)))
  for (const id of HIDDEN_IDS) check(`hidden profile ${id.slice(0, 8)}… never sent upstream`, !log.some((l) => l.includes(id)))

  console.log(`\n== partner key (expected: ${PARTNER})`)
  const partnerLog = await (await fetch(`${MOCK_API}/__mock/partner`)).json()
  const publicReqs = partnerLog.filter((e) => e.request.includes('/api/v1/public/'))
  const otherReqs = partnerLog.filter((e) => !e.request.includes('/api/v1/public/'))
  check('some /public/* requests were made', publicReqs.length > 0, String(publicReqs.length))
  check(`every /public/* request: X-Partner-Key ${PARTNER === 'none' ? 'not sent' : `sent (${PARTNER})`}`,
    publicReqs.every((e) => e.partnerKey === PARTNER), JSON.stringify(publicReqs.filter((e) => e.partnerKey !== PARTNER).slice(0, 3)))
  check('X-Partner-Key never sent to non-public routes (/spaces, /beauticians)', otherReqs.length > 0 && otherReqs.every((e) => e.partnerKey === 'none'))
  const probe = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  })
  const probeBody = await probe.text()
  check('/mcp HTTP response headers and body never carry the key',
    ![...probe.headers].some(([k, v]) => /partner/i.test(k) || (TEST_KEY && v.includes(TEST_KEY))) && (!TEST_KEY || !probeBody.includes(TEST_KEY)))
  if (SERVER_LOG) {
    const { readFileSync } = await import('node:fs')
    const serverLog = readFileSync(SERVER_LOG, 'utf8')
    if (PARTNER === 'invalid') {
      check('server logged the upstream 401', /\[mcp\] upstream 401 INVALID_PARTNER_KEY on GET \/public\/spaces\/[^ ?]+\/availability \(partner key set/.test(serverLog))
    } else {
      check('no upstream 401 logged', !serverLog.includes('upstream 401'))
    }
    if (TEST_KEY) check('server log never contains the partner key', !serverLog.includes(TEST_KEY))
  }
}

console.log(`\n${passes} passed, ${failures} failed`)
process.exit(failures ? 1 : 0)
