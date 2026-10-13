import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'

import { unprefixedPageUrls } from '@/lib/siteMetadata'
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate'

export const metadata: Metadata = {
  ...unprefixedPageUrls('/privacy'),
  title: '隱私政策',
  description: 'SoloBeauté 隱私政策與資料使用說明。',
}

export default function PrivacyPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  return <LegalPageTemplate type="privacy" />
}
