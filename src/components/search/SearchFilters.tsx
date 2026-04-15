'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { CATEGORY_OPTIONS, CITY_OPTIONS } from '@/lib/constants'
import type { BeauticianSearchParams } from '@/lib/types'

type SearchFiltersProps = {
  initialValues: BeauticianSearchParams
}

const ALLOWED_SORTS = ['newest', 'priceAsc', 'priceDesc'] as const
type SearchSort = (typeof ALLOWED_SORTS)[number]

function normalizeSortBy(value: string | undefined): SearchSort {
  return ALLOWED_SORTS.includes(value as SearchSort) ? (value as SearchSort) : 'newest'
}

export function SearchFilters({ initialValues }: SearchFiltersProps) {
  const t = useTranslations('search')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [city, setCity] = useState(initialValues.city ?? '')
  const [district, setDistrict] = useState(initialValues.district ?? '')
  const [category, setCategory] = useState(initialValues.category ?? '')
  const [search, setSearch] = useState(initialValues.search ?? '')
  const [sortBy, setSortBy] = useState<SearchSort>(normalizeSortBy(initialValues.sortBy))
  const [verified, setVerified] = useState(Boolean(initialValues.verified))

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString())

    const nextValues: Record<string, string> = {
      city,
      district,
      category,
      search,
      sortBy,
      verified: verified ? 'true' : '',
    }

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="sb-card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-7">
      <select className="rounded-lg border border-black/10 px-3 py-3 text-sm" value={city} onChange={(event) => setCity(event.target.value)}>
        <option value="">{t('allCities')}</option>
        {CITY_OPTIONS.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>

      <input
        className="rounded-lg border border-black/10 px-3 py-3 text-sm"
        placeholder={t('districtPlaceholder')}
        value={district}
        onChange={(event) => setDistrict(event.target.value)}
      />

      <select className="rounded-lg border border-black/10 px-3 py-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
        <option value="">{t('allCategories')}</option>
        {CATEGORY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{t(`categoryLabels.${option.labelKey}`)}</option>
        ))}
      </select>

      <input
        className="rounded-lg border border-black/10 px-3 py-3 text-sm"
        placeholder={t('keywordPlaceholder')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <select className="rounded-lg border border-black/10 px-3 py-3 text-sm" value={sortBy} onChange={(event) => setSortBy(normalizeSortBy(event.target.value))}>
        <option value="newest">{t('sort.newest')}</option>
        <option value="priceAsc">{t('sort.priceAsc')}</option>
        <option value="priceDesc">{t('sort.priceDesc')}</option>
      </select>

      <button
        type="button"
        className={`rounded-lg border px-4 py-3 text-sm font-medium ${verified ? 'border-brand bg-brand/10 text-brand' : 'border-black/10 text-black/55'}`}
        onClick={() => setVerified((value) => !value)}
      >
        {t('verifiedOnly')}
      </button>

      <button
        type="button"
        onClick={applyFilters}
        className="rounded-lg bg-brand px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-light xl:col-span-7"
      >
        {t('apply')}
      </button>
    </div>
  )
}
