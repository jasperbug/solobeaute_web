'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import Link from 'next/link'

import { HomeIcon, ScissorsIcon, StarIcon, DownloadIcon } from '../ui/Icons'
import { Reveal } from '../ui/Reveal'

type SpaceType = 'open' | 'curtain' | 'private'

interface SpaceConfig {
  key: SpaceType
  hourlyRate: number
  icon: React.ReactNode
}

// Static config — hoisted to module scope so the icon elements aren't
// re-instantiated on every render. Icons are decorative (aria-hidden).
//
// Rates are the MEDIAN listed hourly rate of the spaces actually on the
// platform, grouped by Space.spaceType (GET /api/v1/spaces, 15 listings,
// sampled 2026-08-23): OPEN_SPACE n=7 → 170, CURTAIN_PARTITION n=5 → 200,
// PRIVATE_ROOM n=3 → 220. Platform-wide range is NT$100–350.
// Keep these in sync with the `calculator.hint` copy when re-sampling.
const SPACES: SpaceConfig[] = [
  { key: 'open', hourlyRate: 170, icon: <ScissorsIcon className="h-5 w-5" aria-hidden /> },
  { key: 'curtain', hourlyRate: 200, icon: <StarIcon className="h-5 w-5" aria-hidden /> },
  { key: 'private', hourlyRate: 220, icon: <HomeIcon className="h-5 w-5" aria-hidden /> },
]

export function CalculatorSection() {
  const t = useTranslations('calculator')

  const [spaceType, setSpaceType] = useState<SpaceType>('open')
  const [hours, setHours] = useState<number>(15)

  const activeSpace = SPACES.find((s) => s.key === spaceType) ?? SPACES[0]
  const hourlyRate = activeSpace.hourlyRate

  // Calculation: Hourly Rate * Hours per week * 4.33 weeks per month
  const monthlyEarnings = Math.round(hourlyRate * hours * 4.33)

  const formatIncome = (amount: number) => {
    // Always prefix an explicit "NT$" so the headline figure is unambiguous and
    // matches the "NT$.../hr" detail line. (Intl currency:'TWD' renders a bare
    // "$" under the zh-TW locale, which reads like USD to Taiwanese users.)
    return `NT$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)}`
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
                {SPACES.map((space) => (
                  <button
                    key={space.key}
                    type="button"
                    onClick={() => setSpaceType(space.key)}
                    aria-pressed={spaceType === space.key}
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
                    {hours} <span className="text-xs text-[var(--fg-2)] font-sans">{t('hoursUnit')}</span>
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
                <p className="text-xs text-[var(--fg-2)]">
                  {t(`types.${spaceType}`)} · {t('rateDetail', { rate: hourlyRate, hours })}
                </p>
              </div>
              <div className="calc-result__value" aria-live="polite" aria-atomic="true">
                {formatIncome(monthlyEarnings)}
                <span className="calc-result__value-suffix"> / {t('perMonth')}</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.25}>
          <div className="calc-bottom">
            <Link href="#download" className="btn-primary">
              <DownloadIcon className="h-[18px] w-[18px]" aria-hidden="true" focusable="false" />
              {t('cta')}
            </Link>
            <p className="calc-hint">{t('hint')}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
