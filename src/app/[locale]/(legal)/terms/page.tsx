import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'

import { SITE_OPEN_GRAPH } from '@/lib/siteMetadata'
import { localeAlternates, localeUrl, ogLocale } from '@/lib/i18nSeo'
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate'

const PAGE_PATH = '/terms'

// /terms has an English version at /en/terms (see ENGLISH_ROUTES in src/i18n/config.ts).
export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const isEn = params.locale === 'en'
  return {
    title: isEn ? 'Terms of Service' : '服務條款',
    description: isEn ? 'SoloBeauté terms of service and rules of use.' : 'SoloBeauté 服務條款與使用規範。',
    alternates: localeAlternates(PAGE_PATH, isEn ? 'en' : 'zh-TW'),
    openGraph: { ...SITE_OPEN_GRAPH, ...ogLocale(isEn ? 'en' : 'zh-TW'), url: localeUrl(PAGE_PATH, isEn ? 'en' : 'zh-TW') },
  }
}

export default function TermsPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  return <LegalPageTemplate type="terms" />
}
