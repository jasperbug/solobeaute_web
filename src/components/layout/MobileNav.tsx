import Link from 'next/link'

type MobileNavProps = {
  isOpen: boolean
  onNavigate: () => void
  nav: Array<{ href: string; label: string }>
}

export function MobileNav({ isOpen, onNavigate, nav }: MobileNavProps) {
  return (
    <div className={`nav__mobile-menu ${isOpen ? 'nav__mobile-menu--open' : ''}`}>
      {nav.map((item) => (
        <Link key={item.href} href={item.href} onClick={onNavigate}>
          {item.label}
        </Link>
      ))}
    </div>
  )
}
