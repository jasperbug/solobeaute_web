import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'

import { unprefixedPageUrls } from '@/lib/siteMetadata'
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate'

export const metadata: Metadata = {
  ...unprefixedPageUrls('/support'),
  title: '客服支援',
  description: '聯絡 SoloBeauté 團隊，取得帳號、預約與隱私支援。',
}

export default function SupportPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  return <LegalPageTemplate type="support" />
}
