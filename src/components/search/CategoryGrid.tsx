import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { CATEGORY_OPTIONS } from '@/lib/constants'

export function CategoryGrid() {
  const t = useTranslations('categories')

  return (
    <div className="grid grid-cols-3 gap-3 md:flex md:flex-wrap">
      {CATEGORY_OPTIONS.map((category) => (
        <Link
          key={category.value}
          href={`/search?category=${category.value}`}
          className="sb-card flex min-h-[110px] flex-col items-center justify-center gap-3 px-3 py-5 text-center transition hover:border-brand/20 hover:shadow-soft md:min-h-[120px] md:w-[132px]"
        >
          <span className="text-2xl">{category.emoji}</span>
          <span className="text-sm font-medium text-ink">{t(category.labelKey)}</span>
        </Link>
      ))}
    </div>
  )
}
