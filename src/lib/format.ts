import { APP_DEEP_LINK_SCHEME, SITE_URL } from './constants'
import type { BeauticianDetail, BeauticianSummary, PublicReview, ServiceArea, ShareEntityType, SpaceSummary } from './types'

export function getDisplayInitials(name: string) {
  const compactName = name.trim()

  if (!compactName) {
    return 'SB'
  }

  const latinParts = compactName.split(/\s+/).filter(Boolean)
  if (latinParts.length > 1) {
    return latinParts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
  }

  return Array.from(compactName).slice(0, 2).join('').toUpperCase()
}

export function formatCurrency(value: number | null | undefined, locale = 'zh-TW') {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompactRating(value: number, count: number) {
  if (!count) {
    return '尚無評價'
  }

  return `${value.toFixed(1)} (${count})`
}

export function formatExperience(yearsExperience: number | null | undefined) {
  if (!yearsExperience) {
    return null
  }

  return `${yearsExperience} 年經驗`
}

export function getServiceAreaLabel(serviceArea: ServiceArea) {
  if (!serviceArea) {
    return null
  }

  return serviceArea.district ? `${serviceArea.city}${serviceArea.district}` : serviceArea.city
}

export function getStartingPrice(profile: Pick<BeauticianSummary, 'services'>) {
  if (!profile.services?.length) {
    return null
  }

  return profile.services.reduce((min, service) => Math.min(min, service.price), profile.services[0].price)
}

export function buildShareUrl(type: ShareEntityType, id: string) {
  return `${SITE_URL}/share/${type}/${id}`
}

export function buildAppDeepLink(type: ShareEntityType, id: string) {
  return `${APP_DEEP_LINK_SCHEME}${type}/${id}`
}

export function resolveImageUrl(path: string | null | undefined) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `https://api.solobeaute.com${path}`
}

export function getBeauticianDiscoveryImage(
  beautician: Pick<BeauticianSummary, 'user' | 'portfolioPreviewUrl' | 'portfolioUrls' | 'announcementImageUrls'>
) {
  return resolveImageUrl(
    beautician.user?.avatarUrl ||
    beautician.portfolioPreviewUrl ||
    beautician.portfolioUrls?.[0] ||
    beautician.announcementImageUrls?.[0]
  )
}

export function getShareHeroImage(type: ShareEntityType, data: SpaceSummary | BeauticianDetail | null) {
  if (!data) return null

  if (type === 'space') {
    return resolveImageUrl((data as SpaceSummary).photos?.[0]?.url)
  }

  const beautician = data as BeauticianDetail
  return resolveImageUrl(
    beautician.portfolioUrls?.[0] ||
    beautician.user?.avatarUrl ||
    beautician.announcementImageUrls?.[0]
  )
}

export function buildBeauticianSummary(profile: BeauticianDetail | BeauticianSummary) {
  const experience = formatExperience(profile.yearsExperience)
  if (experience) {
    return experience
  }

  if (profile.specialties.length > 0) {
    return profile.specialties.slice(0, 3).join(' ・ ')
  }

  return '美容師品牌頁'
}

export function normalizeSocialUrl(type: string, value: string | undefined) {
  if (!value) {
    return null
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  switch (type) {
    case 'instagram':
      return `https://www.instagram.com/${value.replace(/^@/, '')}`
    case 'facebook':
      return `https://www.facebook.com/${value.replace(/^\//, '')}`
    case 'threads':
      return `https://www.threads.net/@${value.replace(/^@/, '')}`
    case 'website':
    default:
      return `https://${value.replace(/^https?:\/\//, '')}`
  }
}

export function sortSocialLinks(socialLinks: BeauticianDetail['socialLinks']): Array<{ key: string; href: string }> {
  const order = ['instagram', 'facebook', 'threads', 'website'] as const

  return order.flatMap((key) => {
    const href = normalizeSocialUrl(key, socialLinks?.[key])
    return href ? [{ key, href }] : []
  })
}

export function formatReviewDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function hasReviewImages(review: PublicReview) {
  return Array.isArray(review.imageUrls) && review.imageUrls.length > 0
}
