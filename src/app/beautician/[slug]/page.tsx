import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { BeauticianGallery } from '@/components/beautician/BeauticianGallery'
import { ServiceCard } from '@/components/beautician/ServiceCard'
import { Badge } from '@/components/ui/Badge'
import { CheckCircleIcon } from '@/components/ui/Icons'
import { fetchBeauticianBySlug } from '@/lib/api'
import { DEFAULT_METADATA_IMAGE, SITE_URL, SOCIAL_LABELS } from '@/lib/constants'
import { formatExperience, getBeauticianDiscoveryImage, getDisplayInitials, getServiceAreaLabel, normalizeSocialUrl, resolveImageUrl, sortSocialLinks } from '@/lib/format'

type BrandPageProps = {
  params: { slug: string }
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const beautician = await fetchBeauticianBySlug(params.slug)
  if (!beautician) {
    const t = await getTranslations('beautician')
    return {
      title: t('notFound'),
    }
  }

  const serviceArea = getServiceAreaLabel(beautician.serviceArea)
  const description = [beautician.bio?.slice(0, 150) ?? beautician.specialties.join('、'), serviceArea].filter(Boolean).join(' · ')
  const image = getBeauticianDiscoveryImage(beautician) ?? DEFAULT_METADATA_IMAGE

  return {
    title: `${beautician.displayName} - ${beautician.specialties.join('、')}`,
    description,
    alternates: {
      canonical: `${SITE_URL}/beautician/${params.slug}`,
    },
    openGraph: {
      title: beautician.displayName,
      description,
      type: 'profile',
      images: [image],
    },
  }
}

export default async function BeauticianBrandPage({ params }: BrandPageProps) {
  const beautician = await fetchBeauticianBySlug(params.slug)
  const t = await getTranslations()

  if (!beautician) {
    notFound()
  }

  const serviceArea = getServiceAreaLabel(beautician.serviceArea)
  const experienceYears = formatExperience(beautician.yearsExperience)
  const experience = experienceYears
    ? t('beautician.experienceYears', { years: experienceYears })
    : null
  const socialLinks = sortSocialLinks(beautician.socialLinks)
  const heroImage = getBeauticianDiscoveryImage(beautician)
  const displayInitials = getDisplayInitials(beautician.displayName)
  const galleryImages = Array.from(
    new Set(
      [...beautician.portfolioUrls, ...beautician.announcementImageUrls]
        .map((value) => resolveImageUrl(value))
        .filter((value): value is string => Boolean(value))
    )
  ).slice(0, 8)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: beautician.displayName,
    description: beautician.bio ?? beautician.specialties.join('、'),
    address: beautician.serviceArea ? {
      '@type': 'PostalAddress',
      addressLocality: beautician.serviceArea.city,
      addressRegion: beautician.serviceArea.district ?? beautician.serviceArea.city,
    } : undefined,
  }

  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/search" className="text-sm text-black/55 transition hover:text-brand">
            ← {t('beautician.backToSearch')}
          </Link>
          <Link href="/login" className="text-sm text-black/55 transition hover:text-brand">
            {t('nav.login')}
          </Link>
        </div>

        <section className="sb-card overflow-hidden">
          <div className="grid gap-8 p-6 md:grid-cols-[220px_1fr] md:p-8">
            <div className="relative mx-auto h-[220px] w-[220px] overflow-hidden rounded-full bg-black/5">
              {heroImage ? (
                <Image src={heroImage} alt={beautician.displayName} fill className="object-cover object-center" />
              ) : (
                <div className="flex h-full items-center justify-center bg-surface-warm text-center">
                  <div className="space-y-3 px-6">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-semibold tracking-normal text-brand shadow-soft">
                      {displayInitials}
                    </div>
                    <p className="line-clamp-2 text-sm font-medium text-ink/70">{beautician.displayName}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold text-ink md:text-4xl">{beautician.displayName}</h1>
                  {beautician.reviewStatus === 'APPROVED' ? (
                    <Badge>
                      <span className="inline-flex items-center gap-1">
                        <CheckCircleIcon className="h-4 w-4" />
                        {t('beautician.verified')}
                      </span>
                    </Badge>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-black/55">
                  {experience ? <span>{experience}</span> : null}
                  {serviceArea ? <span>{serviceArea}</span> : null}
                </div>

                <p className="text-base text-black/65">{beautician.specialties.join(' · ')}</p>
              </div>

              {beautician.bio ? <p className="max-w-3xl text-sm leading-8 text-black/65">{beautician.bio}</p> : null}

              {socialLinks.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((item) => (
                    <a
                      key={item.key}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-lg border border-black/10 px-4 text-sm text-black/65 transition hover:border-brand hover:text-brand"
                    >
                      {SOCIAL_LABELS[item.key] ?? item.key}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {beautician.announcement || galleryImages.length > 0 ? (
          <section className="sb-card space-y-6 p-6 md:p-8">
            <div className="space-y-2">
              <p className="section-tag">{t('beautician.announcementTag')}</p>
              {beautician.announcement ? (
                <p className="whitespace-pre-line text-sm leading-8 text-black/65">{beautician.announcement}</p>
              ) : null}
            </div>

            {galleryImages.length > 0 ? (
              <BeauticianGallery images={galleryImages} displayName={beautician.displayName} />
            ) : null}
          </section>
        ) : null}

        <section className="space-y-5">
          <div className="space-y-2">
            <p className="section-tag">{t('beautician.servicesTag')}</p>
            <h2 className="section-title">{t('beautician.servicesTitle')}</h2>
          </div>
          <div className="grid gap-4">
            {beautician.services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>

        {socialLinks.length > 0 ? (
          <section className="sb-card space-y-4 p-6 md:p-8">
            <p className="section-tag">{t('beautician.contactTag')}</p>
            <h2 className="section-title">{t('beautician.contactTitle')}</h2>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.key}
                  href={normalizeSocialUrl(item.key, beautician.socialLinks[item.key as keyof typeof beautician.socialLinks]) ?? item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-light"
                >
                  {SOCIAL_LABELS[item.key] ?? item.key}
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
