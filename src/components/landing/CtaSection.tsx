'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { APP_STORE_URL } from '@/lib/constants'
import { AppleIcon } from '../ui/Icons'
import { Reveal } from '../ui/Reveal'

export function CtaSection() {
  const t = useTranslations('cta')

  return (
    <section className="cta" id="download">
      <div className="container">
        <Reveal>
          <div className="cta__inner">
            <Image src="/images/brand/logo.png" alt="SoloBeauté" className="cta__logo" width={52} height={52} />
            <h2 className="cta__title">{t('title')}</h2>
            <p className="cta__sub">{t('subtitle')}</p>
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary btn--lg">
              <AppleIcon className="h-[18px] w-[18px]" />
              {t('button')}
            </a>
            <p className="cta__hint">{t('iosHint')}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
