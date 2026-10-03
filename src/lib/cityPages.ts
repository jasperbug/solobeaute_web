import { SPACE_CITIES, cityPagePath, getCityBySlug, normalizeCityName, type SpaceCity } from './cities'
import { cameraDisclosureLabel, formatNtd, groupSpacesByCity, spaceTypeLabel } from './spaces'
import type { PublicSpace, SpaceType } from './types'

// ---------------------------------------------------------------------------
// City landing pages: stats + copy, computed from the live public space list.
// zh-TW only. Templates: seo_copy_v1.md §5.1 (keyword order adjusted so
// 美睫／美容／霧眉 come before 美甲, per seo_geo_action_plan.md §0).
// Every number in the copy is computed here — nothing is hard-coded.
// ---------------------------------------------------------------------------

/** Pages with fewer spaces than this are rendered but marked noindex. */
export const CITY_INDEX_MIN_SPACES = 1

export type ServiceGroup = {
  key: string
  /** Search keyword used in title / description, e.g. 美睫 */
  keyword: string
  /** Wording used in sentences, e.g. 嫁接睫毛或睫毛管理 */
  prose: string
  match: (service: string) => boolean
}

// Priority order matters: it drives the title keywords and sentence order.
export const SERVICE_GROUPS: ServiceGroup[] = [
  { key: 'lash', keyword: '美睫', prose: '嫁接睫毛或睫毛管理', match: (s) => s.includes('睫毛') },
  { key: 'facial', keyword: '美容', prose: '臉部護膚', match: (s) => s.includes('護膚') },
  { key: 'brow', keyword: '霧眉', prose: '霧眉', match: (s) => s.includes('霧眉') },
  { key: 'nail', keyword: '美甲', prose: '美甲', match: (s) => s.includes('美甲') },
  { key: 'hair', keyword: '美髮', prose: '美髮', match: (s) => s.includes('美髮') },
  { key: 'makeup', keyword: '彩妝', prose: '彩妝或新娘秘書', match: (s) => s.includes('彩妝') || s.includes('新娘秘書') },
]
const PRIMARY_GROUP_KEYS = ['lash', 'facial', 'brow']

const EQUIPMENT_HIGHLIGHTS = ['美容床', '美容燈', '美甲桌椅', '洗頭台', '停車位', '淋浴間']

export type CountItem = { label: string; count: number }

export type CityStats = {
  city: SpaceCity
  spaces: PublicSpace[]
  count: number
  districts: CountItem[]
  types: CountItem[]
  minRate: number | null
  maxRate: number | null
  medianRate: number | null
  minHours: number | null
  maxHours: number | null
  withHalfOrFullDay: number
  withRoomScan: number
  services: Array<CountItem & { key: string; keyword: string }>
  equipment: CountItem[]
}

