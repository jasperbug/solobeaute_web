import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  isSupportedLocale,
  resolveLocaleFromHeader,
} from './config'

const MESSAGES = {
  en: require('./messages/en.json'),
  'zh-TW': require('./messages/zh-TW.json'),
} as const

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value
  const locale = isSupportedLocale(cookieLocale)
    ? cookieLocale
    : resolveLocaleFromHeader(headerStore.get('accept-language')) ?? DEFAULT_LOCALE

  return {
    locale,
    messages: MESSAGES[locale],
  }
})
