import { API_BASE_URL } from '../constants'
import { resolveImageUrl, sortSocialLinks } from '../format'
import { isPublicSpace, toPublicSpace } from '../spaces'
import type { PublicSpace, RawSpaceDetailResponse, RawSpaceListResponse, RawSpaceRecord, SocialLinks } from '../types'
import { CACHE_TTL, cached } from './cache'
import { partnerKeyConfigured, partnerKeyHeaders } from './partnerKey'

// ---------------------------------------------------------------------------
// Upstream reads for the MCP server. Only public backend endpoints are used:
//   GET /spaces, GET /spaces/:id                (spaces; ACTIVE only)
//   GET /beauticians                            (public beautician list)
//   GET /beauticians/:slug                      (only for a slug that is in the public list)
//   GET /public/spaces/:id/availability         (new public endpoint, backend #192;
//                                                 carries X-Partner-Key when configured)
// Never called: /beauticians/:uuid, /beauticians/:id/services (they skip the
// web-visibility check) and the old /spaces/:id/availability.
// Every record is reduced to an explicit whitelist before it leaves here:
// no userId, user object, phone, email, street address or coordinates.
// ---------------------------------------------------------------------------

const PAGE_LIMIT = 50
const MAX_PAGES = 20
const TIMEOUT_MS = 8_000

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export class UpstreamError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UpstreamError'
  }
}

type UpstreamResponse = { status: number; json: unknown }

async function getUpstream(path: string): Promise<UpstreamResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      cache: 'no-store',
      headers: { accept: 'application/json', ...partnerKeyHeaders(path) },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    throw new UpstreamError(`fetch failed: ${(error as Error).message}`)
  }
  const text = await response.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  if (response.status === 401) {
    // Public reads never need auth, so 401 means the partner key was rejected (wrong, rotated or
    // too short). The backend does not fall back to the anonymous limit — log it so it gets fixed;
    // callers answer 「暫時無法取得」. Never log the key itself.
    const code = isRecord(json) ? (str(json.code) ?? str(json.error)) : null
    console.error(
      `[mcp] upstream 401 ${code ?? 'UNAUTHORIZED'} on GET ${path.split('?')[0]} ` +
        `(partner key ${partnerKeyConfigured() ? 'set' : 'not set'}; check SOLOBEAUTE_PUBLIC_API_PARTNER_KEY against backend PUBLIC_API_PARTNER_KEYS)`
    )
  }
  return { status: response.status, json }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function strList(value: unknown, max = 50): string[] {
  return Array.isArray(value)
    ? value.flatMap((item) => (typeof item === 'string' && item.trim() ? [item.trim()] : [])).slice(0, max)
    : []
}

export function truncate(text: string | null, max: number): string | null {
  if (!text) return null
  const chars = Array.from(text)
  return chars.length > max ? `${chars.slice(0, max).join('')}…` : text
}

// --- spaces ----------------------------------------------------------------

export async function loadPublicSpaces(): Promise<PublicSpace[]> {
  return cached('spaces:list', CACHE_TTL.list, async () => {
    const records: RawSpaceRecord[] = []
    let totalPages = 1
    for (let page = 1; page <= Math.min(totalPages, MAX_PAGES); page += 1) {
      const { status, json } = await getUpstream(`/spaces?limit=${PAGE_LIMIT}&page=${page}`)
      if (status !== 200 || !isRecord(json)) throw new UpstreamError(`spaces list status=${status}`)
      const body = json as RawSpaceListResponse
      records.push(...(Array.isArray(body.data) ? body.data : []))
      totalPages = body.pagination?.totalPages ?? 1
    }
    const seen = new Set<string>()
    return records.filter(isPublicSpace).flatMap((raw) => {
      if (seen.has(raw.id)) return []
      seen.add(raw.id)
      return [toPublicSpace(raw)]
    })
  })
}

