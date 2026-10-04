export const LOCALE_COOKIE_NAME = 'locale'

export const SUPPORTED_LOCALES = ['zh-TW', 'en'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'zh-TW'

export const LANGUAGE_OPTIONS: Array<{ label: string; short: string; value: AppLocale }> = [
  { label: '繁體中文', short: '繁中', value: 'zh-TW' },
  { label: 'English', short: 'EN', value: 'en' },
]

export function isSupportedLocale(value: string | null | undefined): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale)
}

export function resolveLocaleFromHeader(headerValue: string | null | undefined): AppLocale {
  if (!headerValue) {
    return DEFAULT_LOCALE
  }

  const normalized = headerValue.toLowerCase()

  if (normalized.includes('zh')) {
    return 'zh-TW'
  }

  if (normalized.includes('en')) {
    return 'en'
  }

  return DEFAULT_LOCALE
}

// ---------------------------------------------------------------------------
// Locale-prefixed URLs for the SEO pages.
//
// zh-TW (default) lives at the unprefixed URL (/faq); English lives under /en
// (/en/faq). src/middleware.ts rewrites /en/* to the same route and passes the
// locale in LOCALE_HEADER, so one page file renders both languages and each
// language has its own crawlable URL (needed for hreflang). Pages that have no
// English version yet keep the old cookie / Accept-Language behaviour.
// ---------------------------------------------------------------------------

/** Request header set by the middleware; wins over the cookie. */
export const LOCALE_HEADER = 'x-sb-locale'

export const EN_PREFIX = '/en'

/** Routes that have a full English version at /en{path}. */
const ENGLISH_ROUTES: RegExp[] = [
  /^\/$/,
  /^\/spaces$/,
  /^\/spaces\/price-report$/,
  /^\/spaces\/city\/[a-z-]+$/,
  /^\/spaces\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  /^\/faq$/,
  /^\/about$/,
  /^\/hosts$/,
  /^\/guides\/lash-artist-studio$/,
  /^\/guides\/hourly-vs-monthly-rent$/,
]

/** True when `path` (unprefixed, no query/hash) has an English version. */
export function hasEnglishVersion(path: string): boolean {
  return ENGLISH_ROUTES.some((re) => re.test(path))
}

/** `/en/faq` → `{ locale: 'en', path: '/faq' }`; `/faq` → `{ locale: null, path: '/faq' }`. */
export function stripLocalePrefix(pathname: string): { locale: AppLocale | null; path: string } {
  if (pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`)) {
    return { locale: 'en', path: pathname.slice(EN_PREFIX.length) || '/' }
  }
  return { locale: null, path: pathname || '/' }
}

/**
 * Internal href for `locale`. zh-TW hrefs are returned unchanged; for English,
 * routes that have an English version get the /en prefix (query and hash are
 * kept). External links, bare anchors and routes without English stay as-is.
 */
export function localizePath(href: string, locale: AppLocale): string {
  if (locale !== 'en' || !href.startsWith('/') || href.startsWith('//')) return href
  const match = /^([^?#]*)(.*)$/.exec(href)
  const path = match?.[1] || '/'
  const rest = match?.[2] ?? ''
  if (stripLocalePrefix(path).locale === 'en') return href
  if (!hasEnglishVersion(path)) return href
  return `${EN_PREFIX}${path === '/' ? '' : path}${rest}`
}
