'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { CalendarIcon, ChatIcon, FilterIcon, MapIcon } from '../ui/Icons'
import { Reveal } from '../ui/Reveal'

const featureIcons = [
  <MapIcon key="map" className="h-5 w-5" />,
  <FilterIcon key="filter" className="h-5 w-5" />,
  <ChatIcon key="chat" className="h-5 w-5" />,
  <CalendarIcon key="calendar" className="h-5 w-5" />,
]

const featureShots = [
  '/images/app-screenshots/map_fixed.PNG',
  '/images/app-screenshots/filter.PNG',
  '/images/app-screenshots/IMG_2490_fixed.PNG',
  '/images/app-screenshots/IMG_2489.PNG',
]

type FeatureItem = {
  title: string
  desc: string
}

export function FeaturesSection() {
  const t = useTranslations('features')
  const items = t.raw('items') as FeatureItem[]

  return (
    <section className="feat" id="features">
      <div className="container">
        <Reveal>
          <p className="section-tag">{t('sectionTag')}</p>
          <h2 className="section-title">{t('title')}</h2>
        </Reveal>

        <div className="feat__list">
          {items.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.08}>
              <div className={`feat__item ${index % 2 === 1 ? 'feat__item--reverse' : ''}`}>
                <div className="feat__visual">
                  <div className="feat__phone-wrap">
                    <div className="phone-frame">
                      <Image src={featureShots[index] ?? featureShots[0]} alt={item.title} width={260} height={540} />
                    </div>
                  </div>
                </div>
                <div className="feat__content">
                  <div className="feat__icon">{featureIcons[index]}</div>
                  <h3 className="feat__name">{item.title}</h3>
                  <p className="feat__desc">{item.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
