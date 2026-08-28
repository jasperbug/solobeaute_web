import type { Metadata } from 'next'

import { LandingPage } from '@/components/landing/LandingPage'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'SoloBeauté — 台灣美業職人的獨立舞台',
  description:
    '給獨立美業職人找空間，也讓屋主把閒置時段變成收入。SoloBeauté 以空間共享為核心，網站同步提供找職人導流入口。',
  // Next merges `openGraph` by REPLACING the whole object, not field by field —
  // so anything omitted here is dropped, not inherited from the root layout.
  // Keep siteName / type / url / images spelled out or the homepage ships
  // without a preview image (it is the most-shared URL on the site).
  openGraph: {
    title: 'SoloBeauté — 台灣美業職人的獨立舞台',
    description:
      '給獨立美業職人找空間，也讓屋主把閒置時段變成收入。SoloBeauté 以空間共享為核心，網站同步提供找職人導流入口。',
    siteName: 'SoloBeauté',
    type: 'website',
    url: SITE_URL,
    images: ['/og-image.png'],
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
      description: '給獨立美業職人找空間，也讓屋主把閒置時段變成收入的美業空間共享平台',
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
