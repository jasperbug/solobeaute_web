import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'

import { JsonLd } from '@/components/spaces/JsonLd'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { localizePath } from '@/i18n/config'
import { cityPagePath, getCityByName } from '@/lib/cities'
import { SITE_URL } from '@/lib/constants'
import { cityListEn, cityNameEn, cityShortEn } from '@/lib/en'
import { localeAlternates, localeUrl, ogLocale } from '@/lib/i18nSeo'
import { fetchPublicSpaces, formatNtd, groupSpacesByCity, rateRange, shortCityName } from '@/lib/spaces'
import type { PublicSpace } from '@/lib/types'

export const revalidate = 3600

const PAGE_URL = `${SITE_URL}/spaces`
const PAGE_TITLE = '全台美業空間時租｜美甲美睫美容工作室出租'
const OG_TITLE = '全台美業空間時租｜SoloBeauté'
const FALLBACK_DESCRIPTION =
  '美甲、美睫、護膚職人按小時租屋主備好的美業空間，台北、新北、桃園、台中、高雄、彰化、南投都有。免押金、免長約，在 SoloBeauté App 直接預約，現場付現。'

function buildDescription(spaces: PublicSpace[]): string {
  const groups = groupSpacesByCity(spaces)
  const range = rateRange(spaces)
  if (spaces.length === 0 || !range) return FALLBACK_DESCRIPTION
  const cities = groups.map((group) => shortCityName(group.city)).join('、')
  return `SoloBeauté 目前有 ${spaces.length} 個美業空間可以按小時租，分布${cities}。時租 ${formatNtd(range.min)}–${range.max}，美甲、美睫、護膚職人免押金、免長約，現場付現。`
}

const PAGE_TITLE_EN = 'Beauty Workspaces for Hourly Rent Across Taiwan | Nail, Lash and Facial Studios'
const OG_TITLE_EN = 'Beauty workspaces for hourly rent across Taiwan | SoloBeauté'
const FALLBACK_DESCRIPTION_EN =
  'Nail, lash and facial professionals can rent host-prepared beauty workspaces by the hour across Taiwan. Rented by the hour with no long-term lease; book in the SoloBeauté app and pay on site.'

function buildDescriptionEn(spaces: PublicSpace[]): string {
  const groups = groupSpacesByCity(spaces)
  const range = rateRange(spaces)
  if (spaces.length === 0 || !range) return FALLBACK_DESCRIPTION_EN
  return `SoloBeauté has ${spaces.length} beauty workspaces for hourly rent in ${cityListEn(groups.map((group) => group.city))}, at ${formatNtd(range.min)}–${range.max} per hour. For nail, lash and facial professionals; no long-term lease, pay on site.`
}

