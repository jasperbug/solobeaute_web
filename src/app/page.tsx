import type { Metadata } from 'next'

import { LandingPage } from '@/components/landing/LandingPage'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'SoloBeauté — 台灣美業職人的獨立舞台',
  description:
    '搜尋美甲、美睫、美髮、美容職人，瀏覽品牌頁、作品集與服務內容，找到最適合你的美容服務。SoloBeauté 整合空間、服務與預約的美業平台。',
  openGraph: {
    title: 'SoloBeauté — 台灣美業職人的獨立舞台',
    description:
      '搜尋美甲、美睫、美髮、美容職人，瀏覽品牌頁、作品集與服務內容，找到最適合你的美容服務。',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'SoloBeauté',
      url: SITE_URL,
      logo: `${SITE_URL}/images/brand/logo.png`,
      description: '台灣首個整合空間、服務、預約的美業三方 Marketplace',
    },
    {
      '@type': 'WebSite',
      name: 'SoloBeauté',
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/search?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  )
}
