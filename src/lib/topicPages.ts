// Short-keyword landing pages (batch 1):
//   /spaces/shared, /spaces/daily, /spaces/beauty-bed  (topic pages)
//   /spaces/city/{city}/{district}                      (district pages)
//
// Every number on these pages is computed from the live public spaces list
// (fetchPublicSpaces); nothing here is hardcoded. A page is indexable only when
// it has at least TOPIC_INDEX_MIN_SPACES spaces; below that it still renders
// (200, noindex,follow) and is dropped from the sitemap — never redirected or 404.

import type { QA } from '@/components/content/ContentBlocks'
import { localizePath, type AppLocale } from '@/i18n/config'
import { cityPagePath, getCityByName, getCityBySlug, type SpaceCity } from '@/lib/cities'
import { SERVICE_GROUPS, dataDateLabel, hasDistrictSections, median } from '@/lib/cityPages'
import {
  SERVICE_GROUP_EN,
  serviceTagEn,
  cityNameEn,
  cityShortEn,
  districtEn,
  districtShortEn,
  equipmentEn,
  joinEn,
  monthYearEn,
  plural,
  rateRangeEn,
  spaceTypeEn,
} from '@/lib/en'
import { formatNtd, groupSpacesByCity, shortCityName, spaceTypeLabel } from '@/lib/spaces'
import type { PublicSpace, SpaceType } from '@/lib/types'

export const TOPIC_INDEX_MIN_SPACES = 2

export function isTopicIndexable(count: number): boolean {
  return count >= TOPIC_INDEX_MIN_SPACES
}

// --- definitions -------------------------------------------------------------

export type TopicKey = 'shared' | 'daily' | 'beauty-bed' | ServiceKey
export type ServiceKey = 'nail' | 'brow' | 'lash'

type TopicDef = {
  key: TopicKey
  path: string
  labelZh: string
  labelEn: string
  match: (space: PublicSpace) => boolean
}

const SHARED_TYPES: SpaceType[] = ['OPEN_SPACE', 'CURTAIN_PARTITION']

export const TOPIC_PAGES: TopicDef[] = [
  {
    key: 'shared',
    path: '/spaces/shared',
    labelZh: '美業共享空間',
    labelEn: 'Shared workspaces',
    // Open spaces and curtained partitions only; anything the host marks as
    // fully private is not "shared", whatever its type.
    match: (s) => s.spaceType !== null && SHARED_TYPES.includes(s.spaceType) && !s.isFullyPrivate,
  },
  {
    key: 'daily',
    path: '/spaces/daily',
    labelZh: '日租・半日租',
    labelEn: 'Day and half-day rates',
    match: (s) => hasRate(s.halfDayRate) || hasRate(s.fullDayRate),
  },
  {
    key: 'beauty-bed',
    path: '/spaces/beauty-bed',
    labelZh: '美容床位',
    labelEn: 'Beauty bed',
    match: (s) => s.equipment.includes('美容床'),
  },
  {
    key: 'nail',
    path: '/spaces/service/nail',
    labelZh: '美甲工作室',
    labelEn: 'Nail studios',
    // Same matcher as the price report's 美甲師 row and the city pages (「美甲」).
    match: (s) => s.recommendedServices.some(serviceGroup('nail').match),
  },
  {
    key: 'brow',
    path: '/spaces/service/brow',
    labelZh: '霧眉・紋繡工作室',
    labelEn: 'Brow and PMU studios',
    // 「霧眉」 (same matcher as the price report's 霧眉師 row) plus the other
    // permanent-makeup tags hosts use.
    match: (s) => s.recommendedServices.some((x) => serviceGroup('brow').match(x) || BROW_EXTRA.includes(x)),
  },
  {
    key: 'lash',
    path: '/spaces/service/lash',
    labelZh: '美睫工作室',
    labelEn: 'Lash studios',
    // Same matcher as the price report's 美睫師 row, the lash guide and the city pages (「睫毛」).
    match: (s) => s.recommendedServices.some(serviceGroup('lash').match),
  },
]

const BROW_EXTRA = ['髮際線紋綉', '黑眼圈遮瑕']

function serviceGroup(key: string) {
  const group = SERVICE_GROUPS.find((g) => g.key === key)
  if (!group) throw new Error(`unknown service group ${key}`)
  return group
}

export const SERVICE_SLUGS: ServiceKey[] = ['nail', 'brow', 'lash']

export function getTopic(key: TopicKey): TopicDef {
  const topic = TOPIC_PAGES.find((t) => t.key === key)
  if (!topic) throw new Error(`unknown topic ${key}`)
  return topic
}

export type DistrictPageDef = {
  citySlug: string
  slug: string
  district: string
  /** Name used in copy: 中壢 / 中山區 (中山 alone is ambiguous). */
  label: string
  /**
   * workspace: 「中壢美業空間時租」.
   * studio: 「台北中山區美容工作室時租」; the title names the space type only when
   * every space there has it (e.g. 獨立房間). Never 「共享」 unless the spaces are.
   */
  style: 'workspace' | 'studio'
}

/** District pages that exist. Add a district only when it has ≥ 2 spaces. */
export const DISTRICT_PAGES: DistrictPageDef[] = [
  { citySlug: 'taoyuan', slug: 'zhongli', district: '中壢區', label: '中壢', style: 'workspace' },
  { citySlug: 'taipei', slug: 'zhongshan', district: '中山區', label: '中山區', style: 'studio' },
]

export function districtPagePath(def: DistrictPageDef): string {
  return `/spaces/city/${def.citySlug}/${def.slug}`
}

export function getDistrictPage(citySlug: string, slug: string): DistrictPageDef | null {
  return DISTRICT_PAGES.find((d) => d.citySlug === citySlug && d.slug === slug) ?? null
}

export function getDistrictPageByName(cityName: string, district: string): DistrictPageDef | null {
  return DISTRICT_PAGES.find((d) => getCityBySlug(d.citySlug)?.name === cityName && d.district === district) ?? null
}

export function spacesInDistrict(all: PublicSpace[], def: DistrictPageDef): PublicSpace[] {
  const city = getCityBySlug(def.citySlug)
  if (!city) return []
  return all.filter((s) => s.city === city.name && s.district === def.district)
}

// --- numbers -----------------------------------------------------------------

function hasRate(value: number | null | undefined): value is number {
  return typeof value === 'number' && value > 0
}

type RateKey = 'hourlyRate' | 'halfDayRate' | 'fullDayRate'
type RateStats = { n: number; min: number | null; max: number | null; median: number | null }

function rateStats(spaces: PublicSpace[], key: RateKey): RateStats {
  const values = spaces.map((s) => s[key]).filter(hasRate)
  if (!values.length) return { n: 0, min: null, max: null, median: null }
  return { n: values.length, min: Math.min(...values), max: Math.max(...values), median: median(values) }
}

function rangeZh(r: RateStats): string {
  if (r.min === null || r.max === null) return '—'
  return r.min === r.max ? formatNtd(r.min) : `${formatNtd(r.min)}–${r.max}`
}

function rangeEn(r: RateStats): string {
  return rateRangeEn(r.min, r.max)
}

function money(value: number | null): string {
  return value === null ? '—' : formatNtd(value)
}

function oneDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1)
}

/** Half-day (or full-day) price ÷ hourly rate, per space that has both. */
function hourEquivalents(spaces: PublicSpace[], key: 'halfDayRate' | 'fullDayRate') {
  const values = spaces
    .filter((s) => hasRate(s.hourlyRate) && hasRate(s[key]))
    .map((s) => (s[key] as number) / (s.hourlyRate as number))
  if (!values.length) return null
  const sorted = values.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const med = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  return { n: values.length, min: oneDecimal(sorted[0]), max: oneDecimal(sorted[sorted.length - 1]), median: oneDecimal(med) }
}

function countWith(spaces: PublicSpace[], equipment: string): number {
  return spaces.filter((s) => s.equipment.includes(equipment)).length
}

function serviceCounts(spaces: PublicSpace[]) {
  return SERVICE_GROUPS.map((group) => ({ group, n: spaces.filter((s) => s.recommendedServices.some(group.match)).length }))
    .filter((item) => item.n > 0)
    .sort((a, b) => b.n - a.n)
}

const TYPE_ORDER: SpaceType[] = ['OPEN_SPACE', 'CURTAIN_PARTITION', 'PRIVATE_ROOM']

function typeCounts(spaces: PublicSpace[]) {
  return TYPE_ORDER.map((type) => ({ type, spaces: spaces.filter((s) => s.spaceType === type) })).filter((t) => t.spaces.length > 0)
}

/** Spaces ordered like /spaces: by city (site order), then district, then hourly rate. */
function ordered(spaces: PublicSpace[]): PublicSpace[] {
  return groupSpacesByCity(spaces).flatMap((g) => g.spaces)
}

function minHoursRange(spaces: PublicSpace[]): string | null {
  const hours = spaces.map((s) => s.minimumHours).filter(hasRate)
  if (!hours.length) return null
  const min = Math.min(...hours)
  const max = Math.max(...hours)
  return min === max ? `${min}` : `${min}–${max}`
}

function locZh(space: PublicSpace): string {
  return `${space.city ? shortCityName(space.city) : ''}${space.district ?? ''}`
}

function locEn(space: PublicSpace): string {
  if (space.district) return `${districtShortEn(space.district, space.city)}, ${cityShortEn(space.city)}`
  return cityShortEn(space.city)
}

function cityListZh(spaces: PublicSpace[]): string {
  return groupSpacesByCity(spaces).map((g) => shortCityName(g.city)).join('、')
}

function cityListEnOf(spaces: PublicSpace[]): string {
  return joinEn(groupSpacesByCity(spaces).map((g) => cityShortEn(g.city)))
}

// --- view model ----------------------------------------------------------------

export type Cell = string | { text: string; href: string }
export type TopicTable = { caption: string; head: string[]; rows: Cell[][] }
export type TopicBlock = {
  id: string
  title: string
  note?: string
  paragraphs?: string[]
  table?: TopicTable
  chips?: Array<{ href: string; label: string }>
  links?: Array<{ href: string; label: string }>
}
export type TopicListSection = { id: string; title: string; note?: string; spaces: PublicSpace[] }

export type TopicView = {
  locale: AppLocale
  /** Unprefixed (zh) path; localized at render time. */
  path: string
  count: number
  indexable: boolean
  title: string
  ogTitle: string
  description: string
  tag: string
  h1: string
  breadcrumbs: Array<{ label: string; path?: string }>
  lead: string
  intro: string[]
  facts: Array<{ label: string; value: string }>
  dateNote: string
  noindexNote: string | null
  blocks: TopicBlock[]
  lists: TopicListSection[]
  faqTitle: string
  faq: QA[]
  related: { title: string; links: Array<{ href: string; label: string }> }
  cta: { title: string; text: string }
  itemListName: string
  /** schema.org `about` for the CollectionPage (district pages). */
  about?: Record<string, unknown>
}

function linker(locale: AppLocale) {
  return (path: string) => (locale === 'en' ? localizePath(path, 'en') : path)
}

function spaceCell(space: PublicSpace, L: (p: string) => string): Cell {
  return { text: space.title, href: L(`/spaces/${space.id}`) }
}

function cityChips(spaces: PublicSpace[], locale: AppLocale) {
  const L = linker(locale)
  return groupSpacesByCity(spaces).flatMap((g) => {
    const city = getCityByName(g.city)
    if (!city) return []
    const label = locale === 'en' ? `${cityShortEn(city)} · ${g.spaces.length}` : `${city.short} · ${g.spaces.length} 間`
    return [{ href: L(cityPagePath(city)), label }]
  })
}