/** One ACTIVE space, or null. Non-UUID ids never reach the backend. */
export async function loadPublicSpace(id: string): Promise<PublicSpace | null> {
  if (!UUID_RE.test(id)) return null
  const key = id.toLowerCase()
  return cached(`spaces:detail:${key}`, CACHE_TTL.detail, async () => {
    const { status, json } = await getUpstream(`/spaces/${key}`)
    if (status === 404 || status === 400) return null
    if (status !== 200 || !isRecord(json)) throw new UpstreamError(`space detail status=${status}`)
    const record = (json as RawSpaceDetailResponse).data
    return isPublicSpace(record) ? toPublicSpace(record) : null
  })
}

// --- beauticians -----------------------------------------------------------

export type PublicBeauticianService = {
  id: string
  name: string
  category: string | null
  price: number
  durationMin: number | null
  description: string | null
}

export type PublicBeautician = {
  id: string
  slug: string | null
  displayName: string
  bio: string | null
  specialties: string[]
  licenses: string[]
  licenseVerified: boolean
  yearsExperience: number | null
  serviceArea: { city: string; district: string | null } | null
  ratingAvg: number
  ratingCount: number
  services: PublicBeauticianService[]
  /** Active services the backend counted; the list endpoint only returns the 3 cheapest. */
  serviceCount: number
  portfolioUrls: string[]
  portfolioPreviewUrl: string | null
  socialLinks: Array<{ key: string; href: string }>
  updatedAt: string | null
}

function toPublicService(raw: unknown): PublicBeauticianService | null {
  if (!isRecord(raw)) return null
  const id = str(raw.id)
  const name = str(raw.name)
  const price = num(raw.price)
  if (!id || !name || price === null || price < 0) return null
  if (raw.isActive === false || raw.deletedAt) return null
  const duration = num(raw.durationMin)
  return {
    id,
    name,
    category: str(raw.category),
    price,
    durationMin: duration !== null && duration > 0 ? duration : null,
    description: truncate(str(raw.description), 300),
  }
}

/** Whitelist mapper for one public beautician record. */
function toPublicBeautician(raw: unknown): PublicBeautician | null {
  if (!isRecord(raw)) return null
  const id = str(raw.id)
  const displayName = str(raw.displayName)
  if (!id || !UUID_RE.test(id) || !displayName) return null

  const services = (Array.isArray(raw.services) ? raw.services : [])
    .map(toPublicService)
    .filter((service): service is PublicBeauticianService => service !== null)
    .sort((a, b) => a.price - b.price)
  const area = isRecord(raw.serviceArea) ? raw.serviceArea : null
  const city = area ? str(area.city) : null
  const social = isRecord(raw.socialLinks) ? (raw.socialLinks as SocialLinks) : {}
  const counted = num(raw.serviceCount)
  const years = num(raw.yearsExperience)

  return {
    id: id.toLowerCase(),
    slug: str(raw.slug),
    displayName,
    bio: truncate(str(raw.bio), 800),
    specialties: strList(raw.specialties, 20),
    licenses: strList(raw.licenses, 20),
    licenseVerified: raw.licenseVerified === true,
    yearsExperience: years !== null && years > 0 ? years : null,
    serviceArea: city ? { city, district: area ? str(area.district) : null } : null,
    ratingAvg: num(raw.ratingAvg) ?? 0,
    ratingCount: num(raw.ratingCount) ?? 0,
    services,
    serviceCount: Math.max(counted ?? 0, services.length),
    portfolioUrls: strList(raw.portfolioUrls, 6)
      .map((url) => resolveImageUrl(url))
      .filter((url): url is string => Boolean(url)),
    portfolioPreviewUrl: resolveImageUrl(str(raw.portfolioPreviewUrl)),
    socialLinks: sortSocialLinks(social).filter((link) => link.href.startsWith('https://')),
    updatedAt: str(raw.updatedAt),
  }
}

