// End-to-end check of the read-only MCP server (/mcp) with the official MCP
// TypeScript client, over both protocol eras (2025 legacy + 2026-07-28).
//
//   npm run build && npx next start -p 3000
//   MCP_URL=http://localhost:3000/mcp npm run test:mcp
//
// Optional: MCP_HIDDEN_BEAUTICIAN_IDS=<uuid>,<uuid> — profile ids that exist
// but are NOT public; get_beautician must answer "not found" for each.
// Works against production too: MCP_URL=https://www.solobeaute.com/mcp

import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client'

const MCP_URL = process.env.MCP_URL ?? 'http://localhost:3000/mcp'
const HIDDEN_IDS = (process.env.MCP_HIDDEN_BEAUTICIAN_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean)

const NOTICE = {
  'zh-TW':
    '資料來自 SoloBeauté 官方網站。美業職人預約空間需在 SoloBeauté App 內完成，並由屋主確認；租金到現場以現金付給屋主。價格以 App 內顯示為準。SoloBeauté 目前尚未開放消費者線上預約美業服務。',
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

  // availability
  const avail = await call('get_space_availability', { spaceId })
  check(
    'availability: public endpoint result or 「時段查詢尚未開放」',
    avail.sc.available === true || (avail.sc.status === 'AVAILABILITY_NOT_OPEN' && avail.sc.message.includes('時段查詢尚未開放')),
    JSON.stringify(avail.sc.status ?? avail.sc.available)
  )
  const availEn = await call('get_space_availability', { spaceId, locale: 'en' })
  check('availability en message', availEn.sc.available === true || availEn.sc.message.startsWith('Availability lookup is not open yet'))
  const tooLong = await call('get_space_availability', { spaceId, from: '2026-11-01', to: '2026-11-20' })
  check('availability > 14 days → INVALID_RANGE', tooLong.sc.error === 'INVALID_RANGE')
  const ghostAvail = await call('get_space_availability', { spaceId: '00000000-0000-4000-8000-000000000000' })
  check('availability for unknown space → SPACE_NOT_FOUND', ghostAvail.sc.error === 'SPACE_NOT_FOUND')

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

console.log(`\n${passes} passed, ${failures} failed`)
process.exit(failures ? 1 : 0)
