import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { formatCurrency, getBeauticianDiscoveryImage, getServiceAreaLabel, getStartingPrice, resolveImageUrl } from '@/lib/format'
import type { BeauticianSummary } from '@/lib/types'
import { Badge } from '../ui/Badge'
import { CheckCircleIcon } from '../ui/Icons'

type BeauticianCardProps = {
  beautician: BeauticianSummary
}

function getDisplayInitials(name: string) {
  const compactName = name.trim()

  if (!compactName) {
    return 'SB'
  }

  const latinParts = compactName.split(/\s+/).filter(Boolean)
  if (latinParts.length > 1) {
    return latinParts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
  }

  return Array.from(compactName).slice(0, 2).join('').toUpperCase()
}

export function BeauticianCard({ beautician }: BeauticianCardProps) {
  const t = useTranslations('beautician')
  const locale = useLocale()
  const startingPrice = getStartingPrice(beautician)
  const heroImage = getBeauticianDiscoveryImage(beautician)
  const isAvatarHero = Boolean(beautician.user.avatarUrl)
  const heroImageClassName = isAvatarHero
    ? 'object-cover object-center scale-[1.08]'
    : 'object-cover object-center'
  const serviceArea = getServiceAreaLabel(beautician.serviceArea)
  const previewImages = beautician.portfolioUrls.slice(0, 3)
  const displayInitials = getDisplayInitials(beautician.displayName)
  const priceLabel = startingPrice
    ? locale.startsWith('zh')
      ? `${formatCurrency(startingPrice, locale)}${t('startingFrom')}`
      : `${t('startingFrom')} ${formatCurrency(startingPrice, locale)}`
    : null

  return (
    <article className="sb-card overflow-hidden">
      <div className="grid md:h-[420px] md:grid-cols-[260px_minmax(0,1fr)]">
        <div className="relative min-h-[280px] overflow-hidden bg-black/5 md:h-full md:min-h-0">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={beautician.displayName}
              fill
              sizes="(min-width: 768px) 260px, 100vw"
              className={heroImageClassName}
            />
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

        <div className="flex min-h-0 flex-col gap-4 p-5 md:h-full md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="line-clamp-2 text-xl font-semibold text-ink">{beautician.displayName}</h2>
                {beautician.reviewStatus === 'APPROVED' ? (
                  <Badge>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircleIcon className="h-4 w-4" />
                      {t('verified')}
                    </span>
                  </Badge>
                ) : null}
              </div>

              <p className="text-sm text-black/60">
                {beautician.specialties.slice(0, 3).join(' · ') || t('brandPage')}
              </p>
            </div>

            <div className="text-right">
              {priceLabel ? (
                <p className="text-sm font-medium text-brand">
                  {priceLabel}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {serviceArea ? <Badge tone="muted">{serviceArea}</Badge> : null}
            {beautician.serviceCount ? <Badge tone="muted">{beautician.serviceCount} {t('services')}</Badge> : null}
          </div>

          {beautician.bio ? (
            <p className="line-clamp-2 text-sm leading-7 text-black/65">{beautician.bio}</p>
          ) : null}

          {previewImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {previewImages.map((image) => (
                <div key={image} className="relative h-20 overflow-hidden rounded-lg bg-black/5 md:h-24">
                  <Image src={resolveImageUrl(image) ?? image} alt={beautician.displayName} fill className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-2">
            <p className="text-xs text-black/45">{t('profileLinkHint')}</p>
            <Link
              href={`/beautician/${beautician.slug ?? beautician.id}`}
              className="inline-flex min-h-11 items-center rounded-lg border border-brand px-4 text-sm font-medium text-brand transition hover:bg-brand hover:text-white"
            >
              {t('viewBrandPage')}
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
