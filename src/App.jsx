import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { LANGUAGES } from './i18n'
import './App.css'

/* ── Subtle fade-in (Adaline-style: minimal, precise) ── */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ── Screenshots mapping ── */
const shots = {
  map: '/images/app-screenshots/IMG_2379.PNG',
  list: '/images/app-screenshots/IMG_2378.PNG',
  filter: '/images/app-screenshots/IMG_2380.PNG',
  chat: '/images/app-screenshots/IMG_2381.PNG',
  profile: '/images/app-screenshots/IMG_2378.PNG',
  bookingList: '/images/app-screenshots/IMG_2383.PNG',
  bookingCal: '/images/app-screenshots/IMG_2384.PNG',
}

/* ── Icons (minimal stroke) ── */
const Icon = {
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  scissors: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>,
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  map: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  filter: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  chat: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  calendar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  globe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  apple: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
}

const featureIcons = [Icon.map, Icon.filter, Icon.chat, Icon.calendar]
const featureShots = [shots.map, shots.filter, shots.chat, shots.bookingCal]

/* ======================================== */
export default function App() {
  const { t, i18n } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [heroHover, setHeroHover] = useState(null)
  const langRef = useRef(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const fn = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  return (
    <div className="app">

      {/* ── NAV ── */}
      <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav__inner container">
          <a href="#" className="nav__logo">
            <img src="/images/brand/logo.png" alt="SoloBeauté" />
            <span>SoloBeauté</span>
          </a>
          <div className={`nav__links ${mobileMenu ? 'nav__links--open' : ''}`}>
            <a href="#features" onClick={() => setMobileMenu(false)}>{t('nav.features')}</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)}>{t('nav.howItWorks')}</a>
            <a href="#about" onClick={() => setMobileMenu(false)}>{t('nav.about')}</a>
          </div>
          <div className="nav__right">
            <div className="lang-picker" ref={langRef}>
              <button className="nav__lang" onClick={() => setLangOpen(!langOpen)}>
                {Icon.globe}
                <span>{currentLang.short}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {langOpen && (
                <div className="lang-dropdown">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      className={`lang-dropdown__item ${l.code === i18n.language ? 'lang-dropdown__item--active' : ''}`}
                      onClick={() => { i18n.changeLanguage(l.code); setLangOpen(false) }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <a href="#download" className="btn-primary btn--sm">{t('nav.download')}</a>
          </div>
          <button className={`hamburger ${mobileMenu ? 'hamburger--open' : ''}`} onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero__inner container">
          <Reveal>
            <p className="hero__label">{t('hero.tagline')}</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="hero__title">
              {t('hero.title1')}<br />
              <span className="hero__accent">{t('hero.title2')}</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="hero__desc">{t('hero.subtitle')}</p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="hero__actions">
              <a href="#download" className="btn-primary">{Icon.apple}{t('hero.cta')}</a>
              <a href="#features" className="btn-ghost">{t('nav.features')}{Icon.arrow}</a>
            </div>
          </Reveal>

          <Reveal delay={0.3} className="hero__showcase">
            <div className="hero__phones" onMouseLeave={() => setHeroHover(null)}>
              {[
                { key: 'left', src: shots.list, alt: 'Space List' },
                { key: 'center', src: shots.map, alt: 'Map View' },
                { key: 'right', src: shots.bookingCal, alt: 'Calendar' },
              ].map(({ key, src, alt }) => {
                const isHovered = heroHover === key
                const hasHover = heroHover !== null
                const isDefault = !hasHover && key === 'center'
                const isActive = isHovered || isDefault
                return (
                  <div
                    key={key}
                    className={`phone-frame hero__phone hero__phone--${key} ${isActive ? 'hero__phone--active' : ''} ${hasHover && !isHovered ? 'hero__phone--faded' : ''} ${isDefault ? 'hero__phone--default' : ''}`}
                    onMouseEnter={() => setHeroHover(key)}
                  >
                    <img src={src} alt={alt} />
                  </div>
                )
              })}
            </div>
            <div className="hero__glow" />
          </Reveal>
        </div>
      </section>

      {/* ── ECOSYSTEM ── */}
      <section className="eco">
        <div className="container">
          <Reveal>
            <p className="section-tag">{t('ecosystem.sectionTag')}</p>
            <h2 className="section-title">{t('ecosystem.title')}</h2>
            <p className="section-subtitle">{t('ecosystem.subtitle')}</p>
          </Reveal>

          <div className="eco__grid">
            {['host', 'beautician', 'consumer'].map((role, i) => (
              <Reveal key={role} delay={i * 0.1}>
                <div className="eco__card">
                  <div className="eco__card-top">
                    <div className={`eco__icon eco__icon--${role}`}>
                      {role === 'host' ? Icon.home : role === 'beautician' ? Icon.scissors : Icon.users}
                    </div>
                    <div>
                      <h3 className="eco__role">{t(`ecosystem.${role}.role`)}</h3>
                      {role === 'consumer' && <span className="eco__badge">{t('ecosystem.consumer.badge')}</span>}
                    </div>
                  </div>
                  <p className="eco__pain">{t(`ecosystem.${role}.pain`)}</p>
                  <div className="eco__divider" />
                  <p className="eco__solution">{t(`ecosystem.${role}.solution`)}</p>
                  <p className="eco__desc">{t(`ecosystem.${role}.desc`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="feat" id="features">
        <div className="container">
          <Reveal>
            <p className="section-tag">{t('features.sectionTag')}</p>
            <h2 className="section-title">{t('features.title')}</h2>
          </Reveal>

          <div className="feat__list">
            {[0, 1, 2, 3].map((i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className={`feat__item ${i % 2 === 1 ? 'feat__item--reverse' : ''}`}>
                  <div className="feat__visual">
                    <div className="feat__phone-wrap">
                      <div className="phone-frame">
                        <img src={featureShots[i]} alt={t(`features.items.${i}.title`)} />
                      </div>
                    </div>
                  </div>
                  <div className="feat__content">
                    <div className="feat__icon">{featureIcons[i]}</div>
                    <h3 className="feat__name">{t(`features.items.${i}.title`)}</h3>
                    <p className="feat__desc">{t(`features.items.${i}.desc`)}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <HowItWorks t={t} />

      {/* ── ABOUT ── */}
      <section className="about" id="about">
        <div className="container">
          <div className="about__inner">
            <Reveal>
              <p className="section-tag">{t('about.sectionTag')}</p>
              <h2 className="about__title">{t('about.title')}</h2>
              <p className="about__desc">{t('about.desc')}</p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="about__founder">
                <div className="about__avatar">J</div>
                <div>
                  <p className="about__name">{t('about.founder')}</p>
                  <p className="about__bio">{t('about.founderDesc')}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta" id="download">
        <div className="container">
          <Reveal>
            <div className="cta__inner">
              <img src="/images/brand/logo.png" alt="SoloBeauté" className="cta__logo" />
              <h2 className="cta__title">{t('cta.title')}</h2>
              <p className="cta__sub">{t('cta.subtitle')}</p>
              <a href="#" className="btn-primary btn--lg">{Icon.apple}{t('cta.button')}</a>
              <p className="cta__hint">{t('cta.iosHint')}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
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
              <a href="#">{t('footer.legal')}</a>
              <a href="#">{t('footer.terms')}</a>
              <a href="mailto:hello@solobeaute.com">{t('footer.contact')}</a>
            </div>
          </div>
          <p className="footer__copy">{t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  )
}

/* ── How It Works ── */
function HowItWorks({ t }) {
  const [tab, setTab] = useState('host')
  const steps = tab === 'host'
    ? t('howItWorks.hostSteps', { returnObjects: true })
    : t('howItWorks.beauticianSteps', { returnObjects: true })
  const stepShots = tab === 'host'
    ? [shots.profile, shots.bookingList, shots.bookingCal]
    : [shots.map, shots.list, shots.bookingCal]

  return (
    <section className="hiw" id="how-it-works">
      <div className="container">
        <Reveal>
          <p className="section-tag">{t('howItWorks.sectionTag')}</p>
          <h2 className="section-title">{t('howItWorks.title')}</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="hiw__tabs">
            <button className={`hiw__tab ${tab === 'host' ? 'hiw__tab--active' : ''}`} onClick={() => setTab('host')}>
              {Icon.home}{t('howItWorks.hostTab')}
            </button>
            <button className={`hiw__tab ${tab === 'beautician' ? 'hiw__tab--active' : ''}`} onClick={() => setTab('beautician')}>
              {Icon.scissors}{t('howItWorks.beauticianTab')}
            </button>
          </div>
        </Reveal>
        <AnimatePresence mode="wait">
          <motion.div key={tab} className="hiw__steps" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            {steps.map((s, i) => (
              <div className="hiw__step" key={i}>
                <span className="hiw__num">{s.step}</span>
                <div className="hiw__phone">
                  <div className="phone-frame phone-frame--sm">
                    <img src={stepShots[i]} alt={s.title} />
                  </div>
                </div>
                <h3 className="hiw__step-title">{s.title}</h3>
                <p className="hiw__step-desc">{s.desc}</p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
