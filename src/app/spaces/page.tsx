import type { Metadata } from 'next'
import Link from 'next/link'

import { JsonLd } from '@/components/spaces/JsonLd'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { cityPagePath, getCityByName } from '@/lib/cities'
import { SITE_URL } from '@/lib/constants'
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

export async function generateMetadata(): Promise<Metadata> {
  let description = FALLBACK_DESCRIPTION
  try {
    description = buildDescription(await fetchPublicSpaces())
  } catch (error) {
    console.error('[spaces] metadata fallback:', error)
  }

  return {
    title: PAGE_TITLE,
    description,
    alternates: { canonical: PAGE_URL },
    openGraph: {
      title: OG_TITLE,
      description,
      siteName: 'SoloBeauté',
      type: 'website',
      locale: 'zh_TW',
      url: PAGE_URL,
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: OG_TITLE,
      description,
      images: ['/og-image.png'],
    },
  }
}

export default async function SpacesPage() {
  const spaces = await fetchPublicSpaces()
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
