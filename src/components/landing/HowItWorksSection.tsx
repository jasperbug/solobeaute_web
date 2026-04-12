'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { HomeIcon, ScissorsIcon } from '../ui/Icons'
import { Reveal } from '../ui/Reveal'

const hostShots = [
  '/images/app-screenshots/IMG_2482.PNG',
  '/images/app-screenshots/IMG_2485.PNG',
  '/images/app-screenshots/IMG_2491.PNG',
]

const beauticianShots = [
  '/images/app-screenshots/map_fixed.PNG',
  '/images/app-screenshots/list.PNG',
  '/images/app-screenshots/IMG_2489.PNG',
]

type StepItem = {
  step: string
  title: string
  desc: string
}

export function HowItWorksSection() {
  const t = useTranslations('howItWorks')
  const [tab, setTab] = useState<'host' | 'beautician'>('host')

  const steps = (
    tab === 'host'
      ? t.raw('hostSteps')
      : t.raw('beauticianSteps')
  ) as StepItem[]

  const screenshots = tab === 'host' ? hostShots : beauticianShots

  return (
    <section className="hiw" id="how-it-works">
      <div className="container">
        <Reveal>
          <p className="section-tag">{t('sectionTag')}</p>
          <h2 className="section-title">{t('title')}</h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="hiw__tabs">
            <button className={`hiw__tab ${tab === 'host' ? 'hiw__tab--active' : ''}`} onClick={() => setTab('host')} type="button">
              <HomeIcon className="h-5 w-5" />
              {t('hostTab')}
            </button>
            <button className={`hiw__tab ${tab === 'beautician' ? 'hiw__tab--active' : ''}`} onClick={() => setTab('beautician')} type="button">
              <ScissorsIcon className="h-5 w-5" />
              {t('beauticianTab')}
            </button>
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            className="hiw__steps"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {steps.map((step, index) => (
              <div className="hiw__step" key={step.title}>
                <span className="hiw__num">{step.step}</span>
                <div className="hiw__phone">
                  <div className="phone-frame phone-frame--sm">
                    <Image src={screenshots[index] ?? screenshots[0]} alt={step.title} width={180} height={380} />
                  </div>
                </div>
                <h3 className="hiw__step-title">{step.title}</h3>
                <p className="hiw__step-desc">{step.desc}</p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
