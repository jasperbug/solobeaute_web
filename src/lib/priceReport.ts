import { SPACE_CITIES, cityPagePath, normalizeCityName, type SpaceCity } from './cities'
import { SERVICE_GROUPS, median } from './cityPages'
import { spaceTypeLabel } from './spaces'
import type { PublicSpace, SpaceType } from './types'

// ---------------------------------------------------------------------------
// /spaces/price-report — 美業空間時租行情. Every number is computed here from
// the live public space list (already reduced by toPublicSpace()); nothing is
// hard-coded. Never add booking / revenue / user-count figures to this page.
// ---------------------------------------------------------------------------

export type RateSummary = {
  count: number
  min: number | null
  max: number | null
  median: number | null
}

export type RateRow = RateSummary & { label: string; href?: string }
export type ShareRow = { label: string; count: number; share: number }

export type PriceReport = {
  total: number
  cityCount: number
  hourly: RateSummary
  /** Lower / upper quartile of the hourly rate (nearest-rank), for「中間一半」. */
  hourlyQuartiles: { q1: number; q3: number } | null
  hourlyBands: ShareRow[]
  byType: RateRow[]
  byCity: RateRow[]
  halfDay: RateSummary
  fullDay: RateSummary
  /** Median of fullDayRate / hourlyRate over spaces that have both. */
  fullDayHoursEquivalent: number | null
  minimumHours: ShareRow[]
  services: ShareRow[]
  equipment: ShareRow[]
  withRoomScan: number
  lastUpdated: string | null
}

function summarize(values: Array<number | null>): RateSummary {
  const list = values.filter((v): v is number => typeof v === 'number')
  return {
    count: list.length,
    min: list.length ? Math.min(...list) : null,
    max: list.length ? Math.max(...list) : null,
    median: median(list),
  }
}

function share(count: number, total: number): number {
  return total > 0 ? count / total : 0
}

/** Nearest-rank percentile. */
function percentile(sorted: number[], p: number): number {
  const rank = Math.max(1, Math.ceil(p * sorted.length))
  return sorted[rank - 1]
}

const BANDS: Array<{ label: string; min: number; max: number }> = [
  { label: 'NT$100 以下', min: 0, max: 100 },
  { label: 'NT$101–150', min: 101, max: 150 },
  { label: 'NT$151–200', min: 151, max: 200 },
  { label: 'NT$201–250', min: 201, max: 250 },
  { label: 'NT$251–300', min: 251, max: 300 },
  { label: 'NT$301 以上', min: 301, max: Number.POSITIVE_INFINITY },
]

// Services shown in the report. Same matchers as the city pages
// (SERVICE_GROUPS, keyword priority 美睫→美容→霧眉→美甲…), plus a few extra rows.
const SERVICE_LABELS: Record<string, string> = {
  lash: '美睫（嫁接睫毛、睫毛管理）',
  facial: '美容（臉部護膚）',
  brow: '霧眉、霧唇',
  nail: '美甲',
  hair: '美髮',
  makeup: '彩妝、新娘秘書',
}
const REPORT_SERVICE_GROUPS: Array<{ label: string; match: (service: string) => boolean }> = [
  ...SERVICE_GROUPS.map((group) => ({ label: SERVICE_LABELS[group.key] ?? group.keyword, match: group.match })),
  { label: '按摩（身體、油壓、運動、美胸）', match: (s) => s.includes('按摩') },
  { label: '紋繡（髮際線、黑眼圈遮瑕）', match: (s) => s.includes('紋綉') || s.includes('紋繡') || s.includes('遮瑕') },
  { label: '熱蠟除毛', match: (s) => s.includes('除毛') },
  { label: '耳燭、采耳', match: (s) => s.includes('耳燭') || s.includes('采耳') },
]

const TYPE_ORDER: SpaceType[] = ['OPEN_SPACE', 'CURTAIN_PARTITION', 'PRIVATE_ROOM']

export function buildPriceReport(spaces: PublicSpace[]): PriceReport {
  const total = spaces.length
  const hourlyRates = spaces.map((s) => s.hourlyRate).filter((r): r is number => r !== null).sort((a, b) => a - b)

  const byCity: RateRow[] = SPACE_CITIES.map((city: SpaceCity) => {
    const inCity = spaces.filter((s) => normalizeCityName(s.city) === city.name)
    return { label: city.name, href: cityPagePath(city), ...summarize(inCity.map((s) => s.hourlyRate)) }
  }).filter((row) => row.count > 0)

  const byType: RateRow[] = TYPE_ORDER.map((type) => ({
    label: spaceTypeLabel(type),
    ...summarize(spaces.filter((s) => s.spaceType === type).map((s) => s.hourlyRate)),
  })).filter((row) => row.count > 0)

  const ratios = spaces
    .filter((s) => s.fullDayRate && s.hourlyRate)
    .map((s) => (s.fullDayRate as number) / (s.hourlyRate as number))
  const ratioMedian = ratios.length
    ? (() => {
        const sorted = ratios.slice().sort((a, b) => a - b)
        const mid = Math.floor(sorted.length / 2)
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
      })()
    : null

  const hoursCounts = new Map<number, number>()
  spaces.forEach((s) => {
    if (s.minimumHours) hoursCounts.set(s.minimumHours, (hoursCounts.get(s.minimumHours) ?? 0) + 1)
  })

  const equipmentCounts = new Map<string, number>()
  spaces.forEach((s) => new Set(s.equipment).forEach((e) => equipmentCounts.set(e, (equipmentCounts.get(e) ?? 0) + 1)))

  const updated = spaces.map((s) => s.updatedAt).filter((d): d is string => Boolean(d)).sort()

  return {
    total,
    cityCount: byCity.length,
    hourly: summarize(hourlyRates),
    hourlyQuartiles: hourlyRates.length >= 4
      ? { q1: percentile(hourlyRates, 0.25), q3: percentile(hourlyRates, 0.75) }
      : null,
    hourlyBands: BANDS.map((band) => {
      const count = hourlyRates.filter((r) => r >= band.min && r <= band.max).length
      return { label: band.label, count, share: share(count, hourlyRates.length) }
    }).filter((row) => row.count > 0),
    byType,
    byCity,
    halfDay: summarize(spaces.map((s) => s.halfDayRate)),
    fullDay: summarize(spaces.map((s) => s.fullDayRate)),
    fullDayHoursEquivalent: ratioMedian === null ? null : Math.round(ratioMedian * 10) / 10,
    minimumHours: Array.from(hoursCounts.entries())
      .sort(([a], [b]) => a - b)
      .map(([hours, count]) => ({ label: `${hours} 小時`, count, share: share(count, total) })),
    services: REPORT_SERVICE_GROUPS.map((group) => {
      const count = spaces.filter((s) => s.recommendedServices.some(group.match)).length
      return { label: group.label, count, share: share(count, total) }
    }).filter((row) => row.count > 0),
    equipment: Array.from(equipmentCounts.entries())
      .map(([label, count]) => ({ label, count, share: share(count, total) }))
      .filter((row) => row.count >= 2)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-Hant'))
      .slice(0, 12),
    withRoomScan: spaces.filter((s) => s.roomScanUrl).length,
    lastUpdated: updated.length ? updated[updated.length - 1] : null,
  }
}

export function formatShare(value: number): string {
  return `${Math.round(value * 100)}%`
}
