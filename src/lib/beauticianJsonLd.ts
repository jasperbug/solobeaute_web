import type { AppLocale } from '@/i18n/config'
import { SITE_URL } from '@/lib/constants'
import { cityNameEn, districtEn } from '@/lib/en'
import { normalizeSocialUrl, resolveImageUrl, sortSocialLinks } from '@/lib/format'
import type { BeauticianDetail, BeauticianService } from '@/lib/types'

// Structured data for a beauty professional's brand page (/beautician/[slug]).
//
// Modelled as a ProfilePage whose main entity is a Person, not a BeautySalon:
// most beauty professionals on SoloBeauté work independently and rent spaces by
// the hour, so a LocalBusiness subtype would wrongly imply a storefront with a
// street address and opening hours. Services are listed as Offers (TWD) using
// only fields the public API already returns. There is deliberately NO
// potentialAction / ReserveAction: consumer booking is not open on SoloBeauté.

export type BeauticianJsonLdOptions = {
  locale: AppLocale
  /** Localised label for a service category enum value (NAIL, LASH, ...). */
  categoryLabel: (category: string) => string | null
  image?: string | null
}

const MAX_OFFER_DESCRIPTION_CHARS = 300

function canonicalBeauticianUrl(beautician: Pick<BeauticianDetail, 'slug' | 'id'>): string {
  // Must stay in sync with the canonical in beautician/[slug]/page.tsx.
  return `${SITE_URL}/beautician/${beautician.slug ?? beautician.id}`
}

function truncate(text: string, max: number): string {
  const chars = Array.from(text.replace(/\s+/g, ' ').trim())
  return chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : chars.join('')
}

function areaServed(beautician: BeauticianDetail, isEn: boolean) {
  const area = beautician.serviceArea
  if (!area?.city) return undefined
  const city = {
    '@type': 'AdministrativeArea',
    name: isEn ? cityNameEn(area.city) : area.city,
  }
  if (!area.district) return city
  return {
    '@type': 'AdministrativeArea',
    name: isEn ? districtEn(area.district, area.city) : area.district,
    containedInPlace: city,
  }
}

export function publicServices(beautician: Pick<BeauticianDetail, 'services'>): BeauticianService[] {
  return beautician.services.filter(
    (service) => service.isActive !== false && Number.isFinite(service.price) && service.price >= 0
  )
}

export function buildBeauticianJsonLd(beautician: BeauticianDetail, options: BeauticianJsonLdOptions) {
  const isEn = options.locale === 'en'
  const url = canonicalBeauticianUrl(beautician)
  const personId = `${url}#person`
  const served = areaServed(beautician, isEn)
  const sameAs = sortSocialLinks(beautician.socialLinks)
    .map((item) => normalizeSocialUrl(item.key, beautician.socialLinks[item.key as keyof typeof beautician.socialLinks]) ?? item.href)
    .filter((href): href is string => typeof href === 'string' && href.startsWith('https://'))
  const image = options.image ?? resolveImageUrl(beautician.user?.avatarUrl) ?? undefined

  const offers = publicServices(beautician).map((service) => {
    const category = options.categoryLabel(service.category)
    const duration = service.durationMin > 0
      ? (isEn ? `${service.durationMin} min` : `${service.durationMin} 分鐘`)
      : null
    const description = service.description ? truncate(service.description, MAX_OFFER_DESCRIPTION_CHARS) : null
    return {
      '@type': 'Offer',
      '@id': `${url}#offer-${service.id}`,
      name: service.name,
      price: service.price,
      priceCurrency: 'TWD',
      url,
      ...(duration ? { description: duration } : {}),
      itemOffered: {
        '@type': 'Service',
        name: service.name,
        ...(category ? { serviceType: category } : {}),
        ...(description ? { description } : {}),
        provider: { '@id': personId },
        ...(served ? { areaServed: served } : {}),
      },
    }
  })

  const person = {
    '@type': 'Person',
    '@id': personId,
    name: beautician.displayName,
    url,
    jobTitle: isEn ? 'Beauty professional' : '美業職人',
    ...(beautician.bio ? { description: truncate(beautician.bio, 500) } : {}),
    ...(image ? { image } : {}),
    ...(beautician.specialties.length > 0 ? { knowsAbout: beautician.specialties } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(offers.length > 0 ? { makesOffer: offers } : {}),
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${url}#page`,
    url,
    name: isEn
      ? `${beautician.displayName} | SoloBeauté brand page`
      : `${beautician.displayName}｜SoloBeauté 品牌頁`,
    inLanguage: isEn ? 'en' : 'zh-TW',
    ...(beautician.createdAt ? { dateCreated: beautician.createdAt } : {}),
    ...(beautician.updatedAt ? { dateModified: beautician.updatedAt } : {}),
    isPartOf: { '@type': 'WebSite', name: 'SoloBeauté', url: SITE_URL },
    mainEntity: person,
  }
}
