import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'

import { unprefixedPageUrls } from '@/lib/siteMetadata'
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate'

export const metadata: Metadata = {
  ...unprefixedPageUrls('/terms'),
  title: '服務條款',
  description: 'SoloBeauté 服務條款與使用規範。',
}

export default function TermsPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  return <LegalPageTemplate type="terms" />
}
