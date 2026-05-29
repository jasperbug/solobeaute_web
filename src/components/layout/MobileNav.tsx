import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { APP_STORE_URL } from '@/lib/constants'
import { AppleIcon } from '../ui/Icons'

type MobileNavProps = {
  isOpen: boolean
  onNavigate: () => void
  nav: Array<{ href: string; label: string }>
}

export function MobileNav({ isOpen, onNavigate, nav }: MobileNavProps) {
  const t = useTranslations('nav')

  return (
    <div
      className={`nav__mobile-menu ${isOpen ? 'nav__mobile-menu--open' : ''}`}
      onClick={onNavigate}
    >
      {nav.map((item) => (
        <Link key={item.href} href={item.href} onClick={onNavigate}>
          {item.label}
        </Link>
      ))}
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-dark nav__mobile-action"
        onClick={onNavigate}
      >
        <AppleIcon className="h-4 w-4" />
        {t('download')}
      </a>
    </div>
  )
}
