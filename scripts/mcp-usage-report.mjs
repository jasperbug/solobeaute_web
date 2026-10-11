// Read the anonymous /mcp usage counters (src/lib/mcp/usage.ts) from Upstash Redis.
//
//   node scripts/mcp-usage-report.mjs [--days 7] [--json]
//
// Credentials come from env only and are never printed. Prefer the read-only token:
//   KV_REST_API_URL + KV_REST_API_READ_ONLY_TOKEN   (Vercel Marketplace "Upstash for Redis")
//   (also accepted: MCP_USAGE_REDIS_REST_URL / MCP_USAGE_REDIS_REST_READ_ONLY_TOKEN /
//    MCP_USAGE_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN, KV_REST_API_TOKEN)
// e.g. `vercel env pull .env.usage --environment=production` then
//      `node --env-file=.env.usage scripts/mcp-usage-report.mjs --days 7` (don't commit the file).

const args = process.argv.slice(2)
const daysArg = args.includes('--days') ? Number(args[args.indexOf('--days') + 1]) : 7
const days = Math.min(400, Math.max(1, Number.isFinite(daysArg) ? Math.floor(daysArg) : 7))
const asJson = args.includes('--json')

const env = process.env
const url = (env.MCP_USAGE_REDIS_REST_URL || env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || '').trim().replace(/\/+$/, '')
const token = (
  env.MCP_USAGE_REDIS_REST_READ_ONLY_TOKEN || env.KV_REST_API_READ_ONLY_TOKEN ||
  env.MCP_USAGE_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || ''
).trim()
if (!url || !token) {
  console.error('Missing Redis REST URL / token env (see the header of this script).')
  process.exit(2)
}

const taipeiDate = (offsetDays) => new Date(Date.now() + 8 * 3600_000 - offsetDays * 86400_000).toISOString().slice(0, 10)
const dates = Array.from({ length: days }, (_, i) => taipeiDate(days - 1 - i))

const commands = dates.flatMap((d) => [['HGETALL', `mcp:usage:${d}`], ['HGETALL', `mcp:hours:${d}`], ['HGETALL', `mcp:clients:${d}`]])
const response = await fetch(`${url}/pipeline`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(commands),
})
if (!response.ok) {
  console.error(`Redis REST error: HTTP ${response.status}`)
  process.exit(1)
}
const results = await response.json()
const toObj = (r) => {
  const v = r?.result
  if (Array.isArray(v)) { const o = {}; for (let i = 0; i < v.length; i += 2) o[v[i]] = Number(v[i + 1]); return o }
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, Number(x)]))
  return {}
}

const report = { from: dates[0], to: dates[dates.length - 1], days: [], totals: { messages: 0, toolCalls: 0, byTool: {}, byStatus: {}, byMethod: {}, clients: {} } }
dates.forEach((date, i) => {
  const usage = toObj(results[i * 3]); const hours = toObj(results[i * 3 + 1]); const clients = toObj(results[i * 3 + 2])
  const rows = {}
  for (const [field, n] of Object.entries(usage)) {
    const parts = field.split('|')
    const key = parts.slice(0, 3).join('|')
    const row = (rows[key] ??= { method: parts[0], tool: parts[1], status: parts[2], count: 0, totalMs: 0, buckets: {} })
    if (parts.length === 3) row.count += n
    else if (parts[3] === 'ms') row.totalMs += n
    else row.buckets[parts[3]] = (row.buckets[parts[3]] ?? 0) + n
  }
  const list = Object.values(rows).map((r) => ({ ...r, avgMs: r.count ? Math.round(r.totalMs / r.count) : null }))
  const messages = list.reduce((s, r) => s + r.count, 0)
  report.days.push({ date, messages, rows: list, hours, clients })
  report.totals.messages += messages
  for (const r of list) {
    report.totals.byMethod[r.method] = (report.totals.byMethod[r.method] ?? 0) + r.count
    report.totals.byStatus[r.status] = (report.totals.byStatus[r.status] ?? 0) + r.count
    if (r.method === 'tools/call') {
      report.totals.toolCalls += r.count
      const t = (report.totals.byTool[r.tool] ??= { count: 0, ok: 0, totalMs: 0 })
      t.count += r.count; t.totalMs += r.totalMs; if (r.status === 'ok') t.ok += r.count
    }
  }
  for (const [c, n] of Object.entries(clients)) report.totals.clients[c] = (report.totals.clients[c] ?? 0) + n
})

if (asJson) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(`SoloBeauté /mcp usage ${report.from} – ${report.to} (Asia/Taipei)`)
  console.log(`messages: ${report.totals.messages}   tool calls: ${report.totals.toolCalls}`)
  console.log('\nper day:')
  for (const d of report.days) console.log(`  ${d.date}  ${String(d.messages).padStart(6)}`)
  console.log('\nby method:'); for (const [k, n] of Object.entries(report.totals.byMethod).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(28)} ${n}`)
  console.log('\nby tool (tools/call):')
  for (const [k, t] of Object.entries(report.totals.byTool).sort((a, b) => b[1].count - a[1].count))
    console.log(`  ${k.padEnd(24)} ${String(t.count).padStart(6)}  ok ${t.ok}  avg ${t.count ? Math.round(t.totalMs / t.count) : '-'} ms`)
  console.log('\nby status:'); for (const [k, n] of Object.entries(report.totals.byStatus).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(36)} ${n}`)
  console.log('\nclients (clientInfo.name):'); for (const [k, n] of Object.entries(report.totals.clients).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(40)} ${n}`)
}
