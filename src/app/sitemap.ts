import type { MetadataRoute } from 'next'

import { API_BASE_URL, SITE_URL } from '@/lib/constants'
import type { BeauticianSearchResponse } from '@/lib/types'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/search`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/support`, changeFrequency: 'monthly', priority: 0.4 },
  ]

  let beauticianPages: MetadataRoute.Sitemap = []

  try {
    const response = await fetch(`${API_BASE_URL}/beauticians?limit=500`, {
      next: { revalidate: 86400 },
    })

    if (response.ok) {
      const payload = (await response.json()) as BeauticianSearchResponse
      beauticianPages = payload.data
        .filter((b) => b.slug)
        .map((b) => ({
          url: `${SITE_URL}/beautician/${b.slug}`,
          lastModified: b.updatedAt,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
    }
  } catch {
    // Sitemap generation should not fail the build
  }

  return [...staticPages, ...beauticianPages]
}