function relatedLinks(current: string, locale: AppLocale) {
  const zh = [
    { href: '/spaces/shared', label: '美業共享空間時租' },
    { href: '/spaces/daily', label: '美容工作室日租・半日租' },
    { href: '/spaces/beauty-bed', label: '美容床位時租' },
    { href: '/spaces/service/nail', label: '美甲工作室時租' },
    { href: '/spaces/service/brow', label: '霧眉・紋繡工作室時租' },
    { href: '/spaces/service/lash', label: '美睫工作室時租' },
    { href: '/guides/lash-artist-studio', label: '美睫師租工作室指南' },
    { href: '/spaces', label: '全台美業空間' },
    { href: '/spaces/price-report', label: '美業空間時租行情' },
    { href: '/guides/hourly-vs-monthly-rent', label: '時租和月租怎麼選' },
  ]
  const en = [
    { href: '/spaces/shared', label: 'Shared beauty workspaces' },
    { href: '/spaces/daily', label: 'Day and half-day rental' },
    { href: '/spaces/beauty-bed', label: 'Beauty bed rental' },
    { href: '/spaces/service/nail', label: 'Nail studio rental' },
    { href: '/spaces/service/brow', label: 'Brow and PMU studio rental' },
    { href: '/spaces/service/lash', label: 'Lash studio rental' },
    { href: '/guides/lash-artist-studio', label: 'Lash artist studio guide' },
    { href: '/spaces', label: 'All beauty workspaces' },
    { href: '/spaces/price-report', label: 'Hourly rate report' },
    { href: '/guides/hourly-vs-monthly-rent', label: 'Hourly vs monthly rent' },
  ]
  const L = linker(locale)
  return (locale === 'en' ? en : zh).filter((l) => l.href !== current).map((l) => ({ ...l, href: L(l.href) }))
}

function common(locale: AppLocale) {
  const isEn = locale === 'en'
  return {
    dateLabel: isEn ? monthYearEn() : dataDateLabel(),
    cta: isEn
      ? { title: 'Book a space in the SoloBeauté app', text: 'The app shows open time slots, and you message the host directly to arrange a time. Rent is paid to the host in cash on site.' }
      : { title: '下載 SoloBeauté App 預約空間', text: '在 App 裡可以看可預約時段，直接傳訊息跟屋主約時間，租金現場付給屋主。' },
    howTo: isEn
      ? 'Hosts set up each space with its equipment and rent it out by the hour. Beauty professionals message the host in the SoloBeauté app to confirm a time and pay the host in cash on site. The website shows the district only; the full location is in the app.'
      : '每個空間都是屋主備好設備、按小時出租。美業職人在 SoloBeauté App 傳訊息給屋主確認時段，租金現場付給屋主。網站只顯示到區，完整位置請在 App 查看。',
  }
}

function noindexNote(count: number, locale: AppLocale): string | null {
  if (isTopicIndexable(count)) return null
  return locale === 'en'
    ? `Fewer than ${TOPIC_INDEX_MIN_SPACES} spaces match right now. More are being listed; see all beauty workspaces in the meantime.`
    : `目前符合的空間少於 ${TOPIC_INDEX_MIN_SPACES} 個，新空間陸續上架中，也可以先看全部美業空間。`
}

// --- P1 shared ---------------------------------------------------------------

function buildShared(all: PublicSpace[], locale: AppLocale): TopicView {
  const topic = getTopic('shared')
  const isEn = locale === 'en'
  const L = linker(locale)
  const { dateLabel, cta, howTo } = common(locale)
  const spaces = ordered(all.filter(topic.match))
  const n = spaces.length
  const open = spaces.filter((s) => s.spaceType === 'OPEN_SPACE')
  const curtain = spaces.filter((s) => s.spaceType === 'CURTAIN_PARTITION')
  const others = all.length - n
  const hourly = rateStats(spaces, 'hourlyRate')
  const byType = [
    { type: 'OPEN_SPACE' as SpaceType, spaces: open },
    { type: 'CURTAIN_PARTITION' as SpaceType, spaces: curtain },
  ].filter((t) => t.spaces.length > 0)
  const equipment = ['美容床', '美容燈', '美甲桌椅', '鏡台', '洗頭台', '消毒櫃', '停車位']
    .map((label) => ({ label, n: countWith(spaces, label) }))
    .filter((e) => e.n > 0)
  const dayCount = spaces.filter(getTopic('daily').match).length

  if (!isEn) {
    const typeRates = byType.map((t) => `${spaceTypeLabel(t.type)} ${t.spaces.length} 個（時租 ${rangeZh(rateStats(t.spaces, 'hourlyRate'))}）`).join('、')
    const blocks: TopicBlock[] = []
    if (n > 0) {
      blocks.push({
        id: 'compare',
        title: '開放空間和拉簾隔間比較',
        note: '時租中位數只在同類型有 2 個以上空間時顯示。',
        paragraphs: ['開放空間是同一個空間裡沒有隔間的工作區；拉簾隔間是用拉簾隔出個別的工作區。兩種都不是獨立房間。'],
        table: {
          caption: '開放空間和拉簾隔間比較',
          head: ['類型', '空間數', '時租', '時租中位數', '另有半日或全日價', '縣市'],
          rows: byType.map((t) => {
            const r = rateStats(t.spaces, 'hourlyRate')
            return [
              spaceTypeLabel(t.type),
              `${t.spaces.length} 間`,
              rangeZh(r),
              r.n >= 2 ? money(r.median) : '—',
              `${t.spaces.filter(getTopic('daily').match).length} 間`,
              cityListZh(t.spaces),
            ]
          }),
        },
      })
      if (equipment.length) {
        blocks.push({
          id: 'equipment',
          title: '共享空間常見設備',
          note: '依屋主在空間頁列出的設備計算。',
          table: {
            caption: '共享空間設備',
            head: ['設備', '有的空間數'],
            rows: equipment.map((e) => [e.label, `${e.n} / ${n} 間`]),
          },
        })
      }
      blocks.push({
        id: 'by-city',
        title: '共享空間在哪些縣市',
        chips: cityChips(spaces, locale),
      })
      blocks.push({
        id: 'compare-rent',
        title: '時租、分租、租床位的差別',
        paragraphs: [
          'SoloBeauté 上的共享空間按小時租，依預約的時數計算；分租或租床位通常是跟店家談好固定的床位或時段，多半按月計算。',
        ],
        links: [
          { href: L('/guides/lash-artist-studio#compare'), label: '時租、分租、租位有什麼不同 →' },
          { href: L('/guides/hourly-vs-monthly-rent'), label: '時租和月租怎麼選 →' },
        ],
      })
    }
    const faq: QA[] = n > 0
      ? [
          {
            question: '開放空間和拉簾隔間有什麼不同？',
            answer: `開放空間是同一個空間裡沒有隔間的工作區；拉簾隔間是用拉簾隔出個別的工作區。截至 ${dateLabel}，SoloBeauté 上有${byType.map((t) => `${spaceTypeLabel(t.type)} ${t.spaces.length} 個`).join('、')}。需要完全獨立的空間，可以看全部美業空間裡的獨立房間。`,
            links: [{ text: '全部美業空間', href: L('/spaces') }],
          },
          {
            question: '美業共享空間時租多少錢？',
            answer: `截至 ${dateLabel}，SoloBeauté 上 ${n} 個共享空間的時租是 ${rangeZh(hourly)}${hourly.n >= 2 ? `，中位數 ${money(hourly.median)}` : ''}。依類型：${typeRates}。`,
          },
          {
            question: '共享空間和分租、租床位有什麼不同？',
            answer: 'SoloBeauté 上的共享空間按小時租，依預約的時數計算；分租或租床位通常是跟店家談好固定的床位或時段，多半按月計算。詳細比較可以看美睫師租工作室的說明。',
            links: [{ text: '美睫師租工作室的說明', href: L('/guides/lash-artist-studio#compare') }],
          },
        ]
      : []
    return {
      locale,
      path: topic.path,
      count: n,
      indexable: isTopicIndexable(n),
      title: '美業共享空間時租｜開放空間、拉簾隔間按小時租',
      ogTitle: '美業共享空間時租｜SoloBeauté',
      description: n > 0
        ? `美業共享空間時租 ${rangeZh(hourly)}：SoloBeauté 上有 ${n} 個開放空間或拉簾隔間（${byType.map((t) => `${spaceTypeLabel(t.type)} ${t.spaces.length}`).join('、')}），分布${cityListZh(spaces)}。美業職人按小時租，在 App 預約，現場付現。`
        : '美業共享空間時租：開放空間、拉簾隔間按小時租。新空間陸續上架中，下載 SoloBeauté App 查看最新空間。',
      tag: '開放空間・拉簾隔間',
      h1: '美業共享空間時租',
      breadcrumbs: [{ label: '首頁', path: '/' }, { label: '美業空間', path: '/spaces' }, { label: '美業共享空間' }],
      lead: n > 0
        ? `截至 ${dateLabel}，SoloBeauté 上的開放空間和拉簾隔間共有 ${n} 個，時租 ${rangeZh(hourly)}${hourly.n >= 2 ? `，中位數 ${money(hourly.median)}` : ''}，分布${cityListZh(spaces)}。`
        : `截至 ${dateLabel}，SoloBeauté 上還沒有開放空間或拉簾隔間，新空間陸續上架中。`,
      intro: [
        `這一頁的「共享空間」指工作區不是獨立房間的空間：開放空間和拉簾隔間。獨立房間等其他 ${others} 個空間不列在這裡，可以在全部美業空間查看。`,
        howTo,
      ],
      facts: [
        { label: '共享空間', value: `${n} 間` },
        { label: '開放空間／拉簾隔間', value: `${open.length}／${curtain.length} 間` },
        { label: '時租', value: rangeZh(hourly) },
        { label: '另有半日或全日價', value: `${dayCount} 間` },
      ],
      dateNote: `資料日期：${dateLabel}，依 SoloBeauté 上架中的空間即時計算。`,
      noindexNote: noindexNote(n, locale),
      blocks,
      lists: byType.map((t) => ({
        id: t.type === 'OPEN_SPACE' ? 'open-spaces' : 'curtain-spaces',
        title: `${spaceTypeLabel(t.type)}（${t.spaces.length} 間）`,
        note: t.type === 'CURTAIN_PARTITION' ? '用拉簾隔出個別工作區。' : '同一個空間裡沒有隔間的工作區。',
        spaces: t.spaces,
      })),
      faqTitle: '美業共享空間常見問題',
      faq,
      related: { title: '繼續看', links: relatedLinks(topic.path, locale) },
      cta,
      itemListName: 'SoloBeauté 美業共享空間（開放空間、拉簾隔間）',
    }
  }

  const typeRatesEn = byType.map((t) => `${plural(t.spaces.length, spaceTypeEn(t.type).toLowerCase())} (${rangeEn(rateStats(t.spaces, 'hourlyRate'))} per hour)`)
  const blocks: TopicBlock[] = []
  if (n > 0) {
    blocks.push({
      id: 'compare',
      title: 'Open spaces vs curtained partitions',
      note: 'The median is shown only when a type has 2 or more spaces.',
      paragraphs: ['An open space is a work area with no partitions inside the room. A curtained partition is a separate work area divided off by a curtain. Neither is a private room.'],
      table: {
        caption: 'Open spaces vs curtained partitions',
        head: ['Type', 'Spaces', 'Hourly rate', 'Median', 'Also day or half-day rate', 'Cities'],
        rows: byType.map((t) => {
          const r = rateStats(t.spaces, 'hourlyRate')
          return [
            spaceTypeEn(t.type),
            `${t.spaces.length}`,
            rangeEn(r),
            r.n >= 2 ? money(r.median) : '—',
            `${t.spaces.filter(getTopic('daily').match).length}`,
            cityListEnOf(t.spaces),
          ]
        }),
      },
    })
    if (equipment.length) {
      blocks.push({
        id: 'equipment',
        title: 'Common equipment in shared spaces',
        note: 'Based on the equipment hosts list on each space page.',
        table: {
          caption: 'Equipment in shared spaces',
          head: ['Equipment', 'Spaces with it'],
          rows: equipment.map((e) => [equipmentEn(e.label), `${e.n} / ${n}`]),
        },
      })
    }
    blocks.push({ id: 'by-city', title: 'Where the shared spaces are', chips: cityChips(spaces, locale) })
    blocks.push({
      id: 'compare-rent',
      title: 'Hourly rent, sublets and bed rental',
      paragraphs: [
        'Shared spaces on SoloBeauté are rented by the hour, based on the hours you book. Sublets and bed rental usually mean agreeing a fixed bed or time slot with a salon, mostly paid monthly.',
      ],
      links: [
        { href: L('/guides/lash-artist-studio#compare'), label: 'Hourly rent, sublets and bed rental compared →' },
        { href: L('/guides/hourly-vs-monthly-rent'), label: 'Hourly vs monthly rent →' },
      ],
    })
  }
  const faq: QA[] = n > 0
    ? [
        {
          question: 'What is the difference between an open space and a curtained partition?',
          answer: `An open space is a work area with no partitions inside the room; a curtained partition is a separate work area divided off by a curtain. As of ${dateLabel}, SoloBeauté lists ${joinEn(byType.map((t) => plural(t.spaces.length, spaceTypeEn(t.type).toLowerCase())))}. If you need a fully separate room, see the private rooms among all beauty workspaces.`,
          links: [{ text: 'all beauty workspaces', href: L('/spaces') }],
        },
        {
          question: 'How much does a shared beauty workspace cost per hour?',
          answer: `As of ${dateLabel}, the ${plural(n, 'shared space')} on SoloBeauté charge ${rangeEn(hourly)} per hour${hourly.n >= 2 ? `, with a median of ${money(hourly.median)}` : ''}. By type: ${joinEn(typeRatesEn)}.`,
        },
        {
          question: 'How is a shared space different from a sublet or bed rental?',
          answer: 'Shared spaces on SoloBeauté are rented by the hour, based on the hours you book. Sublets and bed rental usually mean agreeing a fixed bed or time slot with a salon, mostly paid monthly. See the lash studio guide for a full comparison.',
          links: [{ text: 'lash studio guide', href: L('/guides/lash-artist-studio#compare') }],
        },
      ]
    : []
  return {
    locale,
    path: topic.path,
    count: n,
    indexable: isTopicIndexable(n),
    title: 'Shared Beauty Workspaces for Rent by the Hour in Taiwan',
    ogTitle: 'Shared beauty workspaces by the hour | SoloBeauté',
    description: n > 0
      ? `Shared beauty workspaces from ${rangeEn(hourly)} per hour: SoloBeauté lists ${plural(n, 'open space or curtained partition', 'open spaces and curtained partitions')} in ${cityListEnOf(spaces)}. Rent by the hour, book in the app and pay the host in cash on site.`
      : 'Shared beauty workspaces (open spaces and curtained partitions) for rent by the hour. New spaces are being listed; download the SoloBeauté app to see the latest.',
    tag: 'Open spaces and curtained partitions',
    h1: 'Shared beauty workspaces by the hour',
    breadcrumbs: [{ label: 'Home', path: '/' }, { label: 'Beauty workspaces', path: '/spaces' }, { label: 'Shared workspaces' }],
    lead: n > 0
      ? `As of ${dateLabel}, SoloBeauté lists ${plural(n, 'open space or curtained partition', 'open spaces and curtained partitions')} at ${rangeEn(hourly)} per hour${hourly.n >= 2 ? ` (median ${money(hourly.median)})` : ''}, in ${cityListEnOf(spaces)}.`
      : `As of ${dateLabel}, there are no open spaces or curtained partitions on SoloBeauté yet. New spaces are being listed.`,
    intro: [
      `On this page, "shared" means the work area is not a private room: open spaces and curtained partitions. The other ${plural(others, 'space')}, such as private rooms, are not listed here; you can find them among all beauty workspaces.`,
      howTo,
    ],
    facts: [
      { label: 'Shared spaces', value: `${n}` },
      { label: 'Open / curtained', value: `${open.length} / ${curtain.length}` },
      { label: 'Hourly rate', value: rangeEn(hourly) },
      { label: 'Also day or half-day rate', value: `${dayCount}` },
    ],
    dateNote: `Data as of ${dateLabel}, calculated live from spaces currently listed on SoloBeauté.`,
    noindexNote: noindexNote(n, locale),
    blocks,
    lists: byType.map((t) => ({
      id: t.type === 'OPEN_SPACE' ? 'open-spaces' : 'curtain-spaces',
      title: `${spaceTypeEn(t.type)}s (${t.spaces.length})`,
      note: t.type === 'CURTAIN_PARTITION' ? 'Separate work areas divided off by a curtain.' : 'Work areas with no partitions inside the room.',
      spaces: t.spaces,
    })),
    faqTitle: 'Shared beauty workspaces: FAQ',
    faq,
    related: { title: 'Keep reading', links: relatedLinks(topic.path, locale) },
    cta,
    itemListName: 'Shared beauty workspaces on SoloBeauté (open spaces and curtained partitions)',
  }
}

