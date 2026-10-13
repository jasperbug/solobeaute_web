import type { AbstractIntlMessages } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import enMessages from './messages/en.json'
import zhTwMessages from './messages/zh-TW.json'
import { DEFAULT_LOCALE, isSupportedLocale } from './config'

const MESSAGES = {
  en: enMessages,
  'zh-TW': zhTwMessages,
} as const

// The locale is the [locale] route segment (src/app/[locale]); src/middleware.ts
// picks it from the URL (/en/…), or for routes without an English version from
// the locale cookie / Accept-Language, and rewrites to /{locale}/…. Pages call
// setRequestLocale(params.locale), so nothing here reads cookies or headers and
// pages stay statically renderable.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = isSupportedLocale(requested) ? requested : DEFAULT_LOCALE

  return {
    locale,
    messages: MESSAGES[locale] as unknown as AbstractIntlMessages,
  }
})
