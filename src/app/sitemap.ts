import type { MetadataRoute } from 'next'

import { cityPagePath } from '@/lib/cities'
import { buildAllCityStats, isCityIndexable } from '@/lib/cityPages'
import { API_BASE_URL, SITE_URL } from '@/lib/constants'
import { fetchPublicSpaces } from '@/lib/spaces'
import type { BeauticianSearchResponse, BeauticianSummary } from '@/lib/types'

const API_PAGE_LIMIT = 50
const MAX_PAGES = 20 // safety cap → up to 1000 beauticians

async function fetchBeauticianPage(page: number): Promise<BeauticianSearchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/beauticians?limit=${API_PAGE_LIMIT}&page=${page}`,
    { next: { revalidate: 86400 } }
  )

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(
      `sitemap: beautician list fetch failed (status=${response.status}) page=${page} body=${body.slice(0, 200)}`
    )
  }

  return (await response.json()) as BeauticianSearchResponse
}

async function fetchAllBeauticians(): Promise<BeauticianSummary[]> {
  const first = await fetchBeauticianPage(1)
  const results: BeauticianSummary[] = [...first.data]

  const totalPages = Math.min(first.pagination?.totalPages ?? 1, MAX_PAGES)

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchBeauticianPage(page)
    results.push(...next.data)
  }

  return results
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/spaces`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/spaces/price-report`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/guides/lash-artist-studio`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/guides/hourly-vs-monthly-rent`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/hosts`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/en`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/search`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/support`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/delete-account`, changeFrequency: 'yearly', priority: 0.5 },
  ]

  let beauticianPages: MetadataRoute.Sitemap = []

  try {
    const beauticians = await fetchAllBeauticians()
    // Every record here is already web-published: the public list endpoint
    // applies buildPublicBeauticianWhere() (isWebVisible: true,
    // webVisibilitySuppressedAt: null), so nothing un-consented can reach this
    // list. `slug` is a separate, self-service field most profiles never set —
    // filtering on it silently dropped ~2/3 of eligible pages, so fall back to
    // the id. Must stay in sync with the canonical in beautician/[slug]/page.tsx.
    const withSlug = beauticians.filter((b) => b.slug).length
    beauticianPages = beauticians.map((b) => ({
      url: `${SITE_URL}/beautician/${b.slug ?? b.id}`,
      lastModified: b.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: b.slug ? 0.7 : 0.6,
    }))
    console.log(
      `[sitemap] emitted ${beauticianPages.length} beautician entries (${withSlug} by slug, ${beauticianPages.length - withSlug} by id)`
    )
  } catch (error) {
    // Do NOT silently swallow — log to build/runtime logs so the missing entries are discoverable.
    // We still return the static pages to avoid breaking the overall sitemap response.
    console.error('[sitemap] failed to build dynamic beautician entries:', error)
  }

  let spacePages: MetadataRoute.Sitemap = []
  let cityPages: MetadataRoute.Sitemap = []

  try {
    // fetchPublicSpaces() keeps only status === 'ACTIVE' (and not deleted), the
    // same rule /spaces/[id] uses to decide between 200 and 404.
    const spaces = await fetchPublicSpaces()
    spacePages = spaces.map((space) => ({
      url: `${SITE_URL}/spaces/${space.id}`,
      ...(space.updatedAt ? { lastModified: space.updatedAt } : {}),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
    console.log(`[sitemap] emitted ${spacePages.length} space entries`)
    // City landing pages: only the ones that are indexable (≥ 1 ACTIVE space).
    cityPages = buildAllCityStats(spaces)
      .filter(isCityIndexable)
      .map((stats) => ({
        url: `${SITE_URL}${cityPagePath(stats.city)}`,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      }))
    console.log(`[sitemap] emitted ${cityPages.length} city entries`)
  } catch (error) {
    console.error('[sitemap] failed to build dynamic space entries:', error)
  }

  return [...staticPages, ...cityPages, ...spacePages, ...beauticianPages]
}
