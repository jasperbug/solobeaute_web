import enMessages from '@/i18n/messages/en.json'
import zhMessages from '@/i18n/messages/zh-TW.json'

import { normalizeCityName } from '../cities'
import { CATEGORY_OPTIONS } from '../constants'
import { cameraDisclosureEn, cityNameEn, districtEn, equipmentEn, serviceTagEn, spaceTypeEn } from '../en'
import { cameraDisclosureLabel, spaceTypeLabel } from '../spaces'
import type { PublicSpace } from '../types'
import type { McpLocale } from './copy'
import { type PublicBeautician, truncate } from './data'
import { beauticianLinks, spaceLinks } from './links'

// Locale-aware, whitelisted views of spaces and beauticians for MCP results.
// Host- and beautician-written text (titles, descriptions, service names) is
// passed through as written; structured labels are translated for `en`.

const isEn = (locale: McpLocale) => locale === 'en'

export function cityLabel(city: string | null, locale: McpLocale): string | null {
  if (!city) return null
  return isEn(locale) ? cityNameEn(city) : normalizeCityName(city)
}

export function districtLabel(district: string | null, city: string | null, locale: McpLocale): string | null {
  if (!district) return null
  return isEn(locale) ? districtEn(district, city) : district
}

function tags(items: string[], locale: McpLocale, translate: (label: string) => string): string[] {
  return isEn(locale) ? items.map(translate) : items
}

export function categoryLabel(category: string | null, locale: McpLocale): string | null {
  if (!category) return null
  const option = CATEGORY_OPTIONS.find((item) => item.value === category)
  if (!option) return null
  const labels = (isEn(locale) ? enMessages : zhMessages).categories as Record<string, string>
  return labels[option.labelKey] ?? null
}

export function spaceSummary(space: PublicSpace, locale: McpLocale, source: string) {
  return {
    id: space.id,
    title: space.title,
    city: cityLabel(space.city, locale),
    district: districtLabel(space.district, space.city, locale),
    spaceType: space.spaceType,
    spaceTypeLabel: isEn(locale) ? spaceTypeEn(space.spaceType) : spaceTypeLabel(space.spaceType),
    currency: 'TWD',
    hourlyRate: space.hourlyRate,
    halfDayRate: space.halfDayRate,
    fullDayRate: space.fullDayRate,
    minimumHours: space.minimumHours,
    equipment: tags(space.equipment, locale, equipmentEn),
    recommendedServices: tags(space.recommendedServices, locale, serviceTagEn),
    ratingAvg: space.ratingCount > 0 ? Math.round(space.ratingAvg * 10) / 10 : null,
    ratingCount: space.ratingCount,
    coverPhotoUrl: space.coverPhotoUrl,
    links: spaceLinks(space.id, locale, source),
  }
}

export function spaceDetail(space: PublicSpace, locale: McpLocale, source: string) {
  return {
    ...spaceSummary(space, locale, source),
    description: truncate(space.description, 1500),
    isFullyPrivate: space.isFullyPrivate,
    maxCapacity: space.maxCapacity,
    prohibitedServices: tags(space.prohibitedServices, locale, serviceTagEn),
    camera: space.cameraDisclosureStatus
      ? {
          status: space.cameraDisclosureStatus,
          note: isEn(locale)
            ? cameraDisclosureEn(space.cameraDisclosureStatus)
            : cameraDisclosureLabel(space.cameraDisclosureStatus),
        }
      : null,
    photoUrls: space.photos.slice(0, 6).map((photo) => photo.url),
    has3dTour: Boolean(space.roomScanUrl),
    updatedAt: space.updatedAt,
    location: isEn(locale)
      ? 'City and district only; the street address is not provided here.'
      : '只提供縣市和行政區，這裡不提供詳細地址。',
  }
}

export function beauticianRef(beautician: PublicBeautician): string {
  return beautician.slug ?? beautician.id
}

function serviceArea(beautician: PublicBeautician, locale: McpLocale) {
  if (!beautician.serviceArea) return null
  const { city, district } = beautician.serviceArea
  return { city: cityLabel(city, locale), district: districtLabel(district, city, locale) }
}

export function beauticianSummary(beautician: PublicBeautician, locale: McpLocale, source: string) {
  const ref = beauticianRef(beautician)
  return {
    ref,
    displayName: beautician.displayName,
    specialties: tags(beautician.specialties, locale, serviceTagEn),
    serviceArea: serviceArea(beautician, locale),
    ratingAvg: beautician.ratingCount > 0 ? Math.round(beautician.ratingAvg * 10) / 10 : null,
    ratingCount: beautician.ratingCount,
    serviceCount: beautician.serviceCount,
    currency: 'TWD',
    lowestServicePrice: beautician.services[0]?.price ?? null,
    portfolioPreviewUrl: beautician.portfolioPreviewUrl,
    links: beauticianLinks(ref, beautician.id, source),
  }
}

export function beauticianDetail(beautician: PublicBeautician, complete: boolean, locale: McpLocale, source: string) {
  return {
    ...beauticianSummary(beautician, locale, source),
    bio: beautician.bio,
    licenses: beautician.licenses,
    yearsExperience: beautician.yearsExperience,
    services: beautician.services.map((service) => ({
      name: service.name,
      category: categoryLabel(service.category, locale),
      price: service.price,
      currency: 'TWD',
      durationMin: service.durationMin,
      description: service.description,
    })),
    servicesComplete: complete,
    portfolioImageUrls: beautician.portfolioUrls.slice(0, 6),
    socialLinks: beautician.socialLinks,
    updatedAt: beautician.updatedAt,
    booking: isEn(locale)
      ? 'Consumer booking of beauty services is not open yet on SoloBeauté. See the brand page for this beautician’s own social links.'
      : 'SoloBeauté 目前尚未開放消費者預約美業服務。可以到品牌頁看這位美業職人自己公開的社群連結。',
  }
}
