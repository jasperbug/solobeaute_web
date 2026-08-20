'use client'

import { useTranslations } from 'next-intl'

import { Reveal } from '../ui/Reveal'
import { StoreButtons } from '../ui/StoreButtons'

export function CtaSection() {
  const t = useTranslations('cta')

  return (
    <section className="cta" id="download">
      <div className="container">
        <Reveal>
          <div className="cta__inner">
            <p className="cta__tag">{t('tag')}</p>
            <h2 className="cta__title">{t('title')}</h2>
            <p className="cta__sub">{t('subtitle')}</p>
            <StoreButtons buttonClassName="btn-light" />
            <p className="cta__hint">{t('platformHint')}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
