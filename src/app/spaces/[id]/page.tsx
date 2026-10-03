import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/spaces/JsonLd'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { cityPagePath, getCityByName } from '@/lib/cities'
import { DEFAULT_METADATA_IMAGE, SITE_URL } from '@/lib/constants'
import { buildAppDeepLink } from '@/lib/format'
import {
  buildSpaceDescription,
  buildSpaceOgTitle,
  buildSpaceSubtitle,
  buildSpaceSummary,
  buildSpaceTitle,
  cameraDisclosureLabel,
  cityAnchor,
  fetchPublicSpaceById,
  fetchPublicSpaces,
  formatNtd,
  locationLabel,
  photoAlt,
  spaceTypeLabel,
} from '@/lib/spaces'
import type { PublicSpace } from '@/lib/types'

// ISR window; every fetch in lib/spaces.ts uses the same revalidate value.
export const revalidate = 3600

type SpacePageProps = {
  params: { id: string }
}

/** City landing page when we have one, otherwise the city anchor on /spaces. */
function cityHref(city: string): string {
  const known = getCityByName(city)
  return known ? cityPagePath(known) : `/spaces#${cityAnchor(city)}`
}

function canonicalUrl(space: Pick<PublicSpace, 'id'>) {
  return `${SITE_URL}/spaces/${space.id}`
}

export async function generateMetadata({ params }: SpacePageProps): Promise<Metadata> {
  const space = await fetchPublicSpaceById(params.id)

  if (!space) {
    return {
      title: '找不到這個空間',
      robots: { index: false, follow: true },
    }
  }

  const title = buildSpaceTitle(space)
  const description = buildSpaceDescription(space)
  const ogTitle = buildSpaceOgTitle(space)
  const image = space.coverPhotoUrl ?? DEFAULT_METADATA_IMAGE
  const url = canonicalUrl(space)

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle,
      description,
      siteName: 'SoloBeauté',
      type: 'website',
      locale: 'zh_TW',
      url,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [image],
    },
  }
}

function buildJsonLd(space: PublicSpace, summary: string) {
  const url = canonicalUrl(space)
  const cityPage = getCityByName(space.city)
  const placeId = `${url}#place`
  const images = space.photos.map((photo) => photo.url)

  const rates: Array<{ key: string; name: string; price: number; unitCode?: string; unitText: string }> = []
  if (space.hourlyRate) rates.push({ key: 'hourly', name: '時租', price: space.hourlyRate, unitCode: 'HUR', unitText: '小時' })
  if (space.halfDayRate) rates.push({ key: 'half-day', name: '半日租', price: space.halfDayRate, unitText: '半日' })
  if (space.fullDayRate) rates.push({ key: 'full-day', name: '全日租', price: space.fullDayRate, unitCode: 'DAY', unitText: '全日' })

  const offers = rates.map((rate) => ({
    '@type': 'Offer',
    '@id': `${url}#offer-${rate.key}`,
    name: `${space.title} ${rate.name}`,
    url,
    price: rate.price,
    priceCurrency: 'TWD',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: rate.price,
      priceCurrency: 'TWD',
      ...(rate.unitCode ? { unitCode: rate.unitCode } : {}),
      unitText: rate.unitText,
    },
    ...(rate.key === 'hourly' && space.minimumHours
      ? { eligibleQuantity: { '@type': 'QuantitativeValue', minValue: space.minimumHours, unitCode: 'HUR' } }
      : {}),
    itemOffered: {
      '@type': 'Service',
      name: `${space.title}・${spaceTypeLabel(space.spaceType)}時租`,
      serviceType: '美業空間時租',
    },
    availableAtOrFrom: { '@id': placeId },
  }))

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Place',
        '@id': placeId,
        name: space.title,
        description: summary,
        url,
        ...(images.length > 0 ? { image: images } : {}),
        // City + district only (approved scope) — no street address, no geo.
        address: {
          '@type': 'PostalAddress',
          ...(space.city ? { addressRegion: space.city } : {}),
          ...(space.district ? { addressLocality: space.district } : {}),
          addressCountry: 'TW',
        },
        ...(space.equipment.length > 0
          ? {
              amenityFeature: space.equipment.map((item) => ({
                '@type': 'LocationFeatureSpecification',
                name: item,
                value: true,
              })),
            }
          : {}),
        ...(space.maxCapacity ? { maximumAttendeeCapacity: space.maxCapacity } : {}),
      },
      ...offers,
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '美業空間', item: `${SITE_URL}/spaces` },
          ...(cityPage ? [{ '@type': 'ListItem', position: 3, name: cityPage.name, item: `${SITE_URL}${cityPagePath(cityPage)}` }] : []),
          { '@type': 'ListItem', position: cityPage ? 4 : 3, name: space.title, item: url },
        ],
      },
    ],
  }
}