export async function generateMetadata(): Promise<Metadata> {
  const isEn = (await getLocale()) === 'en'
  let description = isEn ? FALLBACK_DESCRIPTION_EN : FALLBACK_DESCRIPTION
  try {
    const list = await fetchPublicSpaces()
    description = isEn ? buildDescriptionEn(list) : buildDescription(list)
  } catch (error) {
    console.error('[spaces] metadata fallback:', error)
  }
  const ogTitle = isEn ? OG_TITLE_EN : OG_TITLE

  return {
    title: isEn ? PAGE_TITLE_EN : PAGE_TITLE,
    description,
    alternates: localeAlternates('/spaces', isEn ? 'en' : 'zh-TW'),
    openGraph: {
      title: ogTitle,
      description,
      siteName: 'SoloBeauté',
      type: 'website',
      ...ogLocale(isEn ? 'en' : 'zh-TW'),
      url: isEn ? localeUrl('/spaces', 'en') : PAGE_URL,
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

export default async function SpacesPage() {
  const spaces = await fetchPublicSpaces()
  if ((await getLocale()) === 'en') return <SpacesPageEn spaces={spaces} />
  const groups = groupSpacesByCity(spaces)
  const range = rateRange(spaces)
  const ordered = groups.flatMap((group) => group.spaces)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${PAGE_URL}#page`,
        name: PAGE_TITLE,
        url: PAGE_URL,
        inLanguage: 'zh-TW',
        isPartOf: { '@type': 'WebSite', name: 'SoloBeauté', url: SITE_URL },
        mainEntity: { '@id': `${PAGE_URL}#list` },
      },
      {
        '@type': 'ItemList',
        '@id': `${PAGE_URL}#list`,
        name: 'SoloBeauté 美業空間列表',
        numberOfItems: ordered.length,
        itemListElement: ordered.map((space, index) => ({
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
          { '@type': 'ListItem', position: 2, name: '美業空間', item: PAGE_URL },
        ],
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
            <li aria-current="page" className="text-ink">美業空間</li>
          </ol>
        </nav>

        <header className="space-y-4">
          <p className="section-tag">美業空間時租</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">全台美業空間時租</h1>
          <p className="max-w-3xl text-base leading-8 text-black/65">
            {spaces.length > 0 && range
              ? `SoloBeauté 目前有 ${spaces.length} 個屋主備好的美業空間，分布 ${groups.length} 個縣市，時租 ${formatNtd(range.min)}–${range.max}。美甲、美睫、護膚、紋繡職人可以按小時租，免押金、免長約，在 App 直接傳訊息給屋主預約，租金現場付現。`
              : '新空間陸續上架中。下載 SoloBeauté App，就能查看最新的美業空間。'}
          </p>
          <p className="text-sm">
            <Link href="/spaces/price-report" className="text-brand underline-offset-4 hover:underline">看全台美業空間時租行情：價格區間、中位數、依類型與縣市 →</Link>
          </p>
          {groups.length > 0 ? (
            <nav aria-label="依縣市瀏覽" className="flex flex-wrap gap-2 pt-2">
              {groups.map((group) => (
                <a
                  key={group.city}
                  href={`#${group.anchor}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition hover:border-brand hover:text-brand [font-family:var(--font-body)] lining-nums"
                >
                  {shortCityName(group.city)} · {group.spaces.length} 間
                </a>
              ))}
            </nav>
          ) : null}
        </header>

        {groups.map((group) => {
          const cityRange = rateRange(group.spaces)
          const cityPage = getCityByName(group.city)
          return (
            <section key={group.city} id={group.anchor} className="scroll-mt-28 space-y-5">
              <div className="space-y-1">
                <h2 className="section-title">
                  {cityPage ? (
                    <Link href={cityPagePath(cityPage)} className="hover:text-brand">{shortCityName(group.city)}美業空間時租</Link>
                  ) : (
                    `${shortCityName(group.city)}美業空間時租`
                  )}
                </h2>
                <p className="text-sm text-black/55 [font-family:var(--font-body)] lining-nums">
                  {group.city} · 共 {group.spaces.length} 間
                  {cityRange
                    ? cityRange.min === cityRange.max
                      ? ` · 時租 ${formatNtd(cityRange.min)}`
                      : ` · 時租 ${formatNtd(cityRange.min)}–${cityRange.max}`
                    : ''}
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.spaces.map((space) => (
                  <SpaceCard key={space.id} space={space} />
                ))}
              </div>
              {cityPage ? (
                <Link href={cityPagePath(cityPage)} className="inline-flex text-sm text-brand underline-offset-4 hover:underline">
                  {cityPage.short}美業空間時租行情與常見問題 →
                </Link>
              ) : null}
            </section>
          )
        })}

        <section className="sb-card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">下載 SoloBeauté App 預約空間</h2>
          <p className="text-sm leading-7 text-black/65">
            在 App 裡可以看可預約時段、3D 實景（部分空間），直接跟屋主約時間。有閒置的美容室或座位，也可以在 App 上架出租。
          </p>
          <StoreButtons buttonClassName="btn-dark" />
        </section>
      </div>
    </main>
  )
}

const en = (path: string) => localizePath(path, 'en')

function SpacesPageEn({ spaces }: { spaces: PublicSpace[] }) {
  const groups = groupSpacesByCity(spaces)
  const range = rateRange(spaces)
  const ordered = groups.flatMap((group) => group.spaces)
  const url = localeUrl('/spaces', 'en')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        name: PAGE_TITLE_EN,
        url,
        inLanguage: 'en',
        isPartOf: { '@type': 'WebSite', name: 'SoloBeauté', url: SITE_URL },
        mainEntity: { '@id': `${url}#list` },
      },
      {
        '@type': 'ItemList',
        '@id': `${url}#list`,
        name: 'SoloBeauté beauty workspaces',
        numberOfItems: ordered.length,
        itemListElement: ordered.map((space, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: localeUrl(`/spaces/${space.id}`, 'en'),
          name: space.title,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: localeUrl('/', 'en') },
          { '@type': 'ListItem', position: 2, name: 'Beauty workspaces', item: url },
        ],
      },
    ],
  }

  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <JsonLd data={jsonLd} />

      <div className="container space-y-10">
        <nav aria-label="Breadcrumb" className="text-sm text-black/55">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href={en('/')} className="hover:text-brand">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-ink">Beauty workspaces</li>
          </ol>
        </nav>

        <header className="space-y-4">
          <p className="section-tag">Beauty workspaces by the hour</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">Beauty workspaces for hourly rent across Taiwan</h1>
          <p className="max-w-3xl text-base leading-8 text-black/65">
            {spaces.length > 0 && range
              ? `SoloBeauté currently has ${spaces.length} host-prepared beauty workspaces in ${groups.length} cities and counties, at ${formatNtd(range.min)}–${range.max} per hour. Nail, lash, facial and brow professionals can rent them by the hour with no long-term lease: message the host in the app to book, and pay the rent on site.`
              : 'New spaces are being added. Download the SoloBeauté app to see the latest beauty workspaces.'}
          </p>
          <p className="text-sm">
            <Link href={en('/spaces/price-report')} className="text-brand underline-offset-4 hover:underline">See hourly rental prices across Taiwan: range, median, by type and by city →</Link>
          </p>
          {groups.length > 0 ? (
            <nav aria-label="Browse by city" className="flex flex-wrap gap-2 pt-2">
              {groups.map((group) => (
                <a
                  key={group.city}
                  href={`#${group.anchor}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition hover:border-brand hover:text-brand [font-family:var(--font-body)] lining-nums"
                >
                  {cityShortEn(group.city)} · {group.spaces.length}
                </a>
              ))}
            </nav>
          ) : null}
        </header>

        {groups.map((group) => {
          const cityRange = rateRange(group.spaces)
          const cityPage = getCityByName(group.city)
          const heading = `Beauty workspaces for hourly rent in ${cityShortEn(group.city)}`
          return (
            <section key={group.city} id={group.anchor} className="scroll-mt-28 space-y-5">
              <div className="space-y-1">
                <h2 className="section-title">
                  {cityPage ? (
                    <Link href={en(cityPagePath(cityPage))} className="hover:text-brand">{heading}</Link>
                  ) : heading}
                </h2>
                <p className="text-sm text-black/55 [font-family:var(--font-body)] lining-nums">
                  {cityNameEn(group.city)} · {group.spaces.length} {group.spaces.length === 1 ? 'space' : 'spaces'}
                  {cityRange
                    ? cityRange.min === cityRange.max
                      ? ` · ${formatNtd(cityRange.min)}/hour`
                      : ` · ${formatNtd(cityRange.min)}–${cityRange.max}/hour`
                    : ''}
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.spaces.map((space) => (
                  <SpaceCard key={space.id} space={space} locale="en" />
                ))}
              </div>
              {cityPage ? (
                <Link href={en(cityPagePath(cityPage))} className="inline-flex text-sm text-brand underline-offset-4 hover:underline">
                  {cityShortEn(cityPage)} rental prices and FAQ →
                </Link>
              ) : null}
            </section>
          )
        })}

        <section className="sb-card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">Book a space in the SoloBeauté app</h2>
          <p className="text-sm leading-7 text-black/65">
            In the app you can see available time slots and, for some spaces, a 3D tour, and arrange a time with the host directly. If you have an idle treatment room or station, you can also list it for rent in the app.
          </p>
          <StoreButtons buttonClassName="btn-dark" />
        </section>
      </div>
    </main>
  )
}