// --- P2 daily ----------------------------------------------------------------

function buildDaily(all: PublicSpace[], locale: AppLocale): TopicView {
  const topic = getTopic('daily')
  const isEn = locale === 'en'
  const L = linker(locale)
  const { dateLabel, cta, howTo } = common(locale)
  const spaces = ordered(all.filter(topic.match))
  const n = spaces.length
  const full = rateStats(spaces, 'fullDayRate')
  const half = rateStats(spaces, 'halfDayRate')
  const hourlyOnly = all.filter((s) => !topic.match(s))
  const hourlyOnlyHours = minHoursRange(hourlyOnly)
  const halfEq = hourEquivalents(spaces, 'halfDayRate')
  const fullEq = hourEquivalents(spaces, 'fullDayRate')
  const groups = groupSpacesByCity(spaces)
  const cityRow = (g: (typeof groups)[number]): Cell[] => {
    const city = getCityByName(g.city)
    const f = rateStats(g.spaces, 'fullDayRate')
    const h = rateStats(g.spaces, 'halfDayRate')
    const name = isEn ? cityShortEn(g.city) : shortCityName(g.city)
    return [
      city ? { text: name, href: L(cityPagePath(city)) } : name,
      isEn ? `${f.n}` : `${f.n} 間`,
      isEn ? rangeEn(f) : rangeZh(f),
      isEn ? `${h.n}` : `${h.n} 間`,
      isEn ? rangeEn(h) : rangeZh(h),
    ]
  }
  const spaceRows: Cell[][] = spaces.map((s) => [
    spaceCell(s, L),
    isEn ? locEn(s) : locZh(s),
    hasRate(s.hourlyRate) ? formatNtd(s.hourlyRate) : '—',
    hasRate(s.halfDayRate) ? formatNtd(s.halfDayRate) : '—',
    hasRate(s.fullDayRate) ? formatNtd(s.fullDayRate) : '—',
  ])

  if (!isEn) {
    const eqSentences = [
      halfEq ? `${halfEq.n} 個同時有時租和半日價的空間，半日價相當於 ${halfEq.min === halfEq.max ? halfEq.min : `${halfEq.min}–${halfEq.max}`} 小時的時租（中位數 ${halfEq.median} 小時）` : null,
      fullEq ? `${fullEq.n} 個同時有時租和全日價的空間，全日價相當於 ${fullEq.min === fullEq.max ? fullEq.min : `${fullEq.min}–${fullEq.max}`} 小時的時租（中位數 ${fullEq.median} 小時）` : null,
    ].filter(Boolean)
    const blocks: TopicBlock[] = []
    if (n > 0) {
      blocks.push({
        id: 'by-city',
        title: '各縣市的日租、半日租價格',
        table: { caption: '各縣市日租、半日租價格', head: ['縣市', '有全日價', '全日價', '有半日價', '半日價'], rows: groups.map(cityRow) },
      })
      if (eqSentences.length) {
        blocks.push({
          id: 'hours',
          title: '半日價、全日價相當於幾小時的時租',
          note: '以各空間的「半日價 ÷ 時租」「全日價 ÷ 時租」換算，只是價格換算；半日、全日實際包含幾小時，以屋主說明為準。',
          paragraphs: [`${eqSentences.join('；')}。`],
        })
      }
      blocks.push({
        id: 'prices',
        title: '每個空間的時租、半日、全日價格',
        note: '「—」表示屋主沒有設定這個價格。',
        table: { caption: '各空間時租、半日、全日價格', head: ['空間', '地區', '時租', '半日', '全日'], rows: spaceRows },
      })
    }
    const cityNames = groups.map((g) => `${shortCityName(g.city)} ${g.spaces.length} 個`).join('、')
    const faq: QA[] = n > 0
      ? [
          {
            question: '美容工作室日租、半日租多少錢？',
            answer: `截至 ${dateLabel}，SoloBeauté 上有 ${n} 個美業空間另有半日或全日價格。全日價 ${rangeZh(full)}（${full.n} 個${full.n >= 2 ? `，中位數 ${money(full.median)}` : ''}）；半日價 ${rangeZh(half)}（${half.n} 個${half.n >= 2 ? `，中位數 ${money(half.median)}` : ''}）。`,
          },
          {
            question: '半日租是幾個小時？',
            answer: `每個空間的半日、全日時數由屋主自己訂，請以空間頁和 App 裡屋主的說明為準。${halfEq ? `以價格換算，半日價相當於 ${halfEq.min === halfEq.max ? halfEq.min : `${halfEq.min}–${halfEq.max}`} 小時的時租。` : ''}`,
          },
          {
            question: '哪些縣市有美容工作室日租或半日租？',
            answer: `截至 ${dateLabel}，有半日或全日價格的空間在${cityNames}。各縣市的價格區間可以看這一頁的縣市表格。`,
          },
        ]
      : []
    return {
      locale,
      path: topic.path,
      count: n,
      indexable: isTopicIndexable(n),
      title: '美容工作室日租・半日租｜全日、半日價格一次比較',
      ogTitle: '美容工作室日租・半日租｜SoloBeauté',
      description: n > 0
        ? `美容工作室日租 ${rangeZh(full)}、半日租 ${rangeZh(half)}：SoloBeauté 上有 ${n} 個美業空間另有全日或半日價格，分布${cityListZh(spaces)}。在 App 預約，現場付現。`
        : '美容工作室日租、半日租價格。新空間陸續上架中，下載 SoloBeauté App 查看最新空間。',
      tag: '日租・半日租',
      h1: '美容工作室日租・半日租',
      breadcrumbs: [{ label: '首頁', path: '/' }, { label: '美業空間', path: '/spaces' }, { label: '日租・半日租' }],
      lead: n > 0
        ? `截至 ${dateLabel}，SoloBeauté 上有 ${n} 個美業空間除了時租，另有半日或全日價格：全日價 ${rangeZh(full)}（${full.n} 個${full.n >= 2 ? `，中位數 ${money(full.median)}` : ''}），半日價 ${rangeZh(half)}（${half.n} 個${half.n >= 2 ? `，中位數 ${money(half.median)}` : ''}）。`
        : `截至 ${dateLabel}，SoloBeauté 上還沒有設定半日或全日價格的空間，新空間陸續上架中。`,
      intro: [
        `全日、半日價格由屋主自己訂，半日、全日各是幾小時，以空間頁和 App 裡屋主的說明為準。${hourlyOnly.length ? `另外 ${hourlyOnly.length} 個空間只有時租，依時租計算${hourlyOnlyHours ? `，最低租用 ${hourlyOnlyHours} 小時` : ''}，可以在全部美業空間查看。` : ''}`,
        howTo,
      ],
      facts: [
        { label: '有日租或半日租', value: `${n} 間` },
        { label: '全日價', value: rangeZh(full) },
        { label: '半日價', value: rangeZh(half) },
        { label: '只有時租', value: `${hourlyOnly.length} 間` },
      ],
      dateNote: `資料日期：${dateLabel}，依 SoloBeauté 上架中的空間即時計算。`,
      noindexNote: noindexNote(n, locale),
      blocks,
      lists: n > 0 ? [{ id: 'spaces', title: `有日租或半日租的空間（${n} 間）`, spaces }] : [],
      faqTitle: '日租、半日租常見問題',
      faq,
      related: { title: '繼續看', links: relatedLinks(topic.path, locale) },
      cta,
      itemListName: 'SoloBeauté 有日租或半日租價格的美業空間',
    }
  }

  const eqSentencesEn = [
    halfEq ? `For the ${plural(halfEq.n, 'space')} with both an hourly and a half-day rate, the half-day rate equals ${halfEq.min === halfEq.max ? halfEq.min : `${halfEq.min}–${halfEq.max}`} hours at the hourly rate (median ${halfEq.median} hours)` : null,
    fullEq ? `for the ${plural(fullEq.n, 'space')} with both an hourly and a full-day rate, the full-day rate equals ${fullEq.min === fullEq.max ? fullEq.min : `${fullEq.min}–${fullEq.max}`} hours (median ${fullEq.median} hours)` : null,
  ].filter((s): s is string => Boolean(s))
  const blocks: TopicBlock[] = []
  if (n > 0) {
    blocks.push({
      id: 'by-city',
      title: 'Day and half-day rates by city',
      table: { caption: 'Day and half-day rates by city', head: ['City', 'Full-day rate set', 'Full day', 'Half-day rate set', 'Half day'], rows: groups.map(cityRow) },
    })
    if (eqSentencesEn.length) {
      const text = eqSentencesEn.join('; ')
      blocks.push({
        id: 'hours',
        title: 'How many hourly-rate hours a half or full day equals',
        note: 'Calculated per space as half-day rate ÷ hourly rate and full-day rate ÷ hourly rate. This is a price conversion only; the hours a half or full day actually includes are set by the host.',
        paragraphs: [`${text.charAt(0).toUpperCase()}${text.slice(1)}.`],
      })
    }
    blocks.push({
      id: 'prices',
      title: 'Hourly, half-day and full-day rates by space',
      note: '"—" means the host has not set that rate.',
      table: { caption: 'Rates by space', head: ['Space', 'Area', 'Hourly', 'Half day', 'Full day'], rows: spaceRows },
    })
  }
  const faq: QA[] = n > 0
    ? [
        {
          question: 'How much does a beauty studio cost per day or half day?',
          answer: `As of ${dateLabel}, ${plural(n, 'beauty workspace')} on SoloBeauté also set a half-day or full-day rate. Full day: ${rangeEn(full)} (${full.n}${full.n >= 2 ? `, median ${money(full.median)}` : ''}); half day: ${rangeEn(half)} (${half.n}${half.n >= 2 ? `, median ${money(half.median)}` : ''}).`,
        },
        {
          question: 'How many hours is a half day?',
          answer: `Each host sets how many hours a half day or full day includes; check the space page and the host's notes in the app.${halfEq ? ` By price, a half-day rate equals ${halfEq.min === halfEq.max ? halfEq.min : `${halfEq.min}–${halfEq.max}`} hours at the hourly rate.` : ''}`,
        },
        {
          question: 'Which cities have day or half-day beauty studio rental?',
          answer: `As of ${dateLabel}, spaces with a half-day or full-day rate are in ${joinEn(groups.map((g) => `${cityShortEn(g.city)} (${g.spaces.length})`))}. The city table on this page shows the rate ranges.`,
        },
      ]
    : []
  return {
    locale,
    path: topic.path,
    count: n,
    indexable: isTopicIndexable(n),
    title: 'Beauty Studio Day and Half-Day Rental in Taiwan',
    ogTitle: 'Beauty studio day and half-day rental | SoloBeauté',
    description: n > 0
      ? `Beauty studios by the day from ${rangeEn(full)} and by the half day from ${rangeEn(half)}: ${plural(n, 'workspace')} on SoloBeauté set day or half-day rates, in ${cityListEnOf(spaces)}. Book in the app and pay the host in cash on site.`
      : 'Day and half-day rates for beauty studios. New spaces are being listed; download the SoloBeauté app to see the latest.',
    tag: 'Day and half-day rates',
    h1: 'Beauty studio day and half-day rental',
    breadcrumbs: [{ label: 'Home', path: '/' }, { label: 'Beauty workspaces', path: '/spaces' }, { label: 'Day and half-day rental' }],
    lead: n > 0
      ? `As of ${dateLabel}, ${plural(n, 'beauty workspace')} on SoloBeauté set a half-day or full-day rate on top of the hourly rate: full day ${rangeEn(full)} (${full.n}${full.n >= 2 ? `, median ${money(full.median)}` : ''}), half day ${rangeEn(half)} (${half.n}${half.n >= 2 ? `, median ${money(half.median)}` : ''}).`
      : `As of ${dateLabel}, no space on SoloBeauté has set a half-day or full-day rate yet. New spaces are being listed.`,
    intro: [
      `Hosts set their own day and half-day rates, and how many hours each includes; check the space page and the host's notes in the app.${hourlyOnly.length ? ` The other ${plural(hourlyOnly.length, 'space')} only have an hourly rate${hourlyOnlyHours ? `, with a ${hourlyOnlyHours}-hour minimum` : ''}; you can find them among all beauty workspaces.` : ''}`,
      howTo,
    ],
    facts: [
      { label: 'With day or half-day rate', value: `${n}` },
      { label: 'Full day', value: rangeEn(full) },
      { label: 'Half day', value: rangeEn(half) },
      { label: 'Hourly only', value: `${hourlyOnly.length}` },
    ],
    dateNote: `Data as of ${dateLabel}, calculated live from spaces currently listed on SoloBeauté.`,
    noindexNote: noindexNote(n, locale),
    blocks,
    lists: n > 0 ? [{ id: 'spaces', title: `Spaces with day or half-day rates (${n})`, spaces }] : [],
    faqTitle: 'Day and half-day rental: FAQ',
    faq,
    related: { title: 'Keep reading', links: relatedLinks(topic.path, locale) },
    cta,
    itemListName: 'Beauty workspaces on SoloBeauté with day or half-day rates',
  }
}

