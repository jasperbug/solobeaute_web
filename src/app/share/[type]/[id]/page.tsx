import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CopyButton } from '@/components/ui/CopyButton'
import { buildAppDeepLink, buildBeauticianSummary, buildShareUrl, formatCompactRating, getShareHeroImage, getStartingPrice } from '@/lib/format'
import { DEFAULT_METADATA_IMAGE, SITE_URL } from '@/lib/constants'
import { fetchShareEntity } from '@/lib/api'
import type { BeauticianDetail, ShareEntityType, SpaceSummary } from '@/lib/types'

type PageProps = {
  params: { type: string; id: string }
}

function isShareType(value: string): value is ShareEntityType {
  return value === 'space' || value === 'beautician'
}

function tagList(type: ShareEntityType, data: SpaceSummary | BeauticianDetail | null) {
  if (!data) return []
  if (type === 'space') {
    return (data as SpaceSummary).recommendedServices?.slice(0, 3) ?? []
  }
  return (data as BeauticianDetail).specialties.slice(0, 3)
}

function pageTitle(type: ShareEntityType, data: SpaceSummary | BeauticianDetail | null) {
  if (!data) {
    return 'SoloBeauté Share'
  }
  return type === 'space'
    ? (data as SpaceSummary).title
    : (data as BeauticianDetail).displayName
}

function summary(type: ShareEntityType, data: SpaceSummary | BeauticianDetail) {
  if (type === 'space') {
    const space = data as SpaceSummary
    const price = space.hourlyRate ? ` ・ NT$${space.hourlyRate}/hr` : ''
    return `${space.city ?? ''} ${space.district ?? ''}${price}`.trim()
  }

  return buildBeauticianSummary(data as BeauticianDetail)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!isShareType(params.type)) {
    return {}
  }

  const data = await fetchShareEntity(params.type, params.id)
  const title = pageTitle(params.type, data as SpaceSummary | BeauticianDetail | null)
  const image = getShareHeroImage(params.type, data as SpaceSummary | BeauticianDetail | null) ?? DEFAULT_METADATA_IMAGE

  return {
    title,
    description: data ? summary(params.type, data as SpaceSummary | BeauticianDetail) : 'SoloBeauté 分享頁',
    alternates: {
      canonical: `${SITE_URL}/share/${params.type}/${params.id}`,
    },
    openGraph: {
      title,
      description: data ? summary(params.type, data as SpaceSummary | BeauticianDetail) : 'SoloBeauté 分享頁',
      images: [image],
      type: 'website',
    },
  }
}

export default async function SharePage({ params }: PageProps) {
  if (!isShareType(params.type)) {
    notFound()
  }

  const data = await fetchShareEntity(params.type, params.id)
  const shareUrl = buildShareUrl(params.type, params.id)
  const appUrl = buildAppDeepLink(params.type, params.id)

  if (!data) {
    return (
      <div className="share-page">
        <div className="share-page__backdrop" />
        <main className="share-page__shell">
          <section className="share-card share-card--state">
            <h1>內容不存在</h1>
            <p>找不到這個分享內容</p>
            <Link className="share-card__secondary" href="/">
              返回 SoloBeauté
            </Link>
          </section>
        </main>
      </div>
    )
  }

  const title = pageTitle(params.type, data as SpaceSummary | BeauticianDetail)
  const image = getShareHeroImage(params.type, data as SpaceSummary | BeauticianDetail)
  const tags = tagList(params.type, data as SpaceSummary | BeauticianDetail)
  const beautician = params.type === 'beautician' ? (data as BeauticianDetail) : null
  const space = params.type === 'space' ? (data as SpaceSummary) : null
  const price = beautician ? getStartingPrice(beautician) : null

  return (
    <div className="share-page">
      <div className="share-page__backdrop" />
      <main className="share-page__shell">
        <div className="share-page__brand">
          <Image src="/images/brand/logo.png" alt="SoloBeauté" width={28} height={28} />
          <span>SoloBeauté</span>
        </div>

        <section className="share-card">
          <div className="share-card__media">
            {image ? (
              <Image src={image} alt={title} fill className="object-cover" />
            ) : (
              <div className="share-card__media-fallback">
                <span>{params.type === 'space' ? 'SPACE' : 'BEAUTICIAN'}</span>
              </div>
            )}
          </div>

          <div className="share-card__body">
            <p className="share-card__eyebrow">{params.type === 'space' ? '分享空間' : '分享美容師'}</p>
            <h1 className="share-card__title">{params.type === 'space' ? space?.title : beautician?.displayName}</h1>
            <p className="share-card__summary">{summary(params.type, data as SpaceSummary | BeauticianDetail)}</p>

            <div className="share-card__metrics">
              {params.type === 'space' ? (
                <span>
                  ⭐ {formatCompactRating(space?.ratingAvg ?? 0, space?.ratingCount ?? 0)}
                </span>
              ) : null}
              {beautician?.services?.length ? <span>{beautician.services.length} 項服務</span> : null}
              {price ? <span>NT${price} 起</span> : null}
            </div>

            {tags.length > 0 ? (
              <div className="share-card__tags">
                {tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : null}

            <div className="share-card__actions">
              <a className="share-card__primary" href={appUrl}>
                在 App 開啟
              </a>
              <CopyButton
                className="share-card__secondary"
                value={shareUrl}
                idleLabel="複製連結"
                copiedLabel="已複製連結"
              />
            </div>

            <p className="share-card__hint">沒有安裝 App 也可以直接在這個網頁查看內容。</p>
          </div>
        </section>
      </main>
    </div>
  )
}