/** The public beautician list (backend applies its public/web-visible filter). */
export async function loadPublicBeauticians(): Promise<PublicBeautician[]> {
  return cached('beauticians:list', CACHE_TTL.list, async () => {
    const items: PublicBeautician[] = []
    let totalPages = 1
    for (let page = 1; page <= Math.min(totalPages, MAX_PAGES); page += 1) {
      const { status, json } = await getUpstream(`/beauticians?limit=${PAGE_LIMIT}&page=${page}`)
      if (status !== 200 || !isRecord(json)) throw new UpstreamError(`beauticians list status=${status}`)
      const data = Array.isArray(json.data) ? json.data : []
      data.forEach((raw) => {
        const item = toPublicBeautician(raw)
        if (item) items.push(item)
      })
      const pagination = isRecord(json.pagination) ? json.pagination : null
      totalPages = num(pagination?.totalPages) ?? 1
    }
    const seen = new Set<string>()
    return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)))
  })
}

/**
 * Resolve a `ref` (slug, or the profile id shown in the public list) against
 * the public list ONLY. Anything not in that list — including the UUID of a
 * hidden profile — is "not found" and is never sent to the backend.
 */
export async function findPublicBeautician(ref: string): Promise<PublicBeautician | null> {
  const needle = ref.trim()
  if (!needle || needle.length > 100) return null
  const list = await loadPublicBeauticians()
  if (UUID_RE.test(needle)) {
    const lower = needle.toLowerCase()
    return list.find((item) => item.id === lower) ?? null
  }
  return list.find((item) => item.slug !== null && item.slug === needle) ?? null
}

/**
 * Full public detail for a beautician that is already in the public list.
 * Only slug lookups go to the backend (the slug route enforces web
 * visibility); profiles without a slug keep the list data (3 cheapest
 * services). Returns `complete: false` when services may be missing.
 */
export async function loadBeauticianDetail(entry: PublicBeautician): Promise<{ beautician: PublicBeautician; complete: boolean }> {
  if (!entry.slug) {
    return { beautician: entry, complete: entry.services.length >= entry.serviceCount }
  }
  const slug = entry.slug
  try {
    const detail = await cached(`beauticians:slug:${slug}`, CACHE_TTL.detail, async () => {
      const { status, json } = await getUpstream(`/beauticians/${encodeURIComponent(slug)}`)
      if (status === 404) return null
      if (status !== 200 || !isRecord(json)) throw new UpstreamError(`beautician detail status=${status}`)
      return toPublicBeautician(json.data)
    })
    if (detail && detail.id === entry.id) {
      return { beautician: { ...detail, serviceCount: Math.max(entry.serviceCount, detail.services.length) }, complete: true }
    }
  } catch {
    // fall back to the list data below
  }
  return { beautician: entry, complete: entry.services.length >= entry.serviceCount }
}

// --- availability: GET /public/spaces/:id/availability (jasperbug/solobeaute#192) ---
// Response (200): { success, data: { spaceId, timezone: 'Asia/Taipei', from, to,
//   minBookingHours, maxAdvanceDays, maxDate, days: [{ date, dayOfWeek, isOpen, openTime,
//   closeTime, isOverride, bookedSlots: [{startTime,endTime}], blockedSlots: [...] }] } }
// (maxDate = today + maxAdvanceDays, Taipei; optional — older builds don't send it.)
// Errors: 404 SPACE_NOT_FOUND (not ACTIVE / unknown), 400 INVALID_DATE_RANGE
// (YYYY-MM-DD, yesterday ≤ from ≤ to ≤ maxDate in Taipei, ≤ 30 days), 401 INVALID_PARTNER_KEY
// (X-Partner-Key sent but wrong), 429 (60/min per IP anonymous, 600/min per partner key).
// Before #192 is deployed the route does not exist (Fastify default 404).

export type AvailabilitySlot = { startTime: string; endTime: string }