// --- P3 beauty bed -------------------------------------------------------------

const BED_COMPANIONS = ['美容燈', '拋棄式床紙', '消毒櫃', '熱敷箱', '拋棄式毛巾', '毛巾', '工作推車']

function buildBeautyBed(all: PublicSpace[], locale: AppLocale): TopicView {
  const topic = getTopic('beauty-bed')
  const isEn = locale === 'en'
  const { dateLabel, cta, howTo } = common(locale)
  const spaces = ordered(all.filter(topic.match))
  const n = spaces.length
  const hourly = rateStats(spaces, 'hourlyRate')
  const types = typeCounts(spaces)
  const companions = BED_COMPANIONS.map((label) => ({ label, n: countWith(spaces, label) })).filter((e) => e.n > 0).sort((a, b) => b.n - a.n)
  const services = serviceCounts(spaces)
  const top3 = companions.slice(0, 3)

  if (!isEn) {
    const blocks: TopicBlock[] = []
    if (n > 0) {
      blocks.push({
        id: 'by-type',
        title: '床位在獨立房間、拉簾隔間還是開放空間',
        note: '時租中位數只在同類型有 2 個以上空間時顯示。',
        table: {
          caption: '美容床位依空間類型',
          head: ['類型', '空間數', '時租', '時租中位數'],
          rows: types.map((t) => {
            const r = rateStats(t.spaces, 'hourlyRate')
            return [spaceTypeLabel(t.type), `${t.spaces.length} 間`, rangeZh(r), r.n >= 2 ? money(r.median) : '—']
          }),
        },
      })
      if (companions.length) {
        blocks.push({
          id: 'equipment',
          title: '美容床以外的設備',
          note: `${n} 個有美容床的空間中，屋主另外列出的設備。`,
          table: { caption: '美容床以外的設備', head: ['設備', '有的空間數'], rows: companions.map((e) => [e.label, `${e.n} / ${n} 間`]) },
        })
      }
      if (services.length) {
        blocks.push({
          id: 'services',
          title: '屋主標示適合的服務',
          note: '一個空間可以標示多種服務。',
          table: { caption: '美容床位適合的服務', head: ['服務', '空間數'], rows: services.map((s) => [s.group.prose, `${s.n} 間`]) },
        })
      }
      blocks.push({ id: 'by-city', title: '有美容床的空間在哪些縣市', chips: cityChips(spaces, locale) })
    }
    const faq: QA[] = n > 0
      ? [
          {
            question: '美容床位時租多少錢？',
            answer: `截至 ${dateLabel}，SoloBeauté 上 ${n} 個有美容床的空間，時租 ${rangeZh(hourly)}${hourly.n >= 2 ? `，中位數 ${money(hourly.median)}` : ''}。依類型：${types.map((t) => `${spaceTypeLabel(t.type)} ${t.spaces.length} 個（${rangeZh(rateStats(t.spaces, 'hourlyRate'))}）`).join('、')}。`,
          },
          {
            question: '有美容床的空間，床紙和耗材要自己帶嗎？',
            answer: `看屋主列出的設備。${companions.length ? `${n} 個有美容床的空間中，${companions.map((e) => `${e.n} 個有${e.label}`).join('、')}。` : ''}設備清單沒列的東西，租之前先在 App 傳訊息問屋主。`,
          },
          ...(services.length
            ? [{
                question: '美容床位適合做哪些服務？',
                answer: `依屋主標示，${n} 個有美容床的空間中，${services.map((s) => `${s.n} 個適合${s.group.prose}`).join('、')}。`,
              }]
            : []),
        ]
      : []
    return {
      locale,
      path: topic.path,
      count: n,
      indexable: isTopicIndexable(n),
      title: '美容床位時租｜有美容床的美業空間按小時租',
      ogTitle: '美容床位時租｜SoloBeauté',
      description: n > 0
        ? `美容床位時租 ${rangeZh(hourly)}：SoloBeauté 上有 ${n} 個美業空間備有美容床${top3.length ? `，其中 ${top3.map((e) => `${e.n} 個有${e.label}`).join('、')}` : ''}，分布${cityListZh(spaces)}。在 App 預約，現場付現。`
        : '美容床位時租：有美容床的美業空間按小時租。新空間陸續上架中，下載 SoloBeauté App 查看最新空間。',
      tag: '美容床位',
      h1: '美容床位時租',
      breadcrumbs: [{ label: '首頁', path: '/' }, { label: '美業空間', path: '/spaces' }, { label: '美容床位' }],
      lead: n > 0
        ? `截至 ${dateLabel}，SoloBeauté 上有 ${n} 個美業空間的設備清單有美容床，時租 ${rangeZh(hourly)}${hourly.n >= 2 ? `，中位數 ${money(hourly.median)}` : ''}，分布${cityListZh(spaces)}。`
        : `截至 ${dateLabel}，SoloBeauté 上還沒有列出美容床的空間，新空間陸續上架中。`,
      intro: [
        n > 0
          ? `床位所在的空間類型：${types.map((t) => `${spaceTypeLabel(t.type)} ${t.spaces.length} 個`).join('、')}。設備以屋主在空間頁列出的為準；床紙、毛巾等沒列在清單的東西，租之前先跟屋主確認。`
          : '設備以屋主在空間頁列出的為準。',
        howTo,
      ],
      facts: [
        { label: '有美容床', value: `${n} 間` },
        { label: '時租', value: rangeZh(hourly) },
        { label: '時租中位數', value: hourly.n >= 2 ? money(hourly.median) : '—' },
        { label: '獨立房間', value: `${spaces.filter((s) => s.spaceType === 'PRIVATE_ROOM').length} 間` },
      ],
      dateNote: `資料日期：${dateLabel}，依 SoloBeauté 上架中的空間即時計算。`,
      noindexNote: noindexNote(n, locale),
      blocks,
      lists: n > 0 ? [{ id: 'spaces', title: `有美容床的空間（${n} 間）`, spaces }] : [],
      faqTitle: '美容床位常見問題',
      faq,
      related: { title: '繼續看', links: relatedLinks(topic.path, locale) },
      cta,
      itemListName: 'SoloBeauté 有美容床的美業空間',
    }
  }

  const blocks: TopicBlock[] = []
  if (n > 0) {
    blocks.push({
      id: 'by-type',
      title: 'Is the bed in a private room, a curtained partition or an open space?',
      note: 'The median is shown only when a type has 2 or more spaces.',
      table: {
        caption: 'Beauty beds by space type',
        head: ['Type', 'Spaces', 'Hourly rate', 'Median'],
        rows: types.map((t) => {
          const r = rateStats(t.spaces, 'hourlyRate')
          return [spaceTypeEn(t.type), `${t.spaces.length}`, rangeEn(r), r.n >= 2 ? money(r.median) : '—']
        }),
      },
    })
    if (companions.length) {
      blocks.push({
        id: 'equipment',
        title: 'Equipment besides the bed',
        note: `Other equipment hosts list, among the ${plural(n, 'space')} with a beauty bed.`,
        table: { caption: 'Equipment besides the bed', head: ['Equipment', 'Spaces with it'], rows: companions.map((e) => [equipmentEn(e.label), `${e.n} / ${n}`]) },
      })
    }
    if (services.length) {
      blocks.push({
        id: 'services',
        title: 'Services hosts mark as suitable',
        note: 'A space can be marked for several services.',
        table: { caption: 'Services for beauty bed spaces', head: ['Service', 'Spaces'], rows: services.map((s) => [SERVICE_GROUP_EN[s.group.key]?.prose ?? s.group.prose, `${s.n}`]) },
      })
    }
    blocks.push({ id: 'by-city', title: 'Where the spaces with a beauty bed are', chips: cityChips(spaces, locale) })
  }
  const faq: QA[] = n > 0
    ? [
        {
          question: 'How much does it cost to rent a beauty bed by the hour?',
          answer: `As of ${dateLabel}, the ${plural(n, 'space')} with a beauty bed on SoloBeauté charge ${rangeEn(hourly)} per hour${hourly.n >= 2 ? `, with a median of ${money(hourly.median)}` : ''}. By type: ${joinEn(types.map((t) => `${plural(t.spaces.length, spaceTypeEn(t.type).toLowerCase())} (${rangeEn(rateStats(t.spaces, 'hourlyRate'))})`))}.`,
        },
        {
          question: 'Do I need to bring my own bed sheets and consumables?',
          answer: `It depends on the equipment the host lists.${companions.length ? ` Of the ${plural(n, 'space')} with a beauty bed, ${joinEn(companions.map((e) => `${e.n} list ${equipmentEn(e.label).toLowerCase()}`))}.` : ''} For anything not on the list, message the host in the app before you book.`,
        },
        ...(services.length
          ? [{
              question: 'Which services suit a beauty bed space?',
              answer: `Based on what hosts mark, of the ${plural(n, 'space')} with a beauty bed, ${joinEn(services.map((s) => `${s.n} suit ${SERVICE_GROUP_EN[s.group.key]?.prose ?? s.group.prose}`))}.`,
            }]
          : []),
      ]
    : []
  return {
    locale,
    path: topic.path,
    count: n,
    indexable: isTopicIndexable(n),
    title: 'Beauty Bed Rental by the Hour in Taiwan',
    ogTitle: 'Rent a beauty bed by the hour | SoloBeauté',
    description: n > 0
      ? `Rent a beauty bed from ${rangeEn(hourly)} per hour: ${plural(n, 'workspace')} on SoloBeauté list a beauty bed${top3.length ? `; ${joinEn(top3.map((e) => `${e.n} also list ${equipmentEn(e.label).toLowerCase()}`))}` : ''}. In ${cityListEnOf(spaces)}. Book in the app and pay the host in cash on site.`
      : 'Beauty bed rental by the hour. New spaces are being listed; download the SoloBeauté app to see the latest.',
    tag: 'Beauty bed',
    h1: 'Rent a beauty bed by the hour',
    breadcrumbs: [{ label: 'Home', path: '/' }, { label: 'Beauty workspaces', path: '/spaces' }, { label: 'Beauty bed rental' }],
    lead: n > 0
      ? `As of ${dateLabel}, ${plural(n, 'beauty workspace')} on SoloBeauté list a beauty bed, at ${rangeEn(hourly)} per hour${hourly.n >= 2 ? ` (median ${money(hourly.median)})` : ''}, in ${cityListEnOf(spaces)}.`
      : `As of ${dateLabel}, no space on SoloBeauté lists a beauty bed yet. New spaces are being listed.`,
    intro: [
      n > 0
        ? `Space types: ${joinEn(types.map((t) => plural(t.spaces.length, spaceTypeEn(t.type).toLowerCase())))}. Equipment is as listed by the host on each space page; for sheets, towels or anything not listed, check with the host before you book.`
        : 'Equipment is as listed by the host on each space page.',
      howTo,
    ],
    facts: [
      { label: 'With a beauty bed', value: `${n}` },
      { label: 'Hourly rate', value: rangeEn(hourly) },
      { label: 'Median', value: hourly.n >= 2 ? money(hourly.median) : '—' },
      { label: 'Private rooms', value: `${spaces.filter((s) => s.spaceType === 'PRIVATE_ROOM').length}` },
    ],
    dateNote: `Data as of ${dateLabel}, calculated live from spaces currently listed on SoloBeauté.`,
    noindexNote: noindexNote(n, locale),
    blocks,
    lists: n > 0 ? [{ id: 'spaces', title: `Spaces with a beauty bed (${n})`, spaces }] : [],
    faqTitle: 'Beauty bed rental: FAQ',
    faq,
    related: { title: 'Keep reading', links: relatedLinks(topic.path, locale) },
    cta,
    itemListName: 'Beauty workspaces on SoloBeauté with a beauty bed',
  }
}


