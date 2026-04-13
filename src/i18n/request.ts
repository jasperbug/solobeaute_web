import type { AbstractIntlMessages } from 'next-intl'
import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

import enMessages from './messages/en.json'
import zhTwMessages from './messages/zh-TW.json'
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  isSupportedLocale,
  resolveLocaleFromHeader,
} from './config'

const MESSAGES = {
  en: enMessages,
  'zh-TW': zhTwMessages,
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
    messages: MESSAGES[locale] as unknown as AbstractIntlMessages,
  }
})
