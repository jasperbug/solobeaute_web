import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { formatCurrency, getServiceAreaLabel, getStartingPrice, resolveImageUrl } from '@/lib/format'
import type { BeauticianSummary } from '@/lib/types'

type FeaturedCarouselProps = {
  items: BeauticianSummary[]
}

export function FeaturedCarousel({ items }: FeaturedCarouselProps) {
  const t = useTranslations('featured')
  const locale = useLocale()

  return (
    <div className="flex snap-x gap-4 overflow-x-auto pb-3">
      {items.map((item) => {
        const image = resolveImageUrl(item.portfolioPreviewUrl || item.user.avatarUrl || item.portfolioUrls[0])
        const serviceArea = getServiceAreaLabel(item.serviceArea)
        const price = getStartingPrice(item)

        return (
          <Link
            key={item.id}
            href={`/beautician/${item.slug ?? item.id}`}
            className="sb-card min-w-[260px] max-w-[280px] snap-start overflow-hidden transition hover:-translate-y-0.5"
          >
            <div className="relative aspect-[4/5] bg-surface-warm">
              {image ? (
                <Image src={image} alt={item.displayName} fill className="object-cover" />
              ) : null}
            </div>
            <div className="space-y-2 p-4">
              <h3 className="text-lg font-semibold text-ink">{item.displayName}</h3>
              <p className="text-sm text-black/60">{item.specialties.slice(0, 2).join(' · ') || t('beautyPro')}</p>
              <div className="flex items-center justify-between gap-3 text-sm text-black/55">
                <span>{serviceArea ?? t('availableOnline')}</span>
                {price ? <span>{formatCurrency(price, locale)}</span> : null}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
