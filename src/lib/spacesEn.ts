import {
  cameraDisclosureEn,
  districtEn,
  equipmentEn,
  joinEn,
  locationEn,
  serviceTagEn,
  spaceTypeEn,
} from './en'
import { formatNtd, truncateTitle } from './spaces'
import type { PublicSpace } from './types'

// English copy for the space pages (/en/spaces/[id]), built only from the
// structured fields. The host-written title and description stay as written.

const FALLBACK_SERVICES: Array<{ label: string; bannedIf: string }> = [
  { label: 'nails', bannedIf: '美甲' },
  { label: 'lashes', bannedIf: '睫毛' },
  { label: 'facials', bannedIf: '護膚' },
]

function servicesPhrase(space: PublicSpace): string {
  if (space.recommendedServices.length > 0) {
    return joinEn(space.recommendedServices.slice(0, 3).map((s) => serviceTagEn(s).toLowerCase()))
  }
  const allowed = FALLBACK_SERVICES
    .filter((item) => !space.prohibitedServices.some((banned) => banned.includes(item.bannedIf)))
    .map((item) => item.label)
  return allowed.length > 0 ? joinEn(allowed) : 'a range of beauty services'
}

function listPhrase(items: string[], max: number): string {
  if (items.length <= max) return joinEn(items)
  return `${items.slice(0, max).join(', ')} and ${items.length - max} more`
}

/** <title> without the layout's " | SoloBeauté" suffix. */
export function buildSpaceTitleEn(space: PublicSpace): string {
  const title = truncateTitle(space.title)
  const where = space.district ? districtEn(space.district, space.city) : locationEn(space)
  if (space.hourlyRate) {
    return `${title} | ${spaceTypeEn(space.spaceType)} for hourly rent in ${where}, ${formatNtd(space.hourlyRate)}/hour`
  }
  return `${title} | Beauty workspace for hourly rent in ${locationEn(space)}`
}

export function buildSpaceOgTitleEn(space: PublicSpace): string {
  return `${truncateTitle(space.title)} | Beauty workspace for hourly rent in ${locationEn(space)}`
}

export function buildSpaceDescriptionEn(space: PublicSpace): string {
  const rating = space.ratingCount >= 3 ? `, rated ${space.ratingAvg.toFixed(1)} stars (${space.ratingCount} reviews)` : ''
  const price = space.hourlyRate ? ` at ${formatNtd(space.hourlyRate)} per hour${rating}` : rating
  return `A ${spaceTypeEn(space.spaceType).toLowerCase()} in ${locationEn(space) || 'Taiwan'}${price}, suited to ${servicesPhrase(space)}. Rented by the hour with no long-term lease; message the host in the SoloBeauté app to book and pay on site.`
}

/** H1 subtitle: "Zhongshan District, Taipei City · Private room · NT$200/hour". */
export function buildSpaceSubtitleEn(space: PublicSpace): string {
  return [locationEn(space) || null, spaceTypeEn(space.spaceType), space.hourlyRate ? `${formatNtd(space.hourlyRate)}/hour` : null]
    .filter(Boolean)
    .join(' · ')
}

export function buildSpaceSummaryEn(space: PublicSpace): string {
  const sentences: string[] = []
  const privacy = space.spaceType === 'PRIVATE_ROOM' || space.isFullyPrivate ? ' with full privacy' : ''
  sentences.push(`${space.title} is a ${spaceTypeEn(space.spaceType).toLowerCase()}${privacy} in ${locationEn(space) || 'Taiwan'}, available to rent by the hour`)

  const prices: string[] = []
  if (space.hourlyRate) prices.push(`${formatNtd(space.hourlyRate)} per hour`)
  if (space.halfDayRate) prices.push(`${formatNtd(space.halfDayRate)} for a half day`)
  if (space.fullDayRate) prices.push(`${formatNtd(space.fullDayRate)} for a full day`)
  const priceLine = [prices.length ? `It costs ${joinEn(prices)}` : null, space.minimumHours ? `${prices.length ? 'with' : 'It has'} a ${space.minimumHours}-hour minimum` : null]
    .filter(Boolean)
    .join(', ')
  if (priceLine) sentences.push(priceLine)

  if (space.equipment.length > 0) {
    sentences.push(`Equipment on site: ${listPhrase(space.equipment.map((e) => equipmentEn(e).toLowerCase()), 6)}`)
  }
  if (space.recommendedServices.length > 0) {
    sentences.push(`Services the host recommends: ${listPhrase(space.recommendedServices.map((s) => serviceTagEn(s).toLowerCase()), 5)}`)
  }
  if (space.prohibitedServices.length > 0) {
    sentences.push(`Not allowed: ${listPhrase(space.prohibitedServices.map((s) => serviceTagEn(s).toLowerCase()), 5)}`)
  }
  if (space.roomScanUrl) {
    sentences.push('There is a 3D tour so you can see the space first')
  }
  return `${sentences.join('. ')}.`
}

const PHOTO_CATEGORY_EN: Record<string, string> = {
  entrance: 'entrance',
  interior: 'interior',
  equipment: 'equipment',
}

export function photoAltEn(space: PublicSpace, category: string | null, index: number): string {
  const label = (category && PHOTO_CATEGORY_EN[category]) || 'space'
  return `${space.title} ${label} photo ${index + 1}`
}

export { cameraDisclosureEn }
