import type { Metadata } from 'next'

import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate'

export const metadata: Metadata = {
  title: '服務條款',
  description: 'SoloBeauté 服務條款與平台使用規範。',
}

export default function TermsPage() {
  return <LegalPageTemplate type="terms" />
}
