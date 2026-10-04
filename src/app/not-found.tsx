import Link from 'next/link'
import { getLocale } from 'next-intl/server'

import { localizePath } from '@/i18n/config'

export default async function NotFoundPage() {
  const isEn = (await getLocale()) === 'en'
  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <div className="container">
        <div className="sb-card px-6 py-12 text-center">
          <h1 className="text-3xl font-semibold text-ink">{isEn ? 'Page not found' : '找不到這個頁面'}</h1>
          <p className="mt-3 text-sm leading-7 text-black/60">
            {isEn ? 'The address may have changed, or the page no longer exists.' : '網址可能已變更，或內容已不存在。'}
          </p>
          <Link
            href={isEn ? localizePath('/', 'en') : '/'}
            className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-brand px-5 text-sm font-medium text-white transition hover:bg-brand-light"
          >
            {isEn ? 'Back to home' : '返回首頁'}
          </Link>
        </div>
      </div>
    </main>
  )
}
