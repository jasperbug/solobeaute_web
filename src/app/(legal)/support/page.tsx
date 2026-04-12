import type { Metadata } from 'next'

import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate'

export const metadata: Metadata = {
  title: '客服支援',
  description: '聯絡 SoloBeauté 團隊，取得帳號、預約與隱私支援。',
}

export default function SupportPage() {
  return <LegalPageTemplate type="support" />
}
