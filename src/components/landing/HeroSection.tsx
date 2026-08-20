'use client'

import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

import { ArrowRightIcon } from '../ui/Icons'
import { ImageLightbox } from '../ui/ImageLightbox'
import { PhoneFrame } from '../ui/PhoneFrame'
import { Reveal } from '../ui/Reveal'
import { StoreButtons } from '../ui/StoreButtons'

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
  const [heroSlide, setHeroSlide] = useState(HERO_INITIAL_SLIDE)
  const [activePreview, setActivePreview] = useState<number | null>(null)
  const touchStart = useRef<number | null>(null)
  const desktopShots = [
    { key: 'left', src: heroShots.list, alt: t('hero.listAlt'), caption: t('hero.listCaption') },
    { key: 'center', src: heroShots.map, alt: t('hero.mapAlt'), caption: t('hero.mapCaption') },
    { key: 'right', src: heroShots.ar3d, alt: t('hero.arAlt'), caption: t('hero.arCaption') },
  ] as const

  const handleScrollAndSwitchTab = (targetTab: 'host' | 'beautician') => {
    const el = document.getElementById('how-it-works')
    if (!el) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
    // Let HowItWorksSection know it should switch tab (kept coupled to the scroll)
    window.dispatchEvent(new CustomEvent('switch-hiw-tab', { detail: targetTab }))
  }

  return (
    <section className="hero">
      <div className="hero__inner container">
        <div className="hero__intro">
          <Reveal>
            <p className="hero__label">{t('hero.kicker')}</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="hero__title">
              <span className="hero__title-line">{t('hero.title1')}</span>
              <em className="hero__title-line hero__accent">{t('hero.title2')}</em>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="hero__promise">
              <span>{t('hero.promiseLine1')}</span>
              <span>{t('hero.promiseLine2')}</span>
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <p className="hero__desc">{t('hero.detail')}</p>
          </Reveal>
        </div>

        <Reveal delay={0.32} className="hero__lower">
          <div className="hero__actions flex flex-wrap gap-4 items-center">
            <StoreButtons buttonClassName="btn-primary" />
            <button
              onClick={() => handleScrollAndSwitchTab('beautician')}
              className="btn-ghost"
              type="button"
            >
              {t('hero.proCta')}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleScrollAndSwitchTab('host')}
              className="btn-ghost"
              type="button"
            >
              {t('hero.hostCta')}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.4} className="hero__showcase">
          <div className="hero__phones hero__phones--desktop">
            {desktopShots.map(({ key, src, alt, caption }, index) => (
              <PhoneFrame
                key={key}
                src={src}
                alt={alt}
                caption={caption}
                priority={key === 'center'}
                onClick={() => setActivePreview(index)}
                buttonLabel={`${t('common.openPreview')} · ${caption}`}
                stackClassName={`hero__phone-block hero__phone-block--${key}`}
                frameClassName="hero__phone-frame"
                captionClassName="hero__phone-caption"
              />
            ))}
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
              {desktopShots.map(({ src, alt, caption }, index) => (
                <PhoneFrame
                  key={src}
                  src={src}
                  alt={alt}
                  caption={caption}
                  priority={index === HERO_INITIAL_SLIDE}
                  onClick={() => setActivePreview(index)}
                  buttonLabel={`${t('common.openPreview')} · ${caption}`}
                  stackClassName="hero__slide"
                  captionClassName="hero__phone-caption"
                />
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

        <ImageLightbox
          items={desktopShots}
          activeIndex={activePreview}
          onClose={() => setActivePreview(null)}
          onChange={setActivePreview}
        />
      </div>
    </section>
  )
}
