import type { Metadata } from 'next'

import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate'

export const metadata: Metadata = {
  title: {
    absolute: '刪除 SoloBeaute 帳號',
  },
  description: '刪除 SoloBeaute 帳號、提出網頁刪除申請，以及瞭解資料刪除與保留方式。',
  alternates: {
    canonical: '/delete-account',
  },
}

export default function DeleteAccountPage() {
  return <LegalPageTemplate type="deleteAccount" />
}
