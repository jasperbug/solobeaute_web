'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function LoginPage() {
  const t = useTranslations('login')

  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <div className="container">
        <section className="sb-card mx-auto max-w-2xl space-y-5 px-6 py-10 text-center">
          <p className="section-tag">{t('sectionTag')}</p>
          <h1 className="text-3xl font-semibold text-ink">{t('title')}</h1>
          <p className="text-sm leading-7 text-black/60">{t('description')}</p>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 text-sm font-medium text-white transition hover:bg-brand-light"
          >
            {t('backHome')}
          </Link>
        </section>
      </div>
    </main>
  )
}
