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

function pickFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function normalizeSortBy(value: string | undefined) {
  return value && ALLOWED_SORTS.has(value) ? value : 'newest'
}

function parsePositiveInt(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(pickFirst(value) ?? '')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseSearchParams(searchParams: SearchPageProps['searchParams']): BeauticianSearchParams {
  return {
    page: parsePositiveInt(searchParams.page, 1),
    limit: parsePositiveInt(searchParams.limit, 20),
    category: pickFirst(searchParams.category),
    city: pickFirst(searchParams.city),
    district: pickFirst(searchParams.district),
    minPrice: pickFirst(searchParams.minPrice) ? Number(pickFirst(searchParams.minPrice)) : undefined,
    maxPrice: pickFirst(searchParams.maxPrice) ? Number(pickFirst(searchParams.maxPrice)) : undefined,
    verified: pickFirst(searchParams.verified) === 'true',
    search: pickFirst(searchParams.search),
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
  const headingBits = [params.city, params.district, localizedCategory, response.pagination.total ? `${response.pagination.total} ${t('search.resultsUnit')}` : null].filter(Boolean)

  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <div className="container space-y-8">
        <div className="space-y-3">
          <p className="section-tag">{t('search.sectionTag')}</p>
          <h1 className="text-balance text-3xl font-semibold text-ink md:text-4xl">
            {headingBits.length > 0 ? headingBits.join(' · ') : t('search.pageTitle')}
          </h1>
          <p className="text-sm leading-7 text-black/60">{t('search.pageSubtitle')}</p>
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
          <div className="grid gap-5 lg:grid-cols-2">
            {response.data.map((beautician) => (
              <BeauticianCard key={beautician.id} beautician={beautician} />
            ))}
          </div>
        )}

        {response.data.length > 0 && response.pagination.totalPages > 1 ? (
          <div className="flex justify-center">
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
