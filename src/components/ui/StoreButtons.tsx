'use client'

import { useTranslations } from 'next-intl'

import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/constants'
import { AppleIcon, GooglePlayIcon } from './Icons'

type StoreButtonsProps = {
  /** Button class applied to both store links, e.g. `btn-primary` or `btn-light`. */
  buttonClassName: string
  /** Extra class for the wrapping row. */
  className?: string
}

/**
 * Side-by-side App Store + Google Play download links. The row wraps instead of
 * overflowing, so it degrades to a stack on narrow screens.
 */
export function StoreButtons({ buttonClassName, className }: StoreButtonsProps) {
  const t = useTranslations('common')

  return (
    <div className={className ? `store-actions ${className}` : 'store-actions'}>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClassName}
        aria-label={t('appStoreAria')}
      >
        <AppleIcon className="h-[18px] w-[18px]" aria-hidden="true" focusable="false" />
        {t('appStore')}
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClassName}
        aria-label={t('googlePlayAria')}
      >
        <GooglePlayIcon className="h-[18px] w-[18px]" aria-hidden="true" focusable="false" />
        {t('googlePlay')}
      </a>
    </div>
  )
}
