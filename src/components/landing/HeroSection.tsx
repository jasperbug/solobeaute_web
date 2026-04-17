'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

import { APP_STORE_URL } from '@/lib/constants'
import { AppleIcon, ArrowRightIcon } from '../ui/Icons'
import { Reveal } from '../ui/Reveal'

const heroShots = {
  list: '/images/app-screenshots/list.PNG',
  map: '/images/app-screenshots/map_fixed.PNG',
  ar3d: '/images/app-screenshots/IMG_2486.PNG',
}

// Index of the image shown on initial mobile render. Keep this in sync with the
// `priority` prop below so the mobile LCP image is pre-loaded.
const HERO_INITIAL_SLIDE = 1

export function HeroSection() {
  const t = useTranslations()
  const [heroHover, setHeroHover] = useState<string | null>(null)
  const [heroSlide, setHeroSlide] = useState(HERO_INITIAL_SLIDE)
  const touchStart = useRef<number | null>(null)

  return (
    <section className="hero">
      <div className="hero__inner container">
        <Reveal>
          <p className="hero__label">{t('hero.tagline')}</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="hero__title">
            {t('hero.title1')}
            <br />
            <span className="hero__accent">{t('hero.title2')}</span>
          </h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="hero__desc whitespace-pre-line">{t('hero.subtitle')}</p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="hero__actions">
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
              <AppleIcon className="h-[18px] w-[18px]" />
              {t('hero.cta')}
            </a>
            <a href="#features" className="btn-ghost">
              {t('nav.features')}
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.3} className="hero__showcase">
          <div className="hero__phones hero__phones--desktop" onMouseLeave={() => setHeroHover(null)}>
            {[
              { key: 'left', src: heroShots.list, alt: 'Space List' },
              { key: 'center', src: heroShots.map, alt: 'Map View' },
              { key: 'right', src: heroShots.ar3d, alt: '3D Tour' },
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
                  <Image
                    src={src}
                    alt={alt}
                    width={240}
                    height={520}
                    priority={key === 'center'}
                    sizes="(max-width: 768px) 80vw, 260px"
                  />
                </div>
              )
            })}
          </div>

          <div
            className="hero__carousel"
            onTouchStart={(event) => {
              touchStart.current = event.touches[0]?.clientX ?? null
            }}
            onTouchEnd={(event) => {
              if (touchStart.current === null) return
              const diff = touchStart.current - event.changedTouches[0].clientX
              if (Math.abs(diff) > 50) {
                setHeroSlide((prev) => (diff > 0 ? Math.min(prev + 1, 2) : Math.max(prev - 1, 0)))
              }
              touchStart.current = null
            }}
          >
            <div className="hero__track" style={{ transform: `translateX(-${heroSlide * 100}%)` }}>
              {Object.values(heroShots).map((src, index) => (
                <div key={src} className="hero__slide">
                  <div className="phone-frame">
                    <Image
                      src={src}
                      alt={`Hero screenshot ${index + 1}`}
                      width={260}
                      height={540}
                      priority={index === HERO_INITIAL_SLIDE}
                      sizes="(max-width: 768px) 80vw, 260px"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="hero__dots">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  className={`hero__dot ${heroSlide === index ? 'hero__dot--active' : ''}`}
                  onClick={() => setHeroSlide(index)}
                  type="button"
                />
              ))}
            </div>
          </div>

          <div className="hero__glow" />
        </Reveal>
      </div>
    </section>
  )
}
