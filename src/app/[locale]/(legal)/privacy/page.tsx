import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'

import { SITE_OPEN_GRAPH } from '@/lib/siteMetadata'
import { localeAlternates, localeUrl, ogLocale } from '@/lib/i18nSeo'
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate'

const PAGE_PATH = '/privacy'

// /privacy has an English version at /en/privacy (see ENGLISH_ROUTES in src/i18n/config.ts).
export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const isEn = params.locale === 'en'
  return {
    title: isEn ? 'Privacy Policy' : '隱私政策',
    description: isEn ? 'How SoloBeauté collects, uses, shares and protects personal information.' : 'SoloBeauté 隱私政策與資料使用說明。',
    alternates: localeAlternates(PAGE_PATH, isEn ? 'en' : 'zh-TW'),
    openGraph: { ...SITE_OPEN_GRAPH, ...ogLocale(isEn ? 'en' : 'zh-TW'), url: localeUrl(PAGE_PATH, isEn ? 'en' : 'zh-TW') },
  }
}

export default function PrivacyPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  return <LegalPageTemplate type="privacy" />
}
