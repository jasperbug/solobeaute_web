import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

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

function pageTitle(type: ShareEntityType, data: SpaceSummary | BeauticianDetail | null, fallback: string) {
  if (!data) {
    return fallback
  }
  return type === 'space'
    ? (data as SpaceSummary).title
    : (data as BeauticianDetail).displayName
}

type BeauticianSummaryLabels = {
  experienceYears: (years: number) => string
  fallback: string
}

function summary(
  type: ShareEntityType,
  data: SpaceSummary | BeauticianDetail,
  labels: BeauticianSummaryLabels
) {
  if (type === 'space') {
    const space = data as SpaceSummary
    const price = space.hourlyRate ? ` ・ NT$${space.hourlyRate}/hr` : ''
    return `${space.city ?? ''} ${space.district ?? ''}${price}`.trim()
  }

  return buildBeauticianSummary(data as BeauticianDetail, labels)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!isShareType(params.type)) {
    return {}
  }

  const t = await getTranslations('share')
  const tBeautician = await getTranslations('beautician')
  const summaryLabels: BeauticianSummaryLabels = {
    experienceYears: (years: number) => tBeautician('experienceYears', { years }),
    fallback: tBeautician('fallbackSummary'),
  }
  const data = await fetchShareEntity(params.type, params.id)
  const title = pageTitle(params.type, data as SpaceSummary | BeauticianDetail | null, t('defaultTitle'))
  const image = getShareHeroImage(params.type, data as SpaceSummary | BeauticianDetail | null) ?? DEFAULT_METADATA_IMAGE
  const description = data ? summary(params.type, data as SpaceSummary | BeauticianDetail, summaryLabels) : t('defaultDescription')

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/share/${params.type}/${params.id}`,
    },
    openGraph: {
      title,
      description,
      images: [image],
      type: 'website',
    },
  }
}

export default async function SharePage({ params }: PageProps) {
  if (!isShareType(params.type)) {
    notFound()
  }

  const t = await getTranslations('share')
  const tBeautician = await getTranslations('beautician')
  const summaryLabels: BeauticianSummaryLabels = {
    experienceYears: (years: number) => tBeautician('experienceYears', { years }),
    fallback: tBeautician('fallbackSummary'),
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
            <h1>{t('notFoundTitle')}</h1>
            <p>{t('notFoundDescription')}</p>
            <Link className="share-card__secondary" href="/">
              {t('backHome')}
            </Link>
          </section>
        </main>
      </div>
    )
  }

  const title = pageTitle(params.type, data as SpaceSummary | BeauticianDetail, t('defaultTitle'))
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
                <span>{params.type === 'space' ? t('typeSpace') : t('typeBeautician')}</span>
              </div>
            )}
          </div>

          <div className="share-card__body">
            <p className="share-card__eyebrow">{params.type === 'space' ? t('eyebrowSpace') : t('eyebrowBeautician')}</p>
            <h1 className="share-card__title">{params.type === 'space' ? space?.title : beautician?.displayName}</h1>
            <p className="share-card__summary">{summary(params.type, data as SpaceSummary | BeauticianDetail, summaryLabels)}</p>

            <div className="share-card__metrics">
              {params.type === 'space' ? (
                <span>
                  ⭐ {formatCompactRating(space?.ratingAvg ?? 0, space?.ratingCount ?? 0) ?? tBeautician('noReviews')}
                </span>
              ) : null}
              {beautician?.services?.length ? <span>{t('servicesCount', { count: beautician.services.length })}</span> : null}
              {price ? <span>{t('priceFrom', { price })}</span> : null}
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
                {t('openInApp')}
              </a>
              <CopyButton
                className="share-card__secondary"
                value={shareUrl}
                idleLabel={t('copyLink')}
                copiedLabel={t('copiedLink')}
              />
            </div>

            <p className="share-card__hint">{t('hint')}</p>
          </div>
        </section>
      </main>
    </div>
  )
}