export type AvailabilityDay = {
  date: string
  dayOfWeek: number | null
  isOpen: boolean
  openTime: string | null
  closeTime: string | null
  bookedSlots: AvailabilitySlot[]
  blockedSlots: AvailabilitySlot[]
}

export type AvailabilityResult =
  | {
      kind: 'ok'
      minBookingHours: number | null
      maxAdvanceDays: number | null
      maxDate: string | null
      timezone: string
      days: AvailabilityDay[]
    }
  | { kind: 'not_open' }
  | { kind: 'not_found' }
  | { kind: 'invalid_range' }
  | { kind: 'rate_limited' }
  | { kind: 'unavailable' }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/

function time(value: unknown): string | null {
  const text = str(value)
  if (!text) return null
  const hhmm = text.length >= 5 ? text.slice(0, 5) : text
  return TIME_RE.test(hhmm) ? hhmm : null
}

function slots(value: unknown): AvailabilitySlot[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((slot) => {
    if (!isRecord(slot)) return []
    // Only the times — any other field (ids, names, reasons) is dropped.
    const startTime = time(slot.startTime)
    const endTime = time(slot.endTime)
    return startTime && endTime ? [{ startTime, endTime }] : []
  }).slice(0, 96)
}

function toDay(raw: unknown): AvailabilityDay | null {
  if (!isRecord(raw)) return null
  const date = str(raw.date)
  if (!date || !DATE_RE.test(date)) return null
  const dow = num(raw.dayOfWeek)
  const isOpen = raw.isOpen === true
  return {
    date,
    dayOfWeek: dow !== null && dow >= 0 && dow <= 6 ? dow : null,
    isOpen,
    openTime: isOpen ? time(raw.openTime) : null,
    closeTime: isOpen ? time(raw.closeTime) : null,
    bookedSlots: slots(raw.bookedSlots),
    blockedSlots: slots(raw.blockedSlots),
  }
}

function errorCode(json: unknown): string | null {
  if (!isRecord(json)) return null
  return str(json.code) ?? str(json.error)
}

export async function loadAvailability(spaceId: string, from: string, to: string): Promise<AvailabilityResult> {
  const id = spaceId.toLowerCase()
  return cached(`availability:${id}:${from}:${to}`, CACHE_TTL.availability, async (): Promise<AvailabilityResult> => {
    let upstream: UpstreamResponse
    try {
      upstream = await getUpstream(`/public/spaces/${id}/availability?from=${from}&to=${to}`)
    } catch {
      return { kind: 'unavailable' }
    }
    const { status, json } = upstream
    const code = errorCode(json)
    if (status === 404) return code === 'SPACE_NOT_FOUND' ? { kind: 'not_found' } : { kind: 'not_open' }
    if (status === 400 && code === 'INVALID_DATE_RANGE') return { kind: 'invalid_range' }
    if (status === 401) return { kind: 'unavailable' } // partner key rejected; logged in getUpstream
    if (status === 429) return { kind: 'rate_limited' }
    if (status === 405 || status === 501) return { kind: 'not_open' }
    if (status !== 200 || !isRecord(json) || json.success !== true || !isRecord(json.data)) return { kind: 'unavailable' }

    const data = json.data
    if (!Array.isArray(data.days)) return { kind: 'unavailable' }
    const minHours = num(data.minBookingHours)
    const advance = num(data.maxAdvanceDays)
    const maxDate = str(data.maxDate)
    return {
      kind: 'ok',
      minBookingHours: minHours !== null && minHours > 0 ? minHours : null,
      maxAdvanceDays: advance !== null && advance > 0 ? advance : null,
      maxDate: maxDate && DATE_RE.test(maxDate) ? maxDate : null,
      timezone: str(data.timezone) ?? 'Asia/Taipei',
      days: data.days
        .map(toDay)
        .filter((day): day is AvailabilityDay => day !== null && day.date >= from && day.date <= to)
        .slice(0, 31),
    }
  })
}
