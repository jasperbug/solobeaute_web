import Link from 'next/link'

import { StoreButtons } from '../ui/StoreButtons'

type MobileNavProps = {
  isOpen: boolean
  onNavigate: () => void
  nav: Array<{ href: string; label: string }>
}

// 行動選單直接列出兩個商店連結：分享頁/職人頁訪客一鍵就能安裝，
// 不用先繞回首頁的 #download 區塊（桌機版 Header 仍用錨點）。
export function MobileNav({ isOpen, onNavigate, nav }: MobileNavProps) {

  return (
    <div
      className={`nav__mobile-menu ${isOpen ? 'nav__mobile-menu--open' : ''}`}
      onClick={onNavigate}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      aria-hidden={!isOpen}
    >
      {nav.map((item) => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
      <StoreButtons buttonClassName="btn-dark nav__mobile-action" />
    </div>
  )
}
