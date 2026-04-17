'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

import { APP_STORE_URL } from '@/lib/constants'
import { LOCALE_COOKIE_NAME, LANGUAGE_OPTIONS, type AppLocale } from '@/i18n/config'
import { AppleIcon, GlobeIcon } from '../ui/Icons'
import { MobileNav } from './MobileNav'

export function Header() {
  const t = useTranslations()
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false)
      }
    }

    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  useEffect(() => {
    setMobileMenu(false)
    setLangOpen(false)
  }, [pathname])

  const currentLanguage = LANGUAGE_OPTIONS.find((item) => item.value === locale) ?? LANGUAGE_OPTIONS[0]

  const navLinks = useMemo(
    () => [
      { href: pathname === '/' ? '#features' : '/#features', label: t('nav.features') },
      { href: pathname === '/' ? '#how-it-works' : '/#how-it-works', label: t('nav.howItWorks') },
      { href: pathname === '/' ? '#about' : '/#about', label: t('nav.about') },
      { href: '/search', label: t('nav.discover') },
    ],
    [pathname, t]
  )

  function setLocaleCookie(nextLocale: AppLocale) {
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax; secure`
    router.refresh()
  }

  return (
    <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="nav__inner container">
        <Link href="/" className="nav__logo" onClick={() => setMobileMenu(false)}>
          <Image src="/images/brand/logo.png" alt="SoloBeauté" width={30} height={30} priority />
          <span>SoloBeauté</span>
        </Link>

        <div className="md:hidden">
          <MobileNav isOpen={mobileMenu} nav={navLinks} onNavigate={() => setMobileMenu(false)} />
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <div className="nav__links">
            {navLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="nav__right">
          <Link href="/login" className="hidden text-xs text-[var(--color-text-secondary)] md:inline-flex">
            {t('nav.login')}
          </Link>

          <div className="lang-picker" ref={langRef}>
            <button className="nav__lang" onClick={() => setLangOpen((open) => !open)} type="button" aria-expanded={langOpen} aria-haspopup="true" aria-label={currentLanguage.label}>
              <GlobeIcon className="h-4 w-4" />
              <span>{currentLanguage.short}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {langOpen && (
              <div className="lang-dropdown">
                {LANGUAGE_OPTIONS.map((language) => (
                  <button
                    key={language.value}
                    className={`lang-dropdown__item ${language.value === locale ? 'lang-dropdown__item--active' : ''}`}
                    onClick={() => {
                      setLocaleCookie(language.value)
                      setLangOpen(false)
                    }}
                    type="button"
                  >
                    {language.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn--sm"
          >
            <AppleIcon className="h-[18px] w-[18px]" />
            {t('nav.download')}
          </a>
        </div>

        <button
          className={`hamburger ${mobileMenu ? 'hamburger--open' : ''}`}
          onClick={() => setMobileMenu((open) => !open)}
          aria-label="Menu"
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  )
}
