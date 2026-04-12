import Link from 'next/link'
import { useTranslations } from 'next-intl'

type EmptyStateProps = {
  title: string
  description: string
  href?: string
  ctaLabel?: string
}

export function EmptyState({ title, description, href = '/', ctaLabel }: EmptyStateProps) {
  const t = useTranslations('common')

  return (
    <div className="sb-card flex flex-col items-center gap-4 px-6 py-12 text-center">
      <div className="h-14 w-14 rounded-full bg-brand/10" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <p className="mx-auto max-w-xl text-sm leading-7 text-black/60">{description}</p>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 text-sm font-medium text-white transition hover:bg-brand-light"
      >
        {ctaLabel ?? t('backHome')}
      </Link>
    </div>
  )
}
