'use client'

import Image from 'next/image'

type PhoneFrameProps = {
  src: string
  alt: string
  caption?: string
  priority?: boolean
  sizes?: string
  onClick?: () => void
  stackClassName?: string
  frameClassName?: string
  captionClassName?: string
  buttonLabel?: string
}

export function PhoneFrame({
  src,
  alt,
  caption,
  priority = false,
  sizes = '(max-width: 768px) 80vw, 260px',
  onClick,
  stackClassName,
  frameClassName,
  captionClassName,
  buttonLabel,
}: PhoneFrameProps) {
  const frame = (
    <div className={`phone-frame ${frameClassName ?? ''}`.trim()}>
      <div className="phone-frame__screen">
        <Image
          src={src}
          alt={alt}
          width={260}
          height={540}
          priority={priority}
          sizes={sizes}
        />
      </div>
    </div>
  )

  return (
    <div className={stackClassName}>
      {onClick ? (
        <button
          type="button"
          className="phone-frame__button"
          onClick={onClick}
          aria-label={buttonLabel ?? alt}
        >
          {frame}
        </button>
      ) : (
        frame
      )}
      {caption ? <p className={captionClassName}>{caption}</p> : null}
    </div>
  )
}
