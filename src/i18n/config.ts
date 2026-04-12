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
