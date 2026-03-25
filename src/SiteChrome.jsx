import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from './i18n'
import './App.css'

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

export default function SiteChrome({ children }) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onMouseDown = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangOpen(false)
      }
    }

    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  useEffect(() => {
    setMobileMenu(false)
    setLangOpen(false)
  }, [location.pathname, location.hash])

  const currentLang = LANGUAGES.find((language) => language.code === i18n.language) || LANGUAGES[0]

  function anchorHref(anchor) {
    return location.pathname === '/' ? `#${anchor}` : `/#${anchor}`
  }

  function closeMenus() {
    setMobileMenu(false)
    setLangOpen(false)
  }

  return (
    <div className="app">
      <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav__inner container">
          <Link to="/" className="nav__logo" onClick={closeMenus}>
            <img src="/images/brand/logo.png" alt="SoloBeauté" />
            <span>SoloBeauté</span>
          </Link>

          <div className={`nav__links ${mobileMenu ? 'nav__links--open' : ''}`}>
            <a href={anchorHref('features')} onClick={closeMenus}>{t('nav.features')}</a>
            <a href={anchorHref('how-it-works')} onClick={closeMenus}>{t('nav.howItWorks')}</a>
            <a href={anchorHref('about')} onClick={closeMenus}>{t('nav.about')}</a>
          </div>

          <div className="nav__right">
            <div className="lang-picker" ref={langRef}>
              <button className="nav__lang" onClick={() => setLangOpen((open) => !open)}>
                <GlobeIcon />
                <span>{currentLang.short}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {langOpen && (
                <div className="lang-dropdown">
                  {LANGUAGES.map((language) => (
                    <button
                      key={language.code}
                      className={`lang-dropdown__item ${language.code === i18n.language ? 'lang-dropdown__item--active' : ''}`}
                      onClick={() => {
                        i18n.changeLanguage(language.code)
                        setLangOpen(false)
                      }}
                    >
                      {language.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <a href="https://apps.apple.com/tw/app/solobeaute/id6760957242" target="_blank" rel="noopener noreferrer" className="btn-primary btn--sm" onClick={closeMenus}>
              {t('nav.download')}
            </a>
          </div>

          <button
            className={`hamburger ${mobileMenu ? 'hamburger--open' : ''}`}
            onClick={() => setMobileMenu((open) => !open)}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {children}

      <footer className="footer">
        <div className="container">
          <div className="footer__inner">
            <div className="footer__brand">
              <img src="/images/brand/logo.png" alt="" className="footer__logo" />
              <div>
                <span className="footer__name">SoloBeauté</span>
                <span className="footer__slogan">{t('footer.slogan')}</span>
              </div>
            </div>
            <div className="footer__links">
              <Link to="/privacy">{t('footer.legal')}</Link>
              <Link to="/terms">{t('footer.terms')}</Link>
              <Link to="/support">{t('footer.contact')}</Link>
            </div>
          </div>
          <p className="footer__copy">{t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  )
}
