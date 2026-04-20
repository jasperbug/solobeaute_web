'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef } from 'react'

type LightboxItem = {
  src: string
  alt: string
  caption?: string
}

type ImageLightboxProps = {
  items: ReadonlyArray<LightboxItem>
  activeIndex: number | null
  onClose: () => void
  onChange: (index: number) => void
}

export function ImageLightbox({ items, activeIndex, onClose, onChange }: ImageLightboxProps) {
  const t = useTranslations('common')
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const isOpen = activeIndex !== null

  const showPrevious = useCallback(() => {
    if (activeIndex === null || activeIndex <= 0) return
    onChange(activeIndex - 1)
  }, [activeIndex, onChange])

  const showNext = useCallback(() => {
    if (activeIndex === null || activeIndex >= items.length - 1) return
    onChange(activeIndex + 1)
  }, [activeIndex, items.length, onChange])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    const focusId = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus()
    })

    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        showPrevious()
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        showNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      window.cancelAnimationFrame(focusId)
    }
  }, [isOpen, onClose, showNext, showPrevious])

  if (!isOpen || activeIndex === null) {
    return null
  }

  const item = items[activeIndex]
  const hasPrevious = activeIndex > 0
  const hasNext = activeIndex < items.length - 1

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={item.alt} onClick={onClose}>
      <div className="lightbox__inner" onClick={(event) => event.stopPropagation()}>
        <div className="lightbox__topbar">
          <span className="lightbox__counter">
            {t('previewCount', { current: activeIndex + 1, total: items.length })}
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="lightbox__close"
            aria-label={t('closePreview')}
          >
            ×
          </button>
        </div>

        {items.length > 1 ? (
          <button
            type="button"
            onClick={showPrevious}
            disabled={!hasPrevious}
            className="lightbox__nav lightbox__nav--prev"
            aria-label={t('previousPreview')}
          >
            ←
          </button>
        ) : null}

        <div className="lightbox__content">
          <div className="phone-frame phone-frame--lightbox">
            <div className="phone-frame__screen">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                priority
                sizes="(max-width: 768px) 85vw, 360px"
                className="lightbox__image"
              />
            </div>
          </div>
          {item.caption ? <p className="lightbox__caption">{item.caption}</p> : null}
        </div>

        {items.length > 1 ? (
          <button
            type="button"
            onClick={showNext}
            disabled={!hasNext}
            className="lightbox__nav lightbox__nav--next"
            aria-label={t('nextPreview')}
          >
            →
          </button>
        ) : null}
      </div>
    </div>
  )
}
