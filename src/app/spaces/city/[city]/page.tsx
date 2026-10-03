import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/spaces/JsonLd'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { SPACE_CITIES } from '@/lib/cities'
import {
  buildAllCityStats,
  buildCityDescription,
  buildCityFaq,
  buildCityH1,
  buildCityIntro,
  buildCityOgTitle,
  buildCityTitle,
  cityPagePath,
  dataDateLabel,
  getCityBySlug,
  isCityIndexable,
  type CityStats,
} from '@/lib/cityPages'
import { SITE_URL } from '@/lib/constants'
import { fetchPublicSpaces, formatNtd } from '@/lib/spaces'

// Same window as every space fetch in lib/spaces.ts.
export const revalidate = 3600
// Only the seven known city slugs exist; anything else is a 404.
export const dynamicParams = false

type CityPageProps = {
  params: { city: string }
}

export function generateStaticParams() {
  return SPACE_CITIES.map((city) => ({ city: city.slug }))
}

async function loadCity(slug: string): Promise<{ stats: CityStats; allStats: CityStats[] } | null> {
  const city = getCityBySlug(slug)
  if (!city) return null
  const allStats = buildAllCityStats(await fetchPublicSpaces())
  const stats = allStats.find((item) => item.city.slug === city.slug)
  return stats ? { stats, allStats } : null
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const loaded = await loadCity(params.city)
  if (!loaded) {
    return { title: '找不到這個縣市', robots: { index: false, follow: true } }
  }

  const { stats } = loaded
  const title = buildCityTitle(stats)
  const description = buildCityDescription(stats)
  const ogTitle = buildCityOgTitle(stats.city)
  const url = `${SITE_URL}${cityPagePath(stats.city)}`

  return {
    title,
    description,
    alternates: { canonical: url },
    // Cities with no ACTIVE space stay reachable but are kept out of the index.
    ...(isCityIndexable(stats) ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title: ogTitle,
      description,
      siteName: 'SoloBeauté',
      type: 'website',
      locale: 'zh_TW',
      url,
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: ['/og-image.png'],
    },
  }
}

export default async function CitySpacesPage({ params }: CityPageProps) {
  const loaded = await loadCity(params.city)
  if (!loaded) {
    notFound()
  }

  const { stats, allStats } = loaded
  const { city, spaces } = stats
  const dateLabel = dataDateLabel()
  const url = `${SITE_URL}${cityPagePath(city)}`
  const h1 = buildCityH1(city)
  const intro = buildCityIntro(stats, allStats, dateLabel)
  const faq = buildCityFaq(stats, allStats, dateLabel)
  const otherCities = allStats.filter((item) => item.city.slug !== city.slug)

  const facts = [
    { label: '空間數', value: `${stats.count} 個` },
    stats.minRate !== null && stats.maxRate !== null
      ? {
          label: '時租',
          value: stats.minRate === stats.maxRate ? formatNtd(stats.minRate) : `${formatNtd(stats.minRate)}–${stats.maxRate}`,
        }
      : null,
    stats.count >= 2 && stats.medianRate !== null ? { label: '時租中位數', value: formatNtd(stats.medianRate) } : null,
    stats.districts.length ? { label: '地區', value: stats.districts.map((d) => d.label).join('、') } : null,
  ].filter((item): item is { label: string; value: string } => item !== null)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        name: h1,
        url,
        inLanguage: 'zh-TW',
        description: buildCityDescription(stats),
        isPartOf: { '@type': 'WebSite', name: 'SoloBeauté', url: SITE_URL },
        about: { '@type': 'AdministrativeArea', name: city.name, containedInPlace: { '@type': 'Country', name: '台灣' } },
        mainEntity: { '@id': `${url}#list` },
      },
      {
        '@type': 'ItemList',
        '@id': `${url}#list`,
        name: `${city.short}美業空間列表`,
        numberOfItems: spaces.length,
        itemListElement: spaces.map((space, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${SITE_URL}/spaces/${space.id}`,
          name: space.title,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '美業空間', item: `${SITE_URL}/spaces` },
          { '@type': 'ListItem', position: 3, name: city.name, item: url },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  }

  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <JsonLd data={jsonLd} />

      <div className="container space-y-10">
        <nav aria-label="麵包屑" className="text-sm text-black/55">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-brand">首頁</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/spaces" className="hover:text-brand">美業空間</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-ink">{city.name}</li>
          </ol>
        </nav>

        <header className="space-y-4">
          <p className="section-tag">{city.name}・美業空間時租</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">{h1}</h1>
          <div className="max-w-3xl space-y-3 text-base leading-8 text-black/65" data-city-intro>
            {intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {stats.count > 0 ? (
            <dl className="grid max-w-3xl grid-cols-2 gap-3 pt-2 md:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  <dt className="text-xs text-black/50">{fact.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <p className="text-xs text-black/45">資料日期：{dateLabel}，依 SoloBeauté 上架中的空間即時計算。</p>
        </header>

        {spaces.length > 0 ? (
          <section className="space-y-5" aria-labelledby="city-spaces">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id="city-spaces" className="section-title">{city.short}的美業空間</h2>
              <span className="text-sm text-black/55 [font-family:var(--font-body)] lining-nums">共 {spaces.length} 間</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {spaces.map((space) => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="sb-card space-y-6 p-6 md:p-8" aria-labelledby="city-faq">
          <h2 id="city-faq" className="text-xl font-semibold text-ink">{city.short}美業空間常見問題</h2>
          <div className="space-y-5" data-city-faq>
            {faq.map((item) => (
              <div key={item.question} className="space-y-2">
                <h3 className="text-base font-semibold text-ink">{item.question}</h3>
                <p className="text-sm leading-7 text-black/65">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="other-cities">
          <h2 id="other-cities" className="text-xl font-semibold text-ink">其他縣市的美業空間</h2>
          <ul className="flex flex-wrap gap-2">
            {otherCities.map((item) => (
              <li key={item.city.slug}>
                <Link
                  href={cityPagePath(item.city)}
                  className="inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition hover:border-brand hover:text-brand [font-family:var(--font-body)] lining-nums"
                >
                  {item.city.short}美業空間 · {item.count} 間
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/spaces"
                className="inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition hover:border-brand hover:text-brand [font-family:var(--font-body)] lining-nums"
              >
                全部美業空間
              </Link>
            </li>
            <li>
              <Link
                href="/spaces/price-report"
                className="inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition hover:border-brand hover:text-brand [font-family:var(--font-body)] lining-nums"
              >
                全台時租行情
              </Link>
            </li>
            {[
              { href: '/guides/lash-artist-studio', label: '美睫師租工作室' },
              { href: '/guides/hourly-vs-monthly-rent', label: '時租和月租怎麼比' },
              { href: '/hosts', label: '屋主出租閒置時段' },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition hover:border-brand hover:text-brand [font-family:var(--font-body)] lining-nums"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="sb-card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">下載 SoloBeauté App 預約{city.short}的空間</h2>
          <p className="text-sm leading-7 text-black/65">
            在 App 裡可以看可預約時段、3D 實景（部分空間），直接跟屋主約時間。在{city.short}有閒置的美容室或座位，也可以在 App 上架出租。
          </p>
          <StoreButtons buttonClassName="btn-dark" />
        </section>
      </div>
    </main>
  )
}
