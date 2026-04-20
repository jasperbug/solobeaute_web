'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { CATEGORY_OPTIONS, CITY_OPTIONS } from '@/lib/constants'
import type { BeauticianSearchParams } from '@/lib/types'
import { SearchIcon } from '../ui/Icons'

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
    <div className="search-filters">
      <div className="search-filters__controls">
        <label className="search-filters__field search-filters__field--search">
          <SearchIcon className="search-filters__icon" />
          <input
            className="search-filters__input"
            placeholder={t('keywordPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label={t('keywordPlaceholder')}
          />
        </label>

        <select
          className="search-filters__field search-filters__select"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          aria-label={t('allCities')}
        >
          <option value="">{t('allCities')}</option>
          {CITY_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <input
          className="search-filters__field search-filters__input"
          placeholder={t('districtPlaceholder')}
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
          aria-label={t('districtPlaceholder')}
        />

        <select
          className="search-filters__field search-filters__select"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label={t('allCategories')}
        >
          <option value="">{t('allCategories')}</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{t(`categoryLabels.${option.labelKey}`)}</option>
          ))}
        </select>

        <select
          className="search-filters__field search-filters__select"
          value={sortBy}
          onChange={(event) => setSortBy(normalizeSortBy(event.target.value))}
          aria-label={t('sortLabel')}
        >
          <option value="newest">{t('sort.newest')}</option>
          <option value="priceAsc">{t('sort.priceAsc')}</option>
          <option value="priceDesc">{t('sort.priceDesc')}</option>
        </select>

        <button
          type="button"
          className={`search-filters__field search-filters__toggle ${verified ? 'search-filters__toggle--active' : ''}`}
          onClick={() => setVerified((value) => !value)}
          aria-pressed={verified}
        >
          {t('verifiedOnly')}
        </button>
      </div>

      <div className="search-filters__actions">
        <button
          type="button"
          onClick={applyFilters}
          className="search-filters__submit"
        >
          {t('apply')}
        </button>
      </div>
    </div>
  )
}