// --- P7 nail / P8 brow (service pages) -----------------------------------------

type ServiceCopy = {
  subs: string[]
  equipment: string[]
  reportAnchor: string
  zh: { title: string; og: string; h1: string; tag: string; noun: string; profession: string; itemList: string; crumb: string }
  en: { title: string; og: string; h1: string; tag: string; noun: string; profession: string; itemList: string; crumb: string }
}

const SERVICE_COPY: Record<ServiceKey, ServiceCopy> = {
  nail: {
    subs: ['手美甲', '腳美甲'],
    equipment: ['美甲桌椅', '光療燈', '美甲吸塵器', '桌上型工作燈', '美容燈', '延長線'],
    reportAnchor: '#nail',
    zh: { title: '美甲工作室時租｜美甲座位按小時租', og: '美甲工作室時租｜SoloBeauté', h1: '美甲工作室時租', tag: '美甲師・工作室時租', noun: '美甲', profession: '美甲師', itemList: 'SoloBeauté 適合美甲的美業空間', crumb: '美甲工作室' },
    en: { title: 'Nail Studio Rental by the Hour in Taiwan', og: 'Nail studio rental by the hour | SoloBeauté', h1: 'Nail studio rental by the hour', tag: 'For nail artists', noun: 'nails', profession: 'nail artists', itemList: 'Beauty workspaces on SoloBeauté suitable for nails', crumb: 'Nail studios' },
  },
  brow: {
    subs: ['霧眉（唇）', '霧眉除色', '髮際線紋綉', '黑眼圈遮瑕'],
    equipment: ['美容床', '美容燈', '消毒櫃', '拋棄式床紙'],
    reportAnchor: '#brow',
    zh: { title: '霧眉・紋繡工作室時租｜按小時租美容床位', og: '霧眉・紋繡工作室時租｜SoloBeauté', h1: '霧眉・紋繡工作室時租', tag: '霧眉師・紋繡師', noun: '霧眉或紋繡', profession: '霧眉師', itemList: 'SoloBeauté 適合霧眉、紋繡的美業空間', crumb: '霧眉・紋繡工作室' },
    en: { title: 'Brow and PMU Studio Rental by the Hour in Taiwan', og: 'Brow and PMU studio rental by the hour | SoloBeauté', h1: 'Brow and PMU studio rental by the hour', tag: 'For brow and PMU artists', noun: 'brow or permanent makeup work', profession: 'brow artists', itemList: 'Beauty workspaces on SoloBeauté suitable for brow and permanent makeup', crumb: 'Brow and PMU studios' },
  },
  lash: {
    subs: ['嫁接睫毛', '睫毛管理'],
    equipment: ['美容床', '美容燈', '消毒櫃', '拋棄式床紙'],
    reportAnchor: '#lash',
    zh: { title: '美睫工作室時租｜嫁接睫毛、睫毛管理按小時租', og: '美睫工作室時租｜SoloBeauté', h1: '美睫工作室時租', tag: '美睫師・工作室時租', noun: '美睫', profession: '美睫師', itemList: 'SoloBeauté 適合美睫的美業空間', crumb: '美睫工作室' },
    en: { title: 'Lash Studio Rental by the Hour in Taiwan', og: 'Lash studio rental by the hour | SoloBeauté', h1: 'Lash studio rental by the hour', tag: 'For lash artists', noun: 'lash work', profession: 'lash artists', itemList: 'Beauty workspaces on SoloBeauté suitable for lash work', crumb: 'Lash studios' },
  },
}

const SUB_EN: Record<string, string> = {
  手美甲: 'Manicure',
  腳美甲: 'Pedicure',
  '霧眉（唇）': 'Brow / lip embroidery',
  霧眉除色: 'Brow tattoo removal',
  髮際線紋綉: 'Hairline tattoo',
  黑眼圈遮瑕: 'Dark circle camouflage',
  嫁接睫毛: 'Lash extensions',
  睫毛管理: 'Lash lift and care',
}

