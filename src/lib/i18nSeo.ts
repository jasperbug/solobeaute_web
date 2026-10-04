import type { Metadata } from 'next'

import { EN_PREFIX, type AppLocale } from '@/i18n/config'

import { SITE_URL } from './constants'

// hreflang / canonical helpers for pages that exist in both languages.
// zh-TW is the default (unprefixed URL, also x-default); English is /en{path}.

/** Absolute URL of `path` (unprefixed, e.g. "/faq") in `locale`. */
export function localeUrl(path: string, locale: AppLocale): string {
  const suffix = path === '/' ? '' : path
  return locale === 'en' ? `${SITE_URL}${EN_PREFIX}${suffix}` : `${SITE_URL}${suffix}`
}

/** canonical = this language's URL; alternates for zh-TW, en and x-default. */
export function localeAlternates(path: string, locale: AppLocale): NonNullable<Metadata['alternates']> {
  return {
    canonical: localeUrl(path, locale),
    languages: {
      'zh-TW': localeUrl(path, 'zh-TW'),
      en: localeUrl(path, 'en'),
      'x-default': localeUrl(path, 'zh-TW'),
    },
  }
}

export function ogLocale(locale: AppLocale): { locale: string; alternateLocale: string[] } {
  return locale === 'en'
    ? { locale: 'en_US', alternateLocale: ['zh_TW'] }
    : { locale: 'zh_TW', alternateLocale: ['en_US'] }
}

/** Sitemap `alternates.languages` for a localized path. */
export function sitemapAlternates(path: string) {
  return {
    languages: {
      'zh-TW': localeUrl(path, 'zh-TW'),
      en: localeUrl(path, 'en'),
      'x-default': localeUrl(path, 'zh-TW'),
    },
  }
}
