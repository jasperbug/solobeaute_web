import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'

import type { FaqItemData } from '@/components/landing/FaqSection'
import { LandingPage } from '@/components/landing/LandingPage'
import {
  APP_STORE_URL,
  INSTAGRAM_URL,
  PLAY_STORE_URL,
  SERVICE_AREAS,
  SITE_URL,
  THREADS_URL,
} from '@/lib/constants'

// Homepage copy follows seo_copy_v1.md §1 (zh-TW only; Chinese-only SEO).
// This title lives in the same segment as the root layout, so the layout's
// `%s | SoloBeauté` template does NOT apply — the brand is written in full.
const HOME_TITLE = '美業空間時租・美容工作室按小時租｜SoloBeauté'
const HOME_DESCRIPTION =
  '美甲、美睫、美容職人按小時租現成工作空間，時租 NT$100–350，台北、新北、桃園、台中、高雄、彰化、南投都有。免簽約、免押金、免裝潢，現場付現。'
const HOME_SOCIAL_TITLE = 'SoloBeauté｜美業空間按小時租，有客人再開工'
const HOME_SOCIAL_DESCRIPTION =
  '打開 App 看空間、看價錢、看 3D 實景，直接跟屋主約時間。時租 NT$100–350，免押金、免長約，台北到高雄 7 縣市都有。'
const BRAND_DEFINITION_SHORT =
  'SoloBeauté 是台灣的美業空間時租 App，美業職人可以按小時租用屋主已經備好的工作空間（NT$100–350／小時），免簽約、免押金，目前在台北、新北、桃園、台中、高雄、彰化、南投。'

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  // Next merges `openGraph` / `twitter` by REPLACING the whole object, not
  // field by field — so anything omitted here is dropped, not inherited from
  // the root layout. Keep siteName / type / url / images spelled out or the
  // homepage ships without a preview image (it is the most-shared URL).
  openGraph: {
    title: HOME_SOCIAL_TITLE,
    description: HOME_SOCIAL_DESCRIPTION,
    siteName: 'SoloBeauté',
    type: 'website',
    locale: 'zh_TW',
    url: SITE_URL,
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_SOCIAL_TITLE,
    description: HOME_SOCIAL_DESCRIPTION,
    images: ['/og-image.png'],
  },
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`

export default async function HomePage() {
  const locale = await getLocale()
  const tFaq = await getTranslations('faq')
  // Built from the same messages FaqSection renders, so the JSON-LD always
  // matches the visible (server-rendered) FAQ text exactly.
  const faqItems = tFaq.raw('items') as FaqItemData[]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: 'SoloBeauté',
        alternateName: ['Solobeaute', 'SoloBeaute'],
        url: SITE_URL,
        logo: `${SITE_URL}/images/brand/logo.png`,
        description: BRAND_DEFINITION_SHORT,
        areaServed: [...SERVICE_AREAS],
        sameAs: [INSTAGRAM_URL, THREADS_URL, APP_STORE_URL, PLAY_STORE_URL],
        founder: [
          {
            '@type': 'Person',
            name: 'Jasper Tsai',
            jobTitle: '工程師',
          },
          {
            '@type': 'Person',
            name: 'Meigo Liu',
            jobTitle: '美容職人',
          },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'SoloBeauté',
        alternateName: ['Solobeaute', 'SoloBeaute'],
        url: SITE_URL,
        inLanguage: 'zh-TW',
        publisher: { '@id': ORGANIZATION_ID },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/search?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'MobileApplication',
        '@id': `${SITE_URL}/#app`,
        name: 'SoloBeauté',
        alternateName: ['Solobeaute', 'SoloBeaute'],
        operatingSystem: 'iOS, Android',
        applicationCategory: 'BusinessApplication',
        installUrl: [APP_STORE_URL, PLAY_STORE_URL],
        publisher: { '@id': ORGANIZATION_ID },
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/#faq`,
        inLanguage: locale,
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <LandingPage />
    </>
  )
}
