import { cache } from 'react'

import { getCityByName } from './cities'
import { API_BASE_URL, SERVICE_AREAS } from './constants'
import { resolveImageUrl } from './format'
import type {
  CameraDisclosureStatus,
  PublicSpace,
  RawSpaceDetailResponse,
  RawSpaceListResponse,
  RawSpaceRecord,
  SpaceType,
} from './types'

/** ISR / data-cache window for every space request (seconds). */
export const SPACE_REVALIDATE_SECONDS = 3600

const API_PAGE_LIMIT = 50
const MAX_PAGES = 20 // safety cap → up to 1000 spaces

// The backend answers a non-UUID id with HTTP 500, so reject those before
// calling it and treat them as a plain 404.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const SPACE_TYPES: SpaceType[] = ['OPEN_SPACE', 'CURTAIN_PARTITION', 'PRIVATE_ROOM']
const CAMERA_STATUSES: CameraDisclosureStatus[] = ['HAS_CAMERA', 'NO_CAMERA', 'UNDISCLOSED']

function stringList(value: string[] | null | undefined): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
    : []
}

function positiveNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

/**
 * Only spaces that are ACTIVE and not soft-deleted are public.
 * GET /spaces/:id only checks `deletedAt` (beautyhub-backend spaces.ts:45),
 * so DRAFT / INACTIVE / SUSPENDED spaces must be rejected here.
 */
export function isPublicSpace(raw: RawSpaceRecord | null | undefined): raw is RawSpaceRecord {
  return Boolean(raw && raw.id && raw.status === 'ACTIVE' && !raw.deletedAt)
}

/**
 * Whitelist mapper. Everything the pages render or serialise comes from the
 * object returned here — street address, latitude/longitude, host, camera
 * locations, bookings and schedules are dropped on the server.
 */
export function toPublicSpace(raw: RawSpaceRecord): PublicSpace {
  const photos = (Array.isArray(raw.photos) ? raw.photos : [])
    .slice()
    .sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0))
    .map((photo) => ({
      url: resolveImageUrl(photo?.url ?? null),
      category: typeof photo?.category === 'string' ? photo.category : null,
    }))
    .filter((photo): photo is { url: string; category: string | null } => Boolean(photo.url))

  const spaceType = SPACE_TYPES.includes(raw.spaceType as SpaceType) ? (raw.spaceType as SpaceType) : null
  const camera = CAMERA_STATUSES.includes(raw.cameraDisclosureStatus as CameraDisclosureStatus)
    ? (raw.cameraDisclosureStatus as CameraDisclosureStatus)
    : null
  const description = typeof raw.description === 'string' ? raw.description.trim() : ''

  return {
    id: raw.id,
    title: (raw.title ?? '').trim() || '美業空間',
    description: description || null,
    city: raw.city?.trim() || null,
    district: raw.district?.trim() || null,
    spaceType,
    isFullyPrivate: raw.isFullyPrivate === true,
    hourlyRate: positiveNumber(raw.hourlyRate),
    halfDayRate: positiveNumber(raw.halfDayRate),
    fullDayRate: positiveNumber(raw.fullDayRate),
    minimumHours: positiveNumber(raw.minimumHours),
    maxCapacity: positiveNumber(raw.maxCapacity),
    equipment: stringList(raw.equipment),
    recommendedServices: stringList(raw.recommendedServices),
    prohibitedServices: stringList(raw.prohibitedServices),
    cameraDisclosureStatus: camera,
    coverPhotoUrl: resolveImageUrl(raw.coverPhoto?.url ?? null) ?? photos[0]?.url ?? null,
    photos,
    roomScanUrl: resolveImageUrl(raw.roomScan?.usdzUrl ?? null),
    ratingAvg: typeof raw.ratingAvg === 'number' ? raw.ratingAvg : 0,
    ratingCount: typeof raw.ratingCount === 'number' ? raw.ratingCount : 0,
    updatedAt: raw.updatedAt ?? null,
  }
}

