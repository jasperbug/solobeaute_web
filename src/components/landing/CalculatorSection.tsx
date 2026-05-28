'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import { APP_STORE_URL } from '@/lib/constants'
import { CalendarIcon, HomeIcon, ScissorsIcon, StarIcon, AppleIcon } from '../ui/Icons'
import { Reveal } from '../ui/Reveal'

type SpaceType = 'chair' | 'room' | 'nailDesk' | 'studio'

interface SpaceConfig {
  key: SpaceType
  hourlyRate: number
  icon: React.ReactNode
}

export function CalculatorSection() {
  const t = useTranslations('calculator')
  const locale = useLocale()
  
  const [spaceType, setSpaceType] = useState<SpaceType>('chair')
  const [hours, setHours] = useState<number>(15)

  const spaces: SpaceConfig[] = [
    { key: 'chair', hourlyRate: 180, icon: <ScissorsIcon className="h-5 w-5" /> },
    { key: 'room', hourlyRate: 250, icon: <HomeIcon className="h-5 w-5" /> },
    { key: 'nailDesk', hourlyRate: 150, icon: <StarIcon className="h-5 w-5" /> },
    { key: 'studio', hourlyRate: 500, icon: <CalendarIcon className="h-5 w-5" /> },
  ]

  const activeSpace = spaces.find((s) => s.key === spaceType) ?? spaces[0]
  const hourlyRate = activeSpace.hourlyRate

  // Calculation: Hourly Rate * Hours per week * 4.33 weeks per month
  const monthlyEarnings = Math.round(hourlyRate * hours * 4.33)

  const formatIncome = (amount: number) => {
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'zh-TW', {
      style: 'currency',
      currency: 'TWD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <section className="calc-sec" id="calculator">
      <div className="calc-sec__inner container">
        <div className="calc-sec__title-block">
          <Reveal>
            <p className="section-tag">{t('sectionTag')}</p>
            <h2 className="section-title">{t('title')}</h2>
            <p className="calc-sec__subtitle">{t('subtitle')}</p>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="calc-card">
            {/* Space Type Selector */}
            <div className="calc-sec__group">
              <span className="calc-sec__label">{t('spaceLabel')}</span>
              <div className="calc-grid">
                {spaces.map((space) => (
                  <button
                    key={space.key}
                    type="button"
                    onClick={() => setSpaceType(space.key)}
                    className={`calc-type-btn ${spaceType === space.key ? 'calc-type-btn--active' : ''}`}
                  >
                    <div className="calc-type-btn__icon-wrap">
                      {space.icon}
                    </div>
                    <span className="calc-type-btn__name">
                      {t(`types.${space.key}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hours Range Slider */}
            <div className="calc-sec__group">
              <div className="slider-container">
                <div className="slider-header">
                  <span className="calc-sec__label">{t('hoursLabel')}</span>
                  <span className="slider-value">
                    {hours} <span className="text-xs text-[var(--fg-3)] font-sans">{t('hoursUnit')}</span>
                  </span>
                </div>
                <div className="slider-input-wrap">
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={hours}
                    onChange={(event) => setHours(Number(event.target.value))}
                    className="calc-slider"
                    aria-label={t('hoursLabel')}
                  />
                </div>
              </div>
            </div>

            {/* Estimated Dynamic Results */}
            <div className="calc-result">
              <div className="space-y-1">
                <p className="calc-result__label">{t('resultTitle')}</p>
                <p className="text-xs text-[var(--fg-3)]">
                  {t(`types.${spaceType}`)} · NT${hourlyRate}/hr · {hours}hr/wk
                </p>
              </div>
              <div className="calc-result__value">
                {formatIncome(monthlyEarnings)}
                <span className="calc-result__value-suffix"> / {locale === 'en' ? 'mo' : '月'}</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.25}>
          <div className="calc-bottom">
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
              <AppleIcon className="h-[18px] w-[18px]" />
              {t('cta')}
            </a>
            <p className="calc-hint">{t('hint')}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