function countBy(values: string[]): CountItem[] {
  const counts = new Map<string, number>()
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-Hant'))
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = values.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

export function spacesInCity(all: PublicSpace[], city: SpaceCity): PublicSpace[] {
  const group = groupSpacesByCity(all.filter((space) => normalizeCityName(space.city) === city.name))
  return group[0]?.spaces ?? []
}

export function buildCityStats(all: PublicSpace[], city: SpaceCity): CityStats {
  const spaces = spacesInCity(all, city)
  const rates = spaces.map((s) => s.hourlyRate).filter((r): r is number => r !== null)
  const hours = spaces.map((s) => s.minimumHours).filter((h): h is number => h !== null)
  const typeOrder: SpaceType[] = ['PRIVATE_ROOM', 'CURTAIN_PARTITION', 'OPEN_SPACE']

  return {
    city,
    spaces,
    count: spaces.length,
    districts: countBy(spaces.map((s) => s.district).filter((d): d is string => Boolean(d))),
    types: countBy(spaces.map((s) => spaceTypeLabel(s.spaceType))).sort((a, b) => {
      const rank = (label: string) => {
        const index = typeOrder.findIndex((type) => spaceTypeLabel(type) === label)
        return index === -1 ? typeOrder.length : index
      }
      return b.count - a.count || rank(a.label) - rank(b.label)
    }),
    minRate: rates.length ? Math.min(...rates) : null,
    maxRate: rates.length ? Math.max(...rates) : null,
    medianRate: median(rates),
    minHours: hours.length ? Math.min(...hours) : null,
    maxHours: hours.length ? Math.max(...hours) : null,
    withHalfOrFullDay: spaces.filter((s) => s.halfDayRate || s.fullDayRate).length,
    withRoomScan: spaces.filter((s) => s.roomScanUrl).length,
    services: SERVICE_GROUPS.map((group) => ({
      key: group.key,
      keyword: group.keyword,
      label: group.prose,
      count: spaces.filter((s) => s.recommendedServices.some(group.match)).length,
    })),
    equipment: EQUIPMENT_HIGHLIGHTS.map((label) => ({
      label,
      count: spaces.filter((s) => s.equipment.includes(label)).length,
    })).filter((item) => item.count > 0),
  }
}

export function buildAllCityStats(all: PublicSpace[]): CityStats[] {
  return SPACE_CITIES.map((city) => buildCityStats(all, city))
}

export function isCityIndexable(stats: CityStats): boolean {
  return stats.count >= CITY_INDEX_MIN_SPACES
}

/** 「截至 2026 年 10 月」 in Taipei time. */
export function dataDateLabel(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', year: 'numeric', month: 'numeric' })
    .formatToParts(now)
  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  return `${year} 年 ${month} 月`
}

// --- phrase helpers ---------------------------------------------------------

function joinOr(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join('、')}或${items[items.length - 1]}`
}

function countList(items: CountItem[]): string {
  return items.map((item) => `${item.label} ${item.count} 個`).join('、')
}

function stripDistrictSuffix(district: string): string {
  // 中山區 → 中山 (template appends 等區); keep 鄉/鎮/市 names intact.
  return district.length > 2 && district.endsWith('區') ? district.slice(0, -1) : district
}

function rateText(stats: CityStats): string {
  if (stats.minRate === null || stats.maxRate === null) return ''
  return stats.minRate === stats.maxRate ? formatNtd(stats.minRate) : `${formatNtd(stats.minRate)}–${stats.maxRate}`
}

function hoursText(stats: CityStats): string | null {
  if (stats.minHours === null || stats.maxHours === null) return null
  return stats.minHours === stats.maxHours ? `${stats.minHours}` : `${stats.minHours}–${stats.maxHours}`
}

/** Up to 3 service keywords that actually exist in this city, in priority order. */
export function cityKeywords(stats: CityStats): string[] {
  return stats.services.filter((s) => s.count > 0).slice(0, 3).map((s) => s.keyword)
}

function nearbyCities(stats: CityStats, allStats: CityStats[]): CityStats[] {
  return stats.city.nearby
    .map((slug) => allStats.find((item) => item.city.slug === slug))
    .filter((item): item is CityStats => Boolean(item && item.count > 0))
}

// --- metadata ---------------------------------------------------------------

export function buildCityH1(city: SpaceCity): string {
  return `${city.short}美業空間時租`
}

/** <title> without the layout's " | SoloBeauté" suffix. */
export function buildCityTitle(stats: CityStats): string {
  const keywords = cityKeywords(stats)
  return `${stats.city.short}美業空間時租｜${keywords.length ? keywords.join('') : '美容'}工作室出租`
}

export function buildCityOgTitle(city: SpaceCity): string {
  return `${city.short}美業空間時租｜SoloBeauté`
}

export function buildCityDescription(stats: CityStats): string {
  const { city, count } = stats
  const keywords = cityKeywords(stats)
  const pros = `${(keywords.length ? keywords : ['美睫', '美容']).join('、')}職人`

  if (count === 0) {
    return `${city.short}目前還沒有上架的美業空間，新空間陸續上架中。可以先看看 SoloBeauté 其他縣市的美業空間，按小時租、免押金、免長約。`
  }
  if (count >= 3) {
    const districts = stats.districts.length >= 3
      ? `分布${stats.districts.slice(0, 3).map((d) => stripDistrictSuffix(d.label)).join('、')}等區`
      : `分布在${stats.districts.map((d) => d.label).join('、')}`
    return `${city.short}美容工作室時租 ${rateText(stats)}，目前 ${count} 個美業空間，${districts}。${pros}按小時租，免押金、免長約，現場付現。`
  }
  const where = stats.districts.map((d) => d.label).join('、')
  const from = stats.minRate !== null ? `，時租 ${formatNtd(stats.minRate)} 起` : ''
  // 南投 + 南投市 would read 「南投南投市」, so use the full county name there.
  const prefix = stats.districts.some((d) => d.label.startsWith(city.short)) ? city.name : city.short
  return `${prefix}${where}有 ${count} 個美業空間可以按小時租${from}。${pros}免押金、免長約，現場付現，新空間陸續上架中。`
}

// --- on-page copy -----------------------------------------------------------

/** Intro paragraphs (300–600 characters in total for every city with spaces). */
export function buildCityIntro(stats: CityStats, allStats: CityStats[], dateLabel: string): string[] {
  const { city, count, spaces } = stats
  const keywords = cityKeywords(stats)
  const nearby = nearbyCities(stats, allStats)
  const nearbyText = nearby.length
    ? `鄰近的${nearby.map((n) => `${n.city.short}（${n.count} 個）`).join('、')}`
    : '其他縣市'

  if (count === 0) {
    return [
      `截至 ${dateLabel}，SoloBeauté 在${city.name}還沒有上架的美業空間。新空間陸續上架中，可以先看看${nearbyText}的空間，或下載 SoloBeauté App 追蹤最新空間。`,
      `如果你在${city.short}有閒置的美容室、美睫或美甲座位，也可以在 SoloBeauté App 上架出租，讓附近的美業職人按小時租用。`,
    ]
  }

  const sentences: string[] = []
  sentences.push(`在${city.short}找${joinOr(keywords.length ? keywords : ['美業'])}的工作空間？`)

  const rate = rateText(stats)
  const hours = hoursText(stats)
  const servicePhrases = stats.services.filter((s) => s.count > 0)

  if (count === 1) {
    const space = spaces[0]
    sentences.push(
      `截至 ${dateLabel}，SoloBeauté 在${city.name}有 1 個屋主備好的美業空間，位於${space.district ?? city.name}，是一間${spaceTypeLabel(space.spaceType)}。`
    )
    const priceParts = [
      rate ? `時租 ${rate}` : null,
      hours ? `最低租用 ${hours} 小時` : null,
      space.halfDayRate ? `半日 ${formatNtd(space.halfDayRate)}` : null,
      space.fullDayRate ? `全日 ${formatNtd(space.fullDayRate)}` : null,
    ].filter(Boolean)
    if (priceParts.length) sentences.push(`${priceParts.join('，')}。`)
    if (space.recommendedServices.length) {
      sentences.push(`屋主標示適合的服務是${space.recommendedServices.slice(0, 5).join('、')}。`)
    }
    if (space.equipment.length) {
      sentences.push(`現場設備有${space.equipment.slice(0, 7).join('、')}。`)
    }
    const camera = cameraDisclosureLabel(space.cameraDisclosureStatus)
    if (camera) sentences.push(`${camera}。`)
  } else {
    sentences.push(
      `截至 ${dateLabel}，SoloBeauté 在${city.name}有 ${count} 個屋主備好的美業空間，分布在${countList(stats.districts)}。`
    )
    sentences.push(`空間類型有${countList(stats.types)}。`)
    const medianText = stats.minRate !== stats.maxRate && stats.medianRate !== null ? `，中位數 ${formatNtd(stats.medianRate)}` : ''
    const priceLine = [
      rate ? (stats.minRate === stats.maxRate ? `時租都是 ${rate}` : `時租 ${rate}${medianText}`) : null,
      hours ? `最低租用 ${hours} 小時` : null,
      stats.withHalfOrFullDay > 0 ? `其中 ${stats.withHalfOrFullDay} 個另有半日或全日價格` : null,
    ].filter(Boolean)
    if (priceLine.length) sentences.push(`${priceLine.join('；')}。`)
    if (servicePhrases.length) {
      sentences.push(
        `依屋主標示的建議服務，${servicePhrases.map((s) => `${s.count} 個適合${s.label}`).join('、')}。`
      )
    }
    if (stats.equipment.length) {
      sentences.push(`設備方面，${stats.equipment.map((e) => `${e.count} 個有${e.label}`).join('、')}。`)
    }
  }

  const missingPrimary = stats.services.filter((s) => PRIMARY_GROUP_KEYS.includes(s.key) && s.count === 0)
  if (missingPrimary.length > 0) {
    sentences.push(`目前還沒有屋主標示適合${missingPrimary.map((s) => s.label).join('、')}的空間。`)
  }
  if (stats.withRoomScan > 0) {
    sentences.push(count === 1 ? '這個空間有 3D 實景可以先看。' : `${stats.withRoomScan} 個空間有 3D 實景可以先看。`)
  }
  if (count <= 2) {
    sentences.push(`${city.short}的空間還不多，新空間陸續上架中，也可以看看${nearbyText}的空間。`)
  }

  return [
    sentences.join(''),
    `按小時租、免押金、免長約，在 SoloBeauté App 傳訊息給屋主確認時段，租金現場付給屋主。為了保護屋主，網站只顯示到區，完整位置請在 App 查看。`,
  ]
}

export type CityFaq = { question: string; answer: string }

export function buildCityFaq(stats: CityStats, allStats: CityStats[], dateLabel: string): CityFaq[] {
  const { city, count } = stats
  const nearby = nearbyCities(stats, allStats)
  const nearbyText = nearby.length ? nearby.map((n) => n.city.short).join('、') : '其他縣市'
  const rate = rateText(stats)
  const hours = hoursText(stats)

  if (count === 0) {
    return [
      {
        question: `${city.short}有美業空間可以按小時租嗎？`,
        answer: `截至 ${dateLabel}，SoloBeauté 在${city.name}還沒有上架的空間，新空間陸續上架中。可以先看看${nearbyText}的美業空間。`,
      },
      {
        question: `我在${city.short}有閒置的美容室，可以出租嗎？`,
        answer: '可以。下載 SoloBeauté App 就能上架空間、設定時租價格和可預約時段，美業職人會直接傳訊息給你。',
      },
      {
        question: '怎麼租 SoloBeauté 上的美業空間？需要押金嗎？',
        answer: '在 SoloBeauté App 打開空間頁，直接傳訊息給屋主確認時段。按小時租、免押金、免長約，租金現場付給屋主。',
      },
    ]
  }

  const priceAnswer = count === 1
    ? `截至 ${dateLabel}，${city.name}有 1 個美業空間，時租 ${rate}${hours ? `，最低租用 ${hours} 小時` : ''}。實際價格以空間頁和 App 顯示為準。`
    : `截至 ${dateLabel}，SoloBeauté 上${city.name}的 ${count} 個美業空間，${stats.minRate === stats.maxRate ? `時租都是 ${rate}` : `時租 ${rate}，中位數 ${formatNtd(stats.medianRate ?? 0)}`}${hours ? `，最低租用 ${hours} 小時` : ''}。實際價格以各空間頁和 App 顯示為準。`

  const primary = stats.services.filter((s) => PRIMARY_GROUP_KEYS.includes(s.key))
  const present = primary.filter((s) => s.count > 0)
  const absent = primary.filter((s) => s.count === 0)
  const nail = stats.services.find((s) => s.key === 'nail')
  let serviceAnswer: string
  if (present.length === 0) {
    const listed = Array.from(new Set(stats.spaces.flatMap((s) => s.recommendedServices))).slice(0, 6)
    serviceAnswer = `目前還沒有。${city.name}的空間屋主標示的服務是${listed.length ? listed.join('、') : '其他美業服務'}。美睫、美容、霧眉職人可以看看${nearbyText}的空間。`
  } else {
    serviceAnswer = `有。${city.name}的 ${count} 個空間中，${present.map((s) => `${s.count} 個適合${s.label}`).join('、')}`
    if (absent.length) serviceAnswer += `；目前還沒有標示適合${absent.map((s) => s.label).join('、')}的空間`
    serviceAnswer += nail && nail.count > 0 ? `。適合美甲的有 ${nail.count} 個。` : '。'
    serviceAnswer += '每個空間適合的服務以空間頁上屋主的標示為準。'
  }

  return [
    { question: `${city.short}美業空間時租多少錢？`, answer: priceAnswer },
    {
      question: `${city.short}哪些區有美業空間可以租？`,
      answer: `目前在${stats.districts.map((d) => `${d.label}（${d.count} 個）`).join('、')}。網站只顯示到區，完整位置請在 SoloBeauté App 查看。`,
    },
    { question: `${city.short}有適合美睫、美容、霧眉的空間嗎？`, answer: serviceAnswer },
    {
      question: `怎麼租${city.short}的美業空間？需要押金嗎？`,
      answer: '在 SoloBeauté App 打開空間頁，直接傳訊息給屋主確認時段。按小時租、免押金、免長約，租金現場付給屋主。',
    },
  ]
}

export { cityPagePath, getCityBySlug }