async function fetchSpacePage(page: number): Promise<RawSpaceListResponse> {
  const response = await fetch(`${API_BASE_URL}/spaces?limit=${API_PAGE_LIMIT}&page=${page}`, {
    next: { revalidate: SPACE_REVALIDATE_SECONDS },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch spaces (status=${response.status}) page=${page}`)
  }

  return (await response.json()) as RawSpaceListResponse
}

/** Every ACTIVE space, already reduced to the public whitelist. */
export const fetchPublicSpaces = cache(async (): Promise<PublicSpace[]> => {
  const first = await fetchSpacePage(1)
  const records: RawSpaceRecord[] = [...(first.data ?? [])]
  const totalPages = Math.min(first.pagination?.totalPages ?? 1, MAX_PAGES)

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchSpacePage(page)
    records.push(...(next.data ?? []))
  }

  const seen = new Set<string>()
  return records.filter(isPublicSpace).flatMap((raw) => {
    if (seen.has(raw.id)) return []
    seen.add(raw.id)
    return [toPublicSpace(raw)]
  })
})

/** One public space, or null when it does not exist or is not ACTIVE. */
export const fetchPublicSpaceById = cache(async (id: string): Promise<PublicSpace | null> => {
  if (!UUID_RE.test(id)) {
    return null
  }

  const response = await fetch(`${API_BASE_URL}/spaces/${id}`, {
    next: { revalidate: SPACE_REVALIDATE_SECONDS },
  })

  if (response.status === 404 || response.status === 400) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch space (status=${response.status})`)
  }

  const payload = (await response.json()) as RawSpaceDetailResponse
  return isPublicSpace(payload.data) ? toPublicSpace(payload.data) : null
})

// ---------------------------------------------------------------------------
// Copy helpers (zh-TW only; templates from seo_copy_v1.md §5.2)
// ---------------------------------------------------------------------------

const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  OPEN_SPACE: '開放空間',
  CURTAIN_PARTITION: '拉簾隔間',
  PRIVATE_ROOM: '獨立房間',
}

// seo_copy_v1.md §5.2 fallback when a host listed no recommended services.
// Items the host explicitly bans (e.g. 手美甲 → 美甲) are dropped.
const FALLBACK_SERVICES: Array<{ label: string; bannedIf: string }> = [
  { label: '美甲', bannedIf: '美甲' },
  { label: '美睫', bannedIf: '睫毛' },
  { label: '護膚', bannedIf: '護膚' },
]

export function spaceTypeLabel(type: SpaceType | null): string {
  return type ? SPACE_TYPE_LABELS[type] : '美業空間'
}

export function formatNtd(value: number): string {
  return `NT$${value.toLocaleString('en-US')}`
}

export function locationLabel(space: Pick<PublicSpace, 'city' | 'district'>): string {
  return `${space.city ?? ''}${space.district ?? ''}`
}

/** `{title}` is cut to 12 characters + "…" so the keywords after it survive. */
export function truncateTitle(title: string, max = 12): string {
  const chars = Array.from(title)
  return chars.length > max ? `${chars.slice(0, max).join('')}…` : title
}

function servicesPhrase(space: PublicSpace): string {
  if (space.recommendedServices.length > 0) {
    return space.recommendedServices.slice(0, 3).join('、')
  }
  const allowed = FALLBACK_SERVICES
    .filter((item) => !space.prohibitedServices.some((banned) => banned.includes(item.bannedIf)))
    .map((item) => item.label)
  return allowed.length > 0 ? allowed.join('、') : '各類美業服務'
}

/** <title> without the layout's " | SoloBeauté" suffix. */
export function buildSpaceTitle(space: PublicSpace): string {
  const title = truncateTitle(space.title)
  if (space.hourlyRate) {
    return `${title}｜${space.district ?? space.city ?? ''}${spaceTypeLabel(space.spaceType)}時租 ${formatNtd(space.hourlyRate)}`
  }
  return `${title}｜${locationLabel(space)}美業空間時租`
}

export function buildSpaceOgTitle(space: PublicSpace): string {
  return `${truncateTitle(space.title)}｜${locationLabel(space)}美業空間時租`
}

export function buildSpaceDescription(space: PublicSpace): string {
  const rating = space.ratingCount >= 3
    ? `，${space.ratingAvg.toFixed(1)} 星（${space.ratingCount} 則評價）`
    : ''
  const price = space.hourlyRate ? `，時租 ${formatNtd(space.hourlyRate)}${rating}` : rating
  return `${locationLabel(space)}的${spaceTypeLabel(space.spaceType)}${price}，適合${servicesPhrase(space)}。按小時租，在 SoloBeauté App 直接傳訊息給屋主預約，現場付現。`
}

/** H1 subtitle: `{city}{district}・{spaceType}・NT${hourlyRate}／小時`. */
export function buildSpaceSubtitle(space: PublicSpace): string {
  return [
    locationLabel(space) || null,
    spaceTypeLabel(space.spaceType),
    space.hourlyRate ? `${formatNtd(space.hourlyRate)}／小時` : null,
  ].filter(Boolean).join('・')
}