function buildService(key: ServiceKey, all: PublicSpace[], locale: AppLocale): TopicView {
  const topic = getTopic(key)
  const copy = SERVICE_COPY[key]
  const isEn = locale === 'en'
  const L = linker(locale)
  const { dateLabel, cta, howTo } = common(locale)
  const spaces = ordered(all.filter(topic.match))
  const n = spaces.length
  const hourly = rateStats(spaces, 'hourlyRate')
  const types = typeCounts(spaces)
  const subs = copy.subs.map((label) => ({ label, n: spaces.filter((s) => s.recommendedServices.includes(label)).length })).filter((x) => x.n > 0)
  const equipment = copy.equipment.map((label) => ({ label, n: countWith(spaces, label) })).filter((e) => e.n > 0).sort((a, b) => b.n - a.n)
  const groups = groupSpacesByCity(spaces)
  const privateish = spaces.filter((s) => s.spaceType === 'PRIVATE_ROOM' || s.spaceType === 'CURTAIN_PARTITION').length
  const reportHref = L(`/spaces/price-report${copy.reportAnchor}`)
  const cityRows: Cell[][] = groups.map((g) => {
    const city = getCityByName(g.city)
    const r = rateStats(g.spaces, 'hourlyRate')
    const name = isEn ? cityShortEn(g.city) : shortCityName(g.city)
    return [
      city ? { text: name, href: L(cityPagePath(city)) } : name,
      isEn ? `${g.spaces.length}` : `${g.spaces.length} 間`,
      isEn ? rangeEn(r) : rangeZh(r),
      r.n >= 2 ? money(r.median) : '—',
    ]
  })
  const typeRows: Cell[][] = types.map((t) => {
    const r = rateStats(t.spaces, 'hourlyRate')
    return [isEn ? spaceTypeEn(t.type) : spaceTypeLabel(t.type), isEn ? `${t.spaces.length}` : `${t.spaces.length} 間`, isEn ? rangeEn(r) : rangeZh(r), r.n >= 2 ? money(r.median) : '—']
  })
  const top2 = equipment.slice(0, 2)

  if (!isEn) {
    const c = copy.zh
    const blocks: TopicBlock[] = []
    if (n > 0) {
      if (subs.length) {
        blocks.push({
          id: 'services',
          title: key === 'nail' ? '手美甲、腳美甲各幾間' : key === 'lash' ? '嫁接睫毛、睫毛管理各幾間' : '霧眉、除色、髮際線、黑眼圈各幾間',
          note: '依屋主標示的建議服務；一個空間可以標示多種服務。',
          table: { caption: `${c.noun}細項`, head: ['服務', '空間數'], rows: subs.map((x) => [x.label, `${x.n} / ${n} 間`]) },
        })
      }
      if (equipment.length) {
        blocks.push({
          id: 'equipment',
          title: key === 'nail' ? '美甲桌椅和相關設備' : '美容床、美容燈等設備',
          note: '依屋主在空間頁列出的設備計算。',
          table: { caption: `適合${c.noun}的空間設備`, head: ['設備', '有的空間數'], rows: equipment.map((e) => [e.label, `${e.n} / ${n} 間`]) },
        })
      }
      blocks.push({
        id: 'by-type',
        title: '獨立房間、拉簾隔間還是開放空間',
        note: '依需要的隱私程度選擇空間類型；時租中位數只在同類型有 2 個以上空間時顯示。',
        table: { caption: `適合${c.noun}的空間類型`, head: ['類型', '空間數', '時租', '時租中位數'], rows: typeRows },
      })
      blocks.push({
        id: 'by-city',
        title: '依縣市的時租',
        note: '時租中位數只在同縣市有 2 個以上空間時顯示。',
        table: { caption: `適合${c.noun}的空間：依縣市`, head: ['縣市', '空間數', '時租', '時租中位數'], rows: cityRows },
        links: [{ href: reportHref, label: `${c.profession}租工作室的行情摘要（時租行情報告）→` }, ...(key === 'lash' ? [{ href: L('/guides/lash-artist-studio'), label: '美睫師租工作室指南：設備、隱私和時租怎麼看 →' }] : [])],
      })
    }
    const faq: QA[] = n > 0
      ? [
          {
            question: `${c.h1.replace('時租', '')}時租多少錢？`,
            answer: `截至 ${dateLabel}，SoloBeauté 上屋主標示適合${c.noun}的 ${n} 個空間，時租 ${rangeZh(hourly)}${hourly.n >= 2 ? `，中位數 ${money(hourly.median)}` : ''}，分布${cityListZh(spaces)}。`,
          },
          {
            question: key === 'nail' ? '手美甲、腳美甲都可以做嗎？' : key === 'lash' ? '嫁接睫毛、睫毛管理都可以做嗎？' : '霧眉以外，除色、髮際線、黑眼圈也可以做嗎？',
            answer: `依屋主標示，${n} 個空間中，${subs.map((x) => `${x.n} 個適合${x.label}`).join('、')}。每個空間適合的服務，以空間頁上屋主的標示為準。`,
          },
          {
            question: key === 'nail' ? '租美甲工作室，有美甲桌椅嗎？' : `${c.noun}的空間有獨立房間或拉簾隔間嗎？`,
            answer: key === 'nail'
              ? `看屋主列出的設備。${n} 個空間中，${equipment.length ? equipment.map((e) => `${e.n} 個有${e.label}`).join('、') : '目前沒有列出美甲相關設備'}。設備清單沒列的東西，租之前先在 App 傳訊息問屋主。`
              : `有。${n} 個空間中，${types.map((t) => `${spaceTypeLabel(t.type)} ${t.spaces.length} 個`).join('、')}${equipment.find((e) => e.label === '消毒櫃') ? `；${equipment.find((e) => e.label === '消毒櫃')?.n} 個有消毒櫃` : ''}。`,
          },
        ]
      : []
    return {
      locale,
      path: topic.path,
      count: n,
      indexable: isTopicIndexable(n),
      title: c.title,
      ogTitle: c.og,
      description: n > 0
        ? `${c.h1} ${rangeZh(hourly)}：SoloBeauté 上有 ${n} 個美業空間由屋主標示適合${c.noun}${top2.length ? `，其中 ${top2.map((e) => `${e.n} 個有${e.label}`).join('、')}` : ''}，分布${cityListZh(spaces)}。在 App 預約，現場付現。`
        : `${c.h1}。新空間陸續上架中，下載 SoloBeauté App 查看最新空間。`,
      tag: c.tag,
      h1: c.h1,
      breadcrumbs: [{ label: '首頁', path: '/' }, { label: '美業空間', path: '/spaces' }, { label: c.crumb }],
      lead: n > 0
        ? `截至 ${dateLabel}，SoloBeauté 上有 ${n} 個美業空間由屋主標示適合${c.noun}，時租 ${rangeZh(hourly)}${hourly.n >= 2 ? `，中位數 ${money(hourly.median)}` : ''}，分布${cityListZh(spaces)}。`
        : `截至 ${dateLabel}，SoloBeauté 上還沒有屋主標示適合${c.noun}的空間，新空間陸續上架中。`,
      intro: [
        n > 0
          ? `${top2.length ? `其中 ${top2.map((e) => `${e.n} 個有${e.label}`).join('、')}；` : ''}獨立房間或拉簾隔間 ${privateish} 個。適合的服務和設備以屋主在空間頁的標示為準，沒列在清單的東西，租之前先跟屋主確認。`
          : '適合的服務和設備以屋主在空間頁的標示為準。',
        howTo,
      ],
      facts: [
        { label: `適合${c.noun}`, value: `${n} 間` },
        { label: '時租', value: rangeZh(hourly) },
        { label: '時租中位數', value: hourly.n >= 2 ? money(hourly.median) : '—' },
        key === 'nail'
          ? { label: '有美甲桌椅', value: `${countWith(spaces, '美甲桌椅')} 間` }
          : key === 'lash'
          ? { label: '有美容床', value: `${countWith(spaces, '美容床')} 間` }
          : { label: '有消毒櫃', value: `${countWith(spaces, '消毒櫃')} 間` },
      ],
      dateNote: `資料日期：${dateLabel}，依 SoloBeauté 上架中的空間即時計算，和時租行情報告用同一份資料。`,
      noindexNote: noindexNote(n, locale),
      blocks,
      lists: n > 0 ? [{ id: 'spaces', title: `適合${c.noun}的空間（${n} 間）`, spaces }] : [],
      faqTitle: `${c.h1.replace('時租', '')}常見問題`,
      faq,
      related: { title: '繼續看', links: relatedLinks(topic.path, locale) },
      cta,
      itemListName: c.itemList,
    }
  }

  const c = copy.en
  const blocks: TopicBlock[] = []
  if (n > 0) {
    if (subs.length) {
      blocks.push({
        id: 'services',
        title: key === 'nail' ? 'Manicure and pedicure' : key === 'lash' ? 'Lash extensions and lash lift' : 'Brows, removal, hairline and dark-circle work',
        note: 'Based on the services hosts mark; a space can be marked for several.',
        table: { caption: 'Services', head: ['Service', 'Spaces'], rows: subs.map((x) => [SUB_EN[x.label] ?? serviceTagEn(x.label), `${x.n} / ${n}`]) },
      })
    }
    if (equipment.length) {
      blocks.push({
        id: 'equipment',
        title: key === 'nail' ? 'Nail tables and related equipment' : 'Beauty beds, lamps and more',
        note: 'Based on the equipment hosts list on each space page.',
        table: { caption: 'Equipment', head: ['Equipment', 'Spaces with it'], rows: equipment.map((e) => [equipmentEn(e.label), `${e.n} / ${n}`]) },
      })
    }
    blocks.push({
      id: 'by-type',
      title: 'Private room, curtained partition or open space',
      note: 'Choose by how much privacy you need. The median is shown only when a type has 2 or more spaces.',
      table: { caption: 'Space types', head: ['Type', 'Spaces', 'Hourly rate', 'Median'], rows: typeRows },
    })
    blocks.push({
      id: 'by-city',
      title: 'Hourly rates by city',
      note: 'The median is shown only when a city has 2 or more spaces.',
      table: { caption: 'By city', head: ['City', 'Spaces', 'Hourly rate', 'Median'], rows: cityRows },
      links: [{ href: reportHref, label: `Rate summary for ${c.profession} (hourly rate report) →` }, ...(key === 'lash' ? [{ href: L('/guides/lash-artist-studio'), label: 'Lash artist studio guide →' }] : [])],
    })
  }
  const faq: QA[] = n > 0
    ? [
        {
          question: key === 'nail' ? 'How much does a nail studio cost per hour?' : key === 'lash' ? 'How much does a lash studio cost per hour?' : 'How much does a brow or PMU studio cost per hour?',
          answer: `As of ${dateLabel}, the ${plural(n, 'space')} on SoloBeauté that hosts mark as suitable for ${c.noun} charge ${rangeEn(hourly)} per hour${hourly.n >= 2 ? `, with a median of ${money(hourly.median)}` : ''}, in ${cityListEnOf(spaces)}.`,
        },
        {
          question: key === 'nail' ? 'Can I do both manicures and pedicures?' : key === 'lash' ? 'Can I do both lash extensions and lash lifts?' : 'Besides brows, can I do removal, hairline or dark-circle work?',
          answer: `Based on what hosts mark, of the ${plural(n, 'space')}, ${joinEn(subs.map((x) => `${x.n} suit ${(SUB_EN[x.label] ?? x.label).toLowerCase()}`))}. Check each space page for the services the host lists.`,
        },
        {
          question: key === 'nail' ? 'Do nail studios come with a nail table?' : 'Are there private rooms or curtained partitions?',
          answer: key === 'nail'
            ? `It depends on the equipment the host lists. Of the ${plural(n, 'space')}, ${equipment.length ? joinEn(equipment.map((e) => `${e.n} list ${equipmentEn(e.label).toLowerCase()}`)) : 'none list nail equipment yet'}. For anything not listed, message the host in the app before you book.`
            : `Yes. Of the ${plural(n, 'space')}, ${joinEn(types.map((t) => plural(t.spaces.length, spaceTypeEn(t.type).toLowerCase())))}${equipment.find((e) => e.label === '消毒櫃') ? `; ${equipment.find((e) => e.label === '消毒櫃')?.n} list a sterilizing cabinet` : ''}.`,
        },
      ]
    : []
  return {
    locale,
    path: topic.path,
    count: n,
    indexable: isTopicIndexable(n),
    title: c.title,
    ogTitle: c.og,
    description: n > 0
      ? `${c.h1} from ${rangeEn(hourly)}: ${plural(n, 'workspace')} on SoloBeauté that hosts mark as suitable for ${c.noun}${top2.length ? `; ${joinEn(top2.map((e) => `${e.n} list ${equipmentEn(e.label).toLowerCase()}`))}` : ''}. In ${cityListEnOf(spaces)}. Book in the app and pay the host in cash on site.`
      : `${c.h1}. New spaces are being listed; download the SoloBeauté app to see the latest.`,
    tag: c.tag,
    h1: c.h1,
    breadcrumbs: [{ label: 'Home', path: '/' }, { label: 'Beauty workspaces', path: '/spaces' }, { label: c.crumb }],
    lead: n > 0
      ? `As of ${dateLabel}, hosts mark ${plural(n, 'beauty workspace')} on SoloBeauté as suitable for ${c.noun}, at ${rangeEn(hourly)} per hour${hourly.n >= 2 ? ` (median ${money(hourly.median)})` : ''}, in ${cityListEnOf(spaces)}.`
      : `As of ${dateLabel}, no host on SoloBeauté has marked a space as suitable for ${c.noun} yet. New spaces are being listed.`,
    intro: [
      n > 0
        ? `${top2.length ? `${joinEn(top2.map((e) => `${e.n} list ${equipmentEn(e.label).toLowerCase()}`))}; ` : ''}${privateish} are private rooms or curtained partitions. Services and equipment are as marked by the host on each space page; for anything not listed, check with the host before you book.`
        : 'Services and equipment are as marked by the host on each space page.',
      howTo,
    ],
    facts: [
      { label: key === 'nail' ? 'Suitable for nails' : key === 'lash' ? 'Suitable for lash work' : 'Suitable for brows / PMU', value: `${n}` },
      { label: 'Hourly rate', value: rangeEn(hourly) },
      { label: 'Median', value: hourly.n >= 2 ? money(hourly.median) : '—' },
      key === 'nail'
        ? { label: 'With a nail table', value: `${countWith(spaces, '美甲桌椅')}` }
        : key === 'lash'
        ? { label: 'With a beauty bed', value: `${countWith(spaces, '美容床')}` }
        : { label: 'With a sterilizing cabinet', value: `${countWith(spaces, '消毒櫃')}` },
    ],
    dateNote: `Data as of ${dateLabel}, calculated live from spaces currently listed on SoloBeauté (the same data as the hourly rate report).`,
    noindexNote: noindexNote(n, locale),
    blocks,
    lists: n > 0 ? [{ id: 'spaces', title: `Spaces suitable for ${c.noun} (${n})`, spaces }] : [],
    faqTitle: `${c.crumb}: FAQ`,
    faq,
    related: { title: 'Keep reading', links: relatedLinks(topic.path, locale) },
    cta,
    itemListName: c.itemList,
  }
}