async function relatedSpaces(space: PublicSpace): Promise<PublicSpace[]> {
  try {
    const all = (await fetchPublicSpaces()).filter((item) => item.id !== space.id)
    const sameCity = all.filter((item) => item.city && item.city === space.city)
    const others = all.filter((item) => !sameCity.includes(item))
    return [...sameCity, ...others].slice(0, 3)
  } catch (error) {
    console.error('[spaces] related spaces unavailable:', error)
    return []
  }
}

function TagList({ items, tone = 'default' }: { items: string[]; tone?: 'default' | 'muted' }) {
  const className = tone === 'muted'
    ? 'rounded-full border border-black/10 px-3 py-1 text-sm text-black/50 line-through decoration-black/30'
    : 'rounded-full bg-surface-warm px-3 py-1 text-sm text-ink'
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className={className}>{item}</li>
      ))}
    </ul>
  )
}

export default async function SpacePage({ params }: SpacePageProps) {
  const space = await fetchPublicSpaceById(params.id)

  if (!space) {
    notFound()
  }

  const summary = buildSpaceSummary(space)
  const cityPage = getCityByName(space.city)
  const related = await relatedSpaces(space)
  const where = locationLabel(space)
  const camera = cameraDisclosureLabel(space.cameraDisclosureStatus)
  // Desktop grid = 1 large (2×2) + 2 beside it + rows of 3, so keep 3, 6 or 9
  // photos to avoid a dangling tile; the full set is in the App.
  const photoCount = space.photos.length < 3
    ? space.photos.length
    : Math.min(9, 3 + 3 * Math.floor((space.photos.length - 3) / 3))
  const photos = space.photos.slice(0, photoCount)
  const hiddenPhotos = space.photos.length - photos.length

  const priceRows = [
    { label: '時租', value: space.hourlyRate ? `${formatNtd(space.hourlyRate)}／小時` : null },
    { label: '半日', value: space.halfDayRate ? formatNtd(space.halfDayRate) : null },
    { label: '全日', value: space.fullDayRate ? formatNtd(space.fullDayRate) : null },
    { label: '最低時數', value: space.minimumHours ? `${space.minimumHours} 小時` : null },
  ].filter((row): row is { label: string; value: string } => row.value !== null)

  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <JsonLd data={buildJsonLd(space, summary)} />

      <div className="container space-y-8">
        <nav aria-label="麵包屑" className="text-sm text-black/55">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-brand">首頁</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/spaces" className="hover:text-brand">美業空間</Link></li>
            {space.city ? (
              <>
                <li aria-hidden="true">›</li>
                <li><Link href={cityHref(space.city)} className="hover:text-brand">{space.city}</Link></li>
              </>
            ) : null}
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-ink">{space.title}</li>
          </ol>
        </nav>

        <header className="space-y-3">
          <p className="section-tag">美業空間時租</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">{space.title}</h1>
          <p className="text-base text-black/65">{buildSpaceSubtitle(space)}</p>
        </header>

        {photos.length > 0 ? (
          <section aria-label="空間照片" className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {photos.map((photo, index) => (
              <div
                key={photo.url}
                className={`relative overflow-hidden rounded-2xl bg-surface-warm ${index === 0 ? 'col-span-2 row-span-2 aspect-[4/3] md:aspect-auto' : 'aspect-[4/3]'} ${index > 0 && index === photos.length - 1 && photos.length % 2 === 0 ? 'hidden md:block' : ''}`}
              >
                <Image
                  src={photo.url}
                  alt={photoAlt(space, photo.category, index)}
                  fill
                  priority={index === 0}
                  sizes={index === 0 ? '(min-width: 768px) 720px, 100vw' : '(min-width: 768px) 360px, 50vw'}
                  className="object-cover"
                />
              </div>
            ))}
          </section>
        ) : null}
        {hiddenPhotos > 0 ? (
          <p className="-mt-4 text-xs text-black/50">還有 {hiddenPhotos} 張照片，可以在 SoloBeauté App 查看。</p>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <section className="sb-card space-y-3 p-6 md:p-8">
              <h2 className="text-xl font-semibold text-ink">空間概要</h2>
              <p className="text-sm leading-8 text-black/70">{summary}</p>
            </section>

            {space.equipment.length > 0 ? (
              <section className="sb-card space-y-4 p-6 md:p-8">
                <h2 className="text-xl font-semibold text-ink">設備</h2>
                <TagList items={space.equipment} />
              </section>
            ) : null}

            {space.recommendedServices.length > 0 || space.prohibitedServices.length > 0 ? (
              <section className="sb-card space-y-5 p-6 md:p-8">
                <h2 className="text-xl font-semibold text-ink">適合的服務項目</h2>
                {space.recommendedServices.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-black/60">屋主建議</h3>
                    <TagList items={space.recommendedServices} />
                  </div>
                ) : null}
                {space.prohibitedServices.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-black/60">不開放</h3>
                    <TagList items={space.prohibitedServices} tone="muted" />
                  </div>
                ) : null}
              </section>
            ) : null}

            {space.description ? (
              <section className="sb-card space-y-3 p-6 md:p-8">
                <h2 className="text-xl font-semibold text-ink">屋主介紹</h2>
                <p className="whitespace-pre-line text-sm leading-8 text-black/70">{space.description}</p>
              </section>
            ) : null}

            {space.roomScanUrl ? (
              <section className="sb-card space-y-3 p-6 md:p-8">
                <h2 className="text-xl font-semibold text-ink">3D 實景</h2>
                <p className="text-sm leading-7 text-black/70">
                  這個空間有 3D 實景。用 iPhone／iPad 可以直接開啟 AR 預覽，也可以在 SoloBeauté App 裡看。
                </p>
                <a
                  rel="ar"
                  href={space.roomScanUrl}
                  className="inline-flex min-h-11 items-center gap-3 rounded-lg border border-black/10 px-4 text-sm text-ink transition hover:border-brand hover:text-brand"
                >
                  {/* AR Quick Look requires an <img> as the link's first child. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/brand/logo.png" alt="" width={20} height={20} />
                  開啟 3D 實景（iOS）
                </a>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section className="sb-card space-y-4 p-6">
              <h2 className="text-lg font-semibold text-ink">價格與租用</h2>
              <dl className="divide-y divide-black/5 text-sm">
                {priceRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2">
                    <dt className="text-black/55">{row.label}</dt>
                    <dd className="font-medium text-ink">{row.value}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2">
                  <dt className="text-black/55">地區</dt>
                  <dd className="font-medium text-ink">{where || '—'}</dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="text-black/55">類型</dt>
                  <dd className="font-medium text-ink">{spaceTypeLabel(space.spaceType)}</dd>
                </div>
              </dl>
              {camera ? <p className="text-xs leading-6 text-black/55">{camera}</p> : null}
              <p className="text-xs leading-6 text-black/55">
                網站只顯示到縣市與區，完整位置請在 SoloBeauté App 查看；租金現場付給屋主。
              </p>
            </section>

            <section className="sb-card space-y-4 p-6">
              <h2 className="text-lg font-semibold text-ink">在 App 預約這個空間</h2>
              <p className="text-sm leading-7 text-black/65">
                下載 SoloBeauté App，查看可預約時段、直接傳訊息給屋主。
              </p>
              <StoreButtons buttonClassName="btn-dark" />
              <a
                href={buildAppDeepLink('space', space.id)}
                className="inline-flex text-sm text-brand underline-offset-4 hover:underline"
              >
                已安裝 App？在 App 開啟
              </a>
            </section>
          </aside>
        </div>

        {related.length > 0 ? (
          <section className="space-y-5">
            <h2 className="section-title">{space.city && related.every((item) => item.city === space.city) ? `同樣在${space.city}的空間` : '你可能也想看的空間'}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <SpaceCard key={item.id} space={item} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {cityPage ? (
                <Link href={cityPagePath(cityPage)} className="inline-flex text-sm text-brand underline-offset-4 hover:underline">
                  看{cityPage.short}全部美業空間 →
                </Link>
              ) : null}
              <Link href="/spaces" className="inline-flex text-sm text-brand underline-offset-4 hover:underline">
                看全部美業空間 →
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