function listPhrase(items: string[], max: number): string {
  if (items.length <= max) return items.join('、')
  return `${items.slice(0, max).join('、')}等 ${items.length} 項`
}

/**
 * Factual summary generated only from structured fields. Rendered on every
 * space page (and used as the JSON-LD description) so pages whose host
 * description is empty or a single line still have real content.
 */
export function buildSpaceSummary(space: PublicSpace): string {
  const sentences: string[] = []
  const where = locationLabel(space)
  const privacy = space.spaceType === 'PRIVATE_ROOM' || space.isFullyPrivate ? '，有獨立隱私' : ''
  sentences.push(`${space.title}位於${where || '台灣'}，是一間${spaceTypeLabel(space.spaceType)}${privacy}，可以按小時租用`)

  const prices: string[] = []
  if (space.hourlyRate) prices.push(`時租 ${formatNtd(space.hourlyRate)}`)
  if (space.halfDayRate) prices.push(`半日 ${formatNtd(space.halfDayRate)}`)
  if (space.fullDayRate) prices.push(`全日 ${formatNtd(space.fullDayRate)}`)
  const minHours = space.minimumHours ? `最低租用 ${space.minimumHours} 小時` : null
  const priceLine = [prices.join('、'), minHours].filter(Boolean).join('，')
  if (priceLine) sentences.push(priceLine)

  if (space.equipment.length > 0) {
    sentences.push(`現場設備有${listPhrase(space.equipment, 6)}`)
  }
  if (space.recommendedServices.length > 0) {
    sentences.push(`屋主建議的服務項目：${listPhrase(space.recommendedServices, 5)}`)
  }
  if (space.prohibitedServices.length > 0) {
    sentences.push(`不開放：${listPhrase(space.prohibitedServices, 5)}`)
  }
  if (space.roomScanUrl) {
    sentences.push('有 3D 實景可以先看空間')
  }

  return `${sentences.join('。')}。`
}

export function cameraDisclosureLabel(status: CameraDisclosureStatus | null): string | null {
  switch (status) {
    case 'HAS_CAMERA':
      return '空間內有攝影機（屋主已揭露）'
    case 'NO_CAMERA':
      return '屋主表示空間內沒有攝影機'
    case 'UNDISCLOSED':
      return '屋主尚未說明攝影機資訊，預約前可以先在 App 詢問'
    default:
      return null
  }
}

const PHOTO_CATEGORY_LABELS: Record<string, string> = {
  entrance: '入口',
  interior: '室內',
  equipment: '設備',
}

export function photoAlt(space: PublicSpace, category: string | null, index: number): string {
  const label = (category && PHOTO_CATEGORY_LABELS[category]) || '空間'
  return `${space.title} ${label}照片 ${index + 1}`
}

// City grouping for /spaces -------------------------------------------------

export function cityAnchor(city: string): string {
  return `city-${getCityByName(city)?.slug ?? encodeURIComponent(city)}`
}

export type SpaceCityGroup = {
  city: string
  anchor: string
  spaces: PublicSpace[]
}

export function groupSpacesByCity(spaces: PublicSpace[]): SpaceCityGroup[] {
  const groups = new Map<string, PublicSpace[]>()
  spaces.forEach((space) => {
    const city = space.city ?? '其他地區'
    groups.set(city, [...(groups.get(city) ?? []), space])
  })

  const order = SERVICE_AREAS as readonly string[]
  const rank = (city: string) => {
    const index = order.indexOf(city)
    return index === -1 ? order.length : index
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b, 'zh-Hant'))
    .map(([city, items]) => ({
      city,
      anchor: cityAnchor(city),
      spaces: items.slice().sort((a, b) =>
        (a.district ?? '').localeCompare(b.district ?? '', 'zh-Hant') || (a.hourlyRate ?? 0) - (b.hourlyRate ?? 0)
      ),
    }))
}

export function rateRange(spaces: PublicSpace[]): { min: number; max: number } | null {
  const rates = spaces.map((space) => space.hourlyRate).filter((rate): rate is number => rate !== null)
  if (rates.length === 0) return null
  return { min: Math.min(...rates), max: Math.max(...rates) }
}

/** Short city name used in copy: 台北市 → 台北, 彰化縣 → 彰化. */
export function shortCityName(city: string): string {
  return city.replace(/[市縣]$/, '')
}
