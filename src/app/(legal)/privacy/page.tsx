import type { Metadata } from 'next'

import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate'

export const metadata: Metadata = {
  title: '隱私政策',
  description: 'SoloBeauté 隱私政策與資料使用說明。',
}

export default function PrivacyPage() {
  return <LegalPageTemplate type="privacy" />
}