export function buildTopicView(key: TopicKey, all: PublicSpace[], locale: AppLocale): TopicView {
  if (key === 'shared') return withRentalFaq(buildShared(all, locale))
  if (key === 'daily') return withRentalFaq(buildDaily(all, locale))
  if (key === 'nail' || key === 'brow' || key === 'lash') return withRentalFaq(buildService(key, all, locale))
  return withRentalFaq(buildBeautyBed(all, locale))
}

/**
 * Two FAQ entries shared by every topic / district page: how renting works and
 * pays (as things are today: message the host in the app, pay the host in cash
 * on site), and the minimum booking length computed from the listed spaces.
 */
function withRentalFaq(view: TopicView): TopicView {
  if (view.count === 0) return view
  const spaces = view.lists.flatMap((list) => list.spaces)
  const hours = minHoursRange(spaces)
  const withHours = spaces.filter((s) => hasRate(s.minimumHours)).length
  const isEn = view.locale === 'en'
  const extra: QA[] = isEn
    ? [
        {
          question: 'How do I rent one of these spaces, and how do I pay?',
          answer: 'Download the SoloBeauté app, open the space, check its open time slots and message the host to confirm a time. Rent is paid to the host in cash on site.',
        },
        ...(hours
          ? [{
              question: 'What is the shortest booking?',
              answer: `Each host sets a minimum. Of the ${plural(withHours, 'space')} here that list one, the minimum is ${hours} ${hours === '1' ? 'hour' : 'hours'}; the table above shows it for each space.`,
            }]
          : []),
      ]
    : [
        {
          question: '怎麼租？怎麼付款？',
          answer: '下載 SoloBeauté App，打開空間頁看可用時段，傳訊息跟屋主確認時間。租金現場付現給屋主。',
        },
        ...(hours
          ? [{
              question: '最短可以租多久？',
              answer: `最低時數由屋主設定。這頁有填最低時數的 ${withHours} 個空間，最低時數是 ${hours} 小時，每間的時數見上方表格。`,
            }]
          : []),
      ]
  return { ...view, faq: [...view.faq, ...extra] }
}

// --- P4 district -------------------------------------------------------------

export function buildDistrictView(def: DistrictPageDef, all: PublicSpace[], locale: AppLocale): TopicView {
  return withRentalFaq(buildDistrictViewBase(def, all, locale))
}

