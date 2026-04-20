'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { ImageLightbox } from '../ui/ImageLightbox'
import { PhoneFrame } from '../ui/PhoneFrame'
import { Reveal } from '../ui/Reveal'

const featureVisuals = {
  filter: '/images/app-screenshots/filter.PNG',
  map: '/images/app-screenshots/map_fixed.PNG',
  message: '/images/app-screenshots/IMG_2490_fixed.PNG',
  booking: '/images/app-screenshots/IMG_2489.PNG',
} as const

const featureOrder = ['filter', 'map', 'message', 'booking'] as const

type FeatureKey = (typeof featureOrder)[number]

type FeatureCopy = {
  tag: string
  title: string
  desc: string
}

export function FeaturesSection() {
  const t = useTranslations('features')
  const tCommon = useTranslations('common')
  const itemsByKey = t.raw('items') as Record<FeatureKey, FeatureCopy>
  const [activePreview, setActivePreview] = useState<number | null>(null)
  const items = featureOrder.map((key) => ({
    key,
    ...itemsByKey[key],
    src: featureVisuals[key],
  }))
  const previewItems = items.map((item) => ({
    src: item.src,
    alt: item.title,
    caption: item.tag,
  }))

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
                  <PhoneFrame
                    src={item.src}
                    alt={item.title}
                    onClick={() => setActivePreview(index)}
                    buttonLabel={`${tCommon('openPreview')} · ${item.title}`}
                    stackClassName="feat__phone-wrap"
                    frameClassName="feat__phone-frame"
                  />
                </div>
                <div className="feat__content">
                  <span className="feat__tag">{item.tag}</span>
                  <h3 className="feat__name">{item.title}</h3>
                  <p className="feat__desc">{item.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <ImageLightbox
          items={previewItems}
          activeIndex={activePreview}
          onClose={() => setActivePreview(null)}
          onChange={setActivePreview}
        />
      </div>
    </section>
  )
}
