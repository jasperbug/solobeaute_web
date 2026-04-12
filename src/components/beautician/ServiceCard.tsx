import { useLocale, useTranslations } from 'next-intl'

import { formatCurrency } from '@/lib/format'
import type { BeauticianService } from '@/lib/types'

type ServiceCardProps = {
  service: BeauticianService
}

export function ServiceCard({ service }: ServiceCardProps) {
  const t = useTranslations('beautician')
  const locale = useLocale()

  return (
    <article className="sb-card flex items-start justify-between gap-4 p-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-ink">{service.name}</h3>
        {service.description ? (
          <p className="text-sm leading-7 text-black/60">{service.description}</p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-base font-semibold text-brand">{formatCurrency(service.price, locale) ?? 'NT$0'}</p>
        <p className="text-xs text-black/50">
          {service.durationMin} {t('minutes')}
        </p>
      </div>
    </article>
  )
}