function buildDistrictViewBase(def: DistrictPageDef, all: PublicSpace[], locale: AppLocale): TopicView {
  const city = getCityBySlug(def.citySlug) as SpaceCity
  const isEn = locale === 'en'
  const L = linker(locale)
  const { dateLabel, cta, howTo } = common(locale)
  const path = districtPagePath(def)
  const spaces = ordered(spacesInDistrict(all, def))
  const n = spaces.length
  const hourly = rateStats(spaces, 'hourlyRate')
  const types = typeCounts(spaces)
  const services = serviceCounts(spaces)
  const withDay = spaces.filter(getTopic('daily').match).length
  const cityPath = cityPagePath(city)
  const otherDistricts = Array.from(new Set(all.filter((s) => s.city === city.name && s.district && s.district !== def.district).map((s) => s.district as string)))
    .map((district) => ({ district, spaces: all.filter((s) => s.city === city.name && s.district === district) }))
    .sort((a, b) => b.spaces.length - a.spaces.length || a.district.localeCompare(b.district, 'zh-Hant'))
  const short = def.label
  const shortEn = districtShortEn(def.district, city.name)
  const studio = def.style === 'studio'
  const allPrivate = n > 0 && spaces.every((s) => s.spaceType === 'PRIVATE_ROOM')
  const noun = studio ? '美容工作室' : '美業空間'
  const nounEn = studio ? (allPrivate ? 'beauty rooms' : 'beauty studios') : 'beauty workspaces'
  const NounEn = nounEn.charAt(0).toUpperCase() + nounEn.slice(1)
  const TitleNounEn = NounEn.replace(/\b\w/g, (c) => c.toUpperCase())
  const h1Zh = studio ? `${city.short}${def.district}${noun}時租` : `${short}${noun}時租`
  const titleZh = studio
    ? `${h1Zh}｜${allPrivate ? '獨立房間' : '美業空間出租'}`
    : `${short}美業空間時租｜${short}美容工作室出租`
  // Theme pages that contain at least one space of this district.
  const related = relatedLinks(path, locale).filter((link) => {
    const topic = TOPIC_PAGES.find((t) => L(t.path) === link.href)
    return !topic || spaces.some(topic.match)
  })
  const perSpaceServices: Cell[][] = spaces.map((s) => [
    spaceCell(s, L),
    isEn ? spaceTypeEn(s.spaceType) : spaceTypeLabel(s.spaceType),
    s.recommendedServices.length
      ? (isEn ? s.recommendedServices.map(serviceTagEn).join(', ') : s.recommendedServices.join('、'))
      : '—',
  ])
  const about = {
    '@type': 'AdministrativeArea',
    name: isEn ? `${districtEn(def.district, city.name)}, ${cityNameEn(city.name)}` : `${city.name}${def.district}`,
    containedInPlace: { '@type': 'AdministrativeArea', name: isEn ? cityNameEn(city.name) : city.name },
  }
  const spaceRows: Cell[][] = spaces.map((s) => [
    spaceCell(s, L),
    isEn ? spaceTypeEn(s.spaceType) : spaceTypeLabel(s.spaceType),
    hasRate(s.hourlyRate) ? formatNtd(s.hourlyRate) : '—',
    hasRate(s.halfDayRate) ? formatNtd(s.halfDayRate) : '—',
    hasRate(s.fullDayRate) ? formatNtd(s.fullDayRate) : '—',
    hasRate(s.minimumHours) ? (isEn ? `${s.minimumHours} h` : `${s.minimumHours} 小時`) : '—',
  ])
  const districtAnchor = (district: string) =>
    hasDistrictSections(city.slug) ? `${L(cityPath)}#district-${encodeURIComponent(district)}` : L(cityPath)

  if (!isEn) {
    const blocks: TopicBlock[] = []
    if (n > 0) {
      blocks.push({
        id: 'compare',
        title: `${short} ${n} 個空間比較`,
        note: '「—」表示屋主沒有設定這個價格。',
        table: { caption: `${short}${noun}比較`, head: ['空間', '類型', '時租', '半日', '全日', '最低時數'], rows: spaceRows },
      })
      if (services.length) {
        blocks.push({
          id: 'services',
          title: `${short}的空間適合哪些服務`,
          note: '依屋主標示；一個空間可以標示多種服務。',
          table: { caption: `${short}空間適合的服務`, head: ['服務', '空間數'], rows: services.map((s) => [s.group.prose, `${s.n} / ${n} 間`]) },
        })
        blocks.push({
          id: 'per-space',
          title: `${short}每個空間標示的服務`,
          note: '依屋主在空間頁標示的建議服務。',
          table: { caption: `${short}每個空間的服務`, head: ['空間', '類型', '屋主標示的服務'], rows: perSpaceServices },
        })
      }
      if (otherDistricts.length) {
        blocks.push({
          id: 'other-districts',
          title: `${city.short}其他區`,
          table: {
            caption: `${city.short}其他區的美業空間`,
            head: ['區', '空間數', '時租'],
            rows: [
              [`${def.district}（這一頁）`, `${n} 間`, rangeZh(hourly)],
              ...otherDistricts.map((d) => [{ text: d.district, href: districtAnchor(d.district) }, `${d.spaces.length} 間`, rangeZh(rateStats(d.spaces, 'hourlyRate'))] as Cell[]),
            ],
          },
          links: [{ href: L(cityPath), label: `看${city.short}全部美業空間 →` }],
        })
      }
    }
    const otherText = otherDistricts.map((d) => `${d.district} ${d.spaces.length} 個（${rangeZh(rateStats(d.spaces, 'hourlyRate'))}）`).join('、')
    const faq: QA[] = n > 0
      ? [
          {
            question: `${short}${noun}時租多少錢？`,
            answer: `截至 ${dateLabel}，SoloBeauté 在${city.name}${def.district}有 ${n} 個美業空間，時租 ${rangeZh(hourly)}${hourly.n >= 2 ? `，中位數 ${money(hourly.median)}` : ''}${withDay ? (withDay === n ? `；${n} 個都另有半日或全日價格` : `；其中 ${withDay} 個另有半日或全日價格`) : ''}。`,
          },
          ...(services.length
            ? [{
                question: `${short}的${noun}適合哪些服務？`,
                answer: `依屋主標示，${services.map((s) => `${s.n} 個適合${s.group.prose}`).join('、')}。`,
              }]
            : []),
          ...(otherDistricts.length
            ? [{
                question: `${short}以外，${city.short}還有哪些區有美業空間？`,
                answer: `截至 ${dateLabel}，${city.short}另外有${otherText}。`,
              }]
            : []),
        ]
      : []
    return {
      locale,
      path,
      count: n,
      indexable: isTopicIndexable(n),
      title: titleZh,
      ogTitle: `${h1Zh}｜SoloBeauté`,
      description: n > 0
        ? `${studio ? `${city.short}${def.district}` : short}美容工作室時租 ${rangeZh(hourly)}：SoloBeauté 在${city.name}${def.district}有 ${n} 個美業空間（${types.map((t) => `${spaceTypeLabel(t.type)} ${t.spaces.length}`).join('、')}）。美業職人按小時租，在 App 預約，現場付現。`
        : `${h1Zh}。新空間陸續上架中，下載 SoloBeauté App 查看最新空間。`,
      tag: `${city.name}${def.district}`,
      h1: h1Zh,
      breadcrumbs: [
        { label: '首頁', path: '/' },
        { label: '美業空間', path: '/spaces' },
        { label: city.name, path: cityPath },
        { label: def.district },
      ],
      lead: n > 0
        ? `截至 ${dateLabel}，SoloBeauté 在${city.name}${def.district}有 ${n} 個美業空間，類型是${types.map((t) => `${spaceTypeLabel(t.type)} ${t.spaces.length} 個`).join('、')}，時租 ${rangeZh(hourly)}${hourly.n >= 2 ? `，中位數 ${money(hourly.median)}` : ''}。`
        : `截至 ${dateLabel}，SoloBeauté 在${city.name}${def.district}還沒有上架中的空間，新空間陸續上架中。`,
      intro: [
        n > 0
          ? `${withDay ? (withDay === n ? `${n} 個都另有半日或全日價格。` : `其中 ${withDay} 個另有半日或全日價格。`) : ''}${services.length ? `依屋主標示，${services.map((s) => `${s.n} 個適合${s.group.prose}`).join('、')}。` : ''}`
          : `可以先看${city.short}其他區的空間。`,
        howTo,
      ].filter(Boolean),
      facts: [
        { label: '空間', value: `${n} 間` },
        { label: '時租', value: rangeZh(hourly) },
        { label: '有半日或全日價', value: `${withDay} 間` },
        { label: `${city.short}其他區`, value: `${otherDistricts.length} 區` },
      ],
      dateNote: `資料日期：${dateLabel}，依 SoloBeauté 上架中的空間即時計算。`,
      noindexNote: noindexNote(n, locale),
      blocks,
      lists: n > 0 ? [{ id: 'spaces', title: `${short}的${noun}（${n} 間）`, spaces }] : [],
      faqTitle: `${short}${noun}常見問題`,
      faq,
      related: {
        title: '繼續看',
        links: [{ href: L(cityPath), label: `${city.short}美業空間時租` }, ...related],
      },
      cta,
      itemListName: `SoloBeauté ${city.name}${def.district}${noun}`,
      about,
    }
  }

  const blocks: TopicBlock[] = []
  if (n > 0) {
    blocks.push({
      id: 'compare',
      title: `The ${plural(n, 'space')} in ${shortEn} compared`,
      note: '"—" means the host has not set that rate.',
      table: { caption: `${NounEn} in ${shortEn} compared`, head: ['Space', 'Type', 'Hourly', 'Half day', 'Full day', 'Minimum'], rows: spaceRows },
    })
    if (services.length) {
      blocks.push({
        id: 'services',
        title: `Services the ${shortEn} spaces suit`,
        note: 'Based on what hosts mark; a space can be marked for several services.',
        table: { caption: `Services for ${shortEn} spaces`, head: ['Service', 'Spaces'], rows: services.map((s) => [SERVICE_GROUP_EN[s.group.key]?.prose ?? s.group.prose, `${s.n} / ${n}`]) },
      })
      blocks.push({
        id: 'per-space',
        title: `Services each ${shortEn} space lists`,
        note: 'As marked by the host on each space page.',
        table: { caption: `Services by space in ${shortEn}`, head: ['Space', 'Type', 'Services the host lists'], rows: perSpaceServices },
      })
    }
    if (otherDistricts.length) {
      blocks.push({
        id: 'other-districts',
        title: `Other districts in ${cityShortEn(city)}`,
        table: {
          caption: `Beauty workspaces in other ${cityShortEn(city)} districts`,
          head: ['District', 'Spaces', 'Hourly rate'],
          rows: [
            [`${districtEn(def.district, city.name)} (this page)`, `${n}`, rangeEn(hourly)],
            ...otherDistricts.map((d) => [{ text: districtEn(d.district, city.name), href: districtAnchor(d.district) }, `${d.spaces.length}`, rangeEn(rateStats(d.spaces, 'hourlyRate'))] as Cell[]),
          ],
        },
        links: [{ href: L(cityPath), label: `All beauty workspaces in ${cityShortEn(city)} →` }],
      })
    }
  }
  const faq: QA[] = n > 0
    ? [
        {
          question: `How much does a ${nounEn.replace(/s$/, '')} in ${shortEn} cost per hour?`,
          answer: `As of ${dateLabel}, SoloBeauté lists ${plural(n, 'beauty workspace')} in ${districtEn(def.district, city.name)}, ${cityNameEn(city.name)}, at ${rangeEn(hourly)} per hour${hourly.n >= 2 ? ` (median ${money(hourly.median)})` : ''}${withDay ? (withDay === n ? `; all ${n} also set a half-day or full-day rate` : `; ${withDay} also set a half-day or full-day rate`) : ''}.`,
        },
        ...(services.length
          ? [{
              question: `Which services do the ${shortEn} spaces suit?`,
              answer: `Based on what hosts mark, ${joinEn(services.map((s) => `${s.n} suit ${SERVICE_GROUP_EN[s.group.key]?.prose ?? s.group.prose}`))}.`,
            }]
          : []),
        ...(otherDistricts.length
          ? [{
              question: `Which other ${cityShortEn(city)} districts have beauty workspaces?`,
              answer: `As of ${dateLabel}, ${cityShortEn(city)} also has ${joinEn(otherDistricts.map((d) => `${plural(d.spaces.length, 'space')} in ${districtShortEn(d.district, city.name)} (${rangeEn(rateStats(d.spaces, 'hourlyRate'))})`))}.`,
            }]
          : []),
      ]
    : []
  return {
    locale,
    path,
    count: n,
    indexable: isTopicIndexable(n),
    title: `${TitleNounEn} for Rent by the Hour in ${shortEn}, ${cityShortEn(city)}`,
    ogTitle: `${NounEn} in ${shortEn} by the hour | SoloBeauté`,
    description: n > 0
      ? `Beauty studios in ${shortEn} from ${rangeEn(hourly)} per hour: SoloBeauté lists ${plural(n, 'workspace')} in ${districtEn(def.district, city.name)}, ${cityNameEn(city.name)} (${joinEn(types.map((t) => plural(t.spaces.length, spaceTypeEn(t.type).toLowerCase())))}). Book in the app and pay the host in cash on site.`
      : `${NounEn} for hourly rent in ${shortEn}. New spaces are being listed; download the SoloBeauté app to see the latest.`,
    tag: `${districtEn(def.district, city.name)}, ${cityNameEn(city.name)}`,
    h1: studio ? `${NounEn} by the hour in ${shortEn}, ${cityShortEn(city)}` : `${NounEn} by the hour in ${shortEn}`,
    breadcrumbs: [
      { label: 'Home', path: '/' },
      { label: 'Beauty workspaces', path: '/spaces' },
      { label: cityNameEn(city.name), path: cityPath },
      { label: districtEn(def.district, city.name) },
    ],
    lead: n > 0
      ? `As of ${dateLabel}, SoloBeauté lists ${plural(n, 'beauty workspace')} in ${districtEn(def.district, city.name)}, ${cityNameEn(city.name)}: ${joinEn(types.map((t) => plural(t.spaces.length, spaceTypeEn(t.type).toLowerCase())))}, at ${rangeEn(hourly)} per hour${hourly.n >= 2 ? ` (median ${money(hourly.median)})` : ''}.`
      : `As of ${dateLabel}, there are no listed spaces in ${districtEn(def.district, city.name)} yet. New spaces are being listed.`,
    intro: [
      n > 0
        ? [withDay ? (withDay === n ? `All ${n} also set a half-day or full-day rate.` : `${withDay} of them also set a half-day or full-day rate.`) : '', services.length ? `Based on what hosts mark, ${joinEn(services.map((s) => `${s.n} suit ${SERVICE_GROUP_EN[s.group.key]?.prose ?? s.group.prose}`))}.` : ''].filter(Boolean).join(' ')
        : `See the other districts in ${cityShortEn(city)} in the meantime.`,
      howTo,
    ].filter(Boolean),
    facts: [
      { label: 'Spaces', value: `${n}` },
      { label: 'Hourly rate', value: rangeEn(hourly) },
      { label: 'Day or half-day rate', value: `${withDay}` },
      { label: `Other ${cityShortEn(city)} districts`, value: `${otherDistricts.length}` },
    ],
    dateNote: `Data as of ${dateLabel}, calculated live from spaces currently listed on SoloBeauté.`,
    noindexNote: noindexNote(n, locale),
    blocks,
    lists: n > 0 ? [{ id: 'spaces', title: `${NounEn} in ${shortEn} (${n})`, spaces }] : [],
    faqTitle: `${NounEn} in ${shortEn}: FAQ`,
    faq,
    related: {
      title: 'Keep reading',
      links: [{ href: L(cityPath), label: `Beauty workspaces in ${cityShortEn(city)}` }, ...related],
    },
    cta,
    itemListName: `Beauty workspaces on SoloBeauté in ${districtEn(def.district, city.name)}, ${cityNameEn(city.name)}`,
    about,
  }
}

// --- internal links ----------------------------------------------------------

export type TopicLink = { href: string; label: string; count: number }

/**
 * Chips for /spaces and the city pages: only indexable theme/district pages.
 * With `cityName`, counts are the matching spaces in that city and pages with
 * no space there are dropped.
 */
export function topicLinks(all: PublicSpace[], locale: AppLocale, cityName?: string): TopicLink[] {
  const L = linker(locale)
  const isEn = locale === 'en'
  const links: TopicLink[] = []
  TOPIC_PAGES.forEach((topic) => {
    const matching = all.filter(topic.match)
    if (!isTopicIndexable(matching.length)) return
    const count = cityName ? matching.filter((s) => s.city === cityName).length : matching.length
    if (count === 0) return
    const city = cityName ? getCityByName(cityName) : null
    // On a city page the count is that city's share, so say so in the label.
    const label = city
      ? (isEn ? `${topic.labelEn} (${count} in ${cityShortEn(city)})` : `${topic.labelZh}（${city.short} ${count} 間）`)
      : (isEn ? `${topic.labelEn} · ${count}` : `${topic.labelZh} · ${count} 間`)
    links.push({ href: L(topic.path), label, count })
  })
  DISTRICT_PAGES.forEach((def) => {
    const city = getCityBySlug(def.citySlug)
    if (!city) return
    if (cityName && city.name !== cityName) return
    const count = spacesInDistrict(all, def).length
    if (!isTopicIndexable(count)) return
    const label = isEn
      ? `${districtShortEn(def.district, city.name)}, ${cityShortEn(city)} · ${count}`
      : `${city.short}${def.label.replace(/區$/, '')} · ${count} 間`
    links.push({ href: L(districtPagePath(def)), label, count })
  })
  return links
}
