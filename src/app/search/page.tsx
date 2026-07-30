import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

import { BeauticianCard } from '@/components/beautician/BeauticianCard'
import { SearchFilters } from '@/components/search/SearchFilters'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { fetchBeauticians } from '@/lib/api'
import { CATEGORY_OPTIONS } from '@/lib/constants'
import type { BeauticianSearchParams } from '@/lib/types'

type SearchPageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

const ALLOWED_SORTS = new Set(['newest', 'priceAsc', 'priceDesc'])
const MAX_PAGE = 10_000
const MAX_LIMIT = 100
const MAX_FILTER_LENGTH = 100

function pickFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function normalizeSortBy(value: string | undefined) {
  return value && ALLOWED_SORTS.has(value) ? value : 'newest'
}

function parsePositiveInt(value: string | string[] | undefined, fallback: number, max: number) {
  const parsed = Number(pickFirst(value) ?? '')
  return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback
}

function parseOptionalNumber(value: string | string[] | undefined) {
  const parsed = Number(pickFirst(value) ?? '')
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

function boundedText(value: string | string[] | undefined) {
  return pickFirst(value)?.slice(0, MAX_FILTER_LENGTH)
}

function parseSearchParams(searchParams: SearchPageProps['searchParams']): BeauticianSearchParams {
  return {
    page: parsePositiveInt(searchParams.page, 1, MAX_PAGE),
    limit: parsePositiveInt(searchParams.limit, 20, MAX_LIMIT),
    category: boundedText(searchParams.category),
    city: boundedText(searchParams.city),
    district: boundedText(searchParams.district),
    minPrice: parseOptionalNumber(searchParams.minPrice),
    maxPrice: parseOptionalNumber(searchParams.maxPrice),
    verified: pickFirst(searchParams.verified) === 'true',
    search: boundedText(searchParams.search),
    sortBy: normalizeSortBy(pickFirst(searchParams.sortBy)),
  }
}

function categoryLabel(category: string | undefined) {
  if (!category) return null
  return CATEGORY_OPTIONS.find((item) => item.value === category)?.labelKey ?? category
}

function buildPageHref(params: BeauticianSearchParams, targetPage: number) {
  const nextParams = new URLSearchParams()
  const nextFilters = {
    limit: params.limit,
    category: params.category,
    specialty: params.specialty,
    city: params.city,
    district: params.district,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    minRating: params.minRating,
    verified: params.verified ? 'true' : undefined,
    search: params.search,
    sortBy: params.sortBy,
  }

  Object.entries(nextFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      nextParams.set(key, String(value))
    }
  })

  if (targetPage > 1) {
    nextParams.set('page', String(targetPage))
  }

  const query = nextParams.toString()
  return query ? `/search?${query}` : '/search'
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const t = await getTranslations()
  const params = parseSearchParams(searchParams)
  const categoryKey = categoryLabel(params.category)
  const localizedCategory = categoryKey && categoryKey !== params.category
    ? t(`search.categoryLabels.${categoryKey}`)
    : params.category
  const pieces = [params.district, params.city, localizedCategory].filter(Boolean)
  const title = pieces.length > 0
    ? `${pieces.join(' ')} ${t('search.metaTitleSuffix')}`
    : t('search.pageTitle')

  return {
    title,
    description: t('search.metaDescription'),
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const t = await getTranslations()
  const params = parseSearchParams(searchParams)
  const response = await fetchBeauticians(params)
  const currentPage = params.page ?? 1

  if (response.pagination.total > 0 && currentPage > response.pagination.totalPages) {
    redirect(buildPageHref(params, response.pagination.totalPages))
  }

  const categoryKey = categoryLabel(params.category)
  const localizedCategory = categoryKey && categoryKey !== params.category
    ? t(`search.categoryLabels.${categoryKey}`)
    : params.category
  const headingPrefix = [params.city, params.district].filter(Boolean).join(' · ')
  const pageHeading = headingPrefix
    ? t('search.locationTitle', { location: headingPrefix })
    : t('search.pageTitle')
  const resultSummary = [localizedCategory, response.pagination.total ? `${response.pagination.total} ${t('search.resultsUnit')}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <main className="search-directory">
      <div className="container">
        <div className="search-directory__hero">
          <div className="search-directory__copy">
            <p className="section-tag">{t('search.sectionTag')}</p>
            <h1 className="search-directory__title">{pageHeading}</h1>
            <p className="search-directory__subtitle">{t('search.pageSubtitle')}</p>
            {resultSummary ? (
              <p className="search-directory__summary">{resultSummary}</p>
            ) : null}
          </div>

          <div className="search-directory__notice">
            <div>
              <p className="search-directory__notice-title">{t('search.directoryTitle')}</p>
              <p className="search-directory__notice-body">{t('search.directoryBody')}</p>
            </div>
            <p className="search-directory__notice-tag">{t('search.directoryTagline')}</p>
          </div>
        </div>

        <SearchFilters initialValues={params} />

        {response.data.length === 0 ? (
          <EmptyState
            title={t('search.emptyTitle')}
            description={t('search.emptyDescription')}
            href="/"
            ctaLabel={t('search.emptyCta')}
          />
        ) : (
          <div className="search-directory__results">
            {response.data.map((beautician) => (
              <BeauticianCard key={beautician.id} beautician={beautician} />
            ))}
          </div>
        )}

        {response.data.length > 0 && response.pagination.totalPages > 1 ? (
          <div className="search-directory__pagination">
            <Pagination
              currentPage={response.pagination.page}
              totalPages={response.pagination.totalPages}
              buildHref={(page) => buildPageHref(params, page)}
              previousLabel={t('search.previousPage')}
              nextLabel={t('search.nextPage')}
              ariaLabel={t('search.paginationLabel')}
            />
          </div>
        ) : null}
      </div>
    </main>
  )
}
