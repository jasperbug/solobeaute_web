import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'

import type { FaqItemData } from '@/components/landing/FaqSection'
import type { HomeStats } from '@/components/landing/HomeStatsLine'
import { LandingPage } from '@/components/landing/LandingPage'
import type { AppLocale } from '@/i18n/config'
import { dataDateLabel } from '@/lib/cityPages'
import {
  APP_STORE_URL,
  INSTAGRAM_URL,
  PLAY_STORE_URL,
  SERVICE_AREAS,
  SITE_URL,
  THREADS_URL,
} from '@/lib/constants'
import { cityNameEn, monthYearEn } from '@/lib/en'
import { fillFaqItems, getFaqFacts, type FaqFacts } from '@/lib/faqStats'
import { localeAlternates, localeUrl, ogLocale } from '@/lib/i18nSeo'
import { buildPriceReport } from '@/lib/priceReport'
import { fetchPublicSpaces } from '@/lib/spaces'

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

const ZH_METADATA: Metadata = {
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
    ...ogLocale('zh-TW'),
    url: SITE_URL,
    images: ['/og-image.png'],
  },
  alternates: localeAlternates('/', 'zh-TW'),
  twitter: {
    card: 'summary_large_image',
    title: HOME_SOCIAL_TITLE,
    description: HOME_SOCIAL_DESCRIPTION,
    images: ['/og-image.png'],
  },
}

// English homepage (/en). No fee / "free" / deposit claims; numbers are live.
const HOME_TITLE_EN = 'SoloBeauté | Beauty Workspaces for Hourly Rent in Taiwan'
const HOME_SOCIAL_TITLE_EN = 'SoloBeauté | Rent a beauty workspace by the hour, only when you have clients'
const HOME_DESCRIPTION_EN_FALLBACK =
  'SoloBeauté is a Taiwan-based app for renting ready-to-use beauty workspaces by the hour. Lash, facial, nail and brow pros browse spaces, message hosts and pay on site.'

function homeDescriptionEn(facts: FaqFacts | null): string {
  if (!facts) return HOME_DESCRIPTION_EN_FALLBACK
  return `Rent ready-to-use beauty workspaces by the hour in Taiwan: ${facts.spaceCount} spaces in ${facts.cityList}, ${facts.rateRange} per hour. For lash, facial, nail and brow pros; message hosts in the SoloBeauté app and pay on site.`
}

function brandDefinitionEn(facts: FaqFacts | null): string {
  const where = facts ? `, currently with ${facts.spaceCount} spaces in ${facts.cityList} (${facts.rateRange} per hour)` : ''
  return `SoloBeauté is a Taiwan-based app for renting ready-to-use beauty workspaces by the hour: beauty professionals book spaces that hosts have already set up${where}.`
}

async function englishFacts(): Promise<FaqFacts | null> {
  try {
    return await getFaqFacts(undefined, 'en')
  } catch {
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale
  if (locale !== 'en') return ZH_METADATA
  const description = homeDescriptionEn(await englishFacts())
  const url = localeUrl('/', 'en')
  return {
    title: { absolute: HOME_TITLE_EN },
    description,
    alternates: localeAlternates('/', 'en'),
    openGraph: {
      title: HOME_SOCIAL_TITLE_EN,
      description,
      siteName: 'SoloBeauté',
      type: 'website',
      ...ogLocale('en'),
      url,
      images: ['/og-image.png'],
    },
    twitter: { card: 'summary_large_image', title: HOME_SOCIAL_TITLE_EN, description, images: ['/og-image.png'] },
  }
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`

async function getHomeStats(locale: AppLocale): Promise<HomeStats | null> {
  try {
    const report = buildPriceReport(await fetchPublicSpaces())
    if (report.total === 0 || report.hourly.median === null) return null
    return {
      dateLabel: locale === 'en' ? monthYearEn() : dataDateLabel(),
      total: report.total,
      cityCount: report.cityCount,
      median: report.hourly.median,
      locale,
    }
  } catch (error) {
    console.error('[home] stats line unavailable:', error)
    return null
  }
}

export default async function HomePage() {
  const locale = (await getLocale()) as AppLocale
  const isEn = locale === 'en'
  const tFaq = await getTranslations('faq')
  // Built from the same messages FaqSection renders, so the JSON-LD always
  // matches the visible (server-rendered) FAQ text exactly.
  // {placeholders} are filled with live space data (count, cities, price range).
  const faqItems = fillFaqItems(tFaq.raw('items') as FaqItemData[], await getFaqFacts(undefined, locale))
  const facts = isEn ? await englishFacts() : null

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
        description: isEn ? brandDefinitionEn(facts) : BRAND_DEFINITION_SHORT,
        areaServed: isEn ? SERVICE_AREAS.map((area) => cityNameEn(area)) : [...SERVICE_AREAS],
        sameAs: [INSTAGRAM_URL, THREADS_URL, APP_STORE_URL, PLAY_STORE_URL],
        founder: [
          {
            '@type': 'Person',
            name: 'Jasper Tsai',
            jobTitle: isEn ? 'Engineer' : '工程師',
          },
          {
            '@type': 'Person',
            name: 'Meigo Liu',
            jobTitle: isEn ? 'Beauty professional' : '美容職人',
          },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'SoloBeauté',
        alternateName: ['Solobeaute', 'SoloBeaute'],
        url: SITE_URL,
        inLanguage: ['zh-TW', 'en'],
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
        '@id': `${localeUrl('/', locale)}#faq`,
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
      <LandingPage faqItems={faqItems} stats={await getHomeStats(locale)} />
    </>
  )
}
