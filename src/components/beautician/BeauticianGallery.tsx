'use client'

import type { TouchEvent } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

type BeauticianGalleryProps = {
  images: string[]
  displayName: string
}

const SWIPE_THRESHOLD = 48

function navButtonClassName(isEdge = false) {
  const baseClassName = 'inline-flex h-11 min-w-11 items-center justify-center rounded-lg border px-4 text-sm font-medium transition'

  if (isEdge) {
    return `${baseClassName} cursor-not-allowed border-white/10 bg-white/5 text-white/35`
  }

  return `${baseClassName} border-white/15 bg-black/45 text-white hover:border-white/30 hover:bg-black/65`
}

export function BeauticianGallery({ images, displayName }: BeauticianGalleryProps) {
  const t = useTranslations('beautician')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([])
  const touchStartXRef = useRef<number | null>(null)
  const lastFocusedIndexRef = useRef<number | null>(null)
  const isOpen = activeIndex !== null
  const activeImage = activeIndex !== null ? images[activeIndex] : null
  const hasPrevious = activeIndex !== null && activeIndex > 0
  const hasNext = activeIndex !== null && activeIndex < images.length - 1

  function openViewer(index: number) {
    lastFocusedIndexRef.current = index
    setActiveIndex(index)
  }

  function closeViewer() {
    setActiveIndex(null)
  }

  function showPrevious() {
    setActiveIndex((current) => {
      if (current === null || current <= 0) {
        return current
      }

      return current - 1
    })
  }

  function showNext() {
    setActiveIndex((current) => {
      if (current === null || current >= images.length - 1) {
        return current
      }

      return current + 1
    })
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartXRef.current === null || images.length <= 1) {
      return
    }

    const endX = event.changedTouches[0]?.clientX ?? touchStartXRef.current
    const deltaX = endX - touchStartXRef.current
    touchStartXRef.current = null

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) {
      return
    }

    if (deltaX > 0) {
      showPrevious()
      return
    }

    showNext()
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus()
    })

    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeViewer()
        return
      }

      if (images.length <= 1) {
        return
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
      window.cancelAnimationFrame(focusFrame)

      const triggerIndex = lastFocusedIndexRef.current
      if (triggerIndex !== null) {
        triggerRefs.current[triggerIndex]?.focus()
      }
    }
  }, [images.length, isOpen])

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {images.map((image, index) => (
          <button
            key={image}
            ref={(node) => {
              triggerRefs.current[index] = node
            }}
            type="button"
            onClick={() => openViewer(index)}
            className="group relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-xl bg-black/5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
            aria-label={`${t('openImage')} ${index + 1}`}
          >
            <Image
              src={image}
              alt={displayName}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
            />
            <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10" aria-hidden="true" />
            <span className="sr-only">{t('openImage')}</span>
          </button>
        ))}
      </div>

      {isOpen && activeImage ? (
        <div
          className="fixed inset-0 z-[70] bg-black/85"
          role="dialog"
          aria-modal="true"
          aria-label={displayName}
          onClick={closeViewer}
        >
          <div
            className="relative flex h-full w-full items-center justify-center px-4 pb-6 pt-20 sm:px-6 lg:px-10"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute left-4 top-4 text-sm font-medium text-white/75 sm:left-6 lg:left-10">
              {t('imageCount', { current: activeIndex + 1, total: images.length })}
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeViewer}
              className="absolute right-4 top-4 inline-flex h-11 min-w-11 items-center justify-center rounded-lg border border-white/15 bg-black/45 px-4 text-white transition hover:border-white/30 hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:right-6 lg:right-10"
              aria-label={t('closeViewer')}
            >
              <span aria-hidden="true" className="text-2xl leading-none">×</span>
            </button>

            {images.length > 1 ? (
              <button
                type="button"
                onClick={showPrevious}
                disabled={!hasPrevious}
                className={`absolute left-4 top-1/2 -translate-y-1/2 sm:left-6 lg:left-10 ${navButtonClassName(!hasPrevious)}`}
                aria-label={t('previousImage')}
              >
                <span aria-hidden="true" className="text-lg leading-none">←</span>
              </button>
            ) : null}

            <div
              className="relative h-[min(72vh,820px)] min-h-[320px] w-full max-w-5xl overflow-hidden rounded-xl bg-white/5"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Image
                src={activeImage}
                alt={displayName}
                fill
                priority
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {images.length > 1 ? (
              <button
                type="button"
                onClick={showNext}
                disabled={!hasNext}
                className={`absolute right-4 top-1/2 -translate-y-1/2 sm:right-6 lg:right-10 ${navButtonClassName(!hasNext)}`}
                aria-label={t('nextImage')}
              >
                <span aria-hidden="true" className="text-lg leading-none">→</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
