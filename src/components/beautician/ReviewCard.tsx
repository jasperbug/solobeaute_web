import Image from 'next/image'
import { useLocale } from 'next-intl'

import { formatReviewDate, hasReviewImages, resolveImageUrl } from '@/lib/format'
import type { PublicReview } from '@/lib/types'
import { RatingStars } from './RatingStars'

type ReviewCardProps = {
  review: PublicReview
}

export function ReviewCard({ review }: ReviewCardProps) {
  const locale = useLocale()

  return (
    <article className="sb-card space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-full bg-black/5">
            {review.reviewer.avatarUrl ? (
              <Image
                src={resolveImageUrl(review.reviewer.avatarUrl) ?? ''}
                alt={review.reviewer.name ?? 'Reviewer'}
                fill
                className="object-cover"
              />
            ) : null}
          </div>
          <div>
            <p className="text-sm font-medium text-ink">{review.reviewer.name ?? 'SoloBeauté User'}</p>
            <p className="text-xs text-black/45">{formatReviewDate(review.createdAt, locale)}</p>
          </div>
        </div>
        <RatingStars rating={review.rating} />
      </div>

      {review.comment ? <p className="text-sm leading-7 text-black/65">{review.comment}</p> : null}

      {hasReviewImages(review) ? (
        <div className="grid grid-cols-3 gap-2">
          {review.imageUrls.slice(0, 3).map((image) => (
            <div key={image} className="relative aspect-square overflow-hidden rounded-lg bg-black/5">
              <Image
                src={resolveImageUrl(image) ?? image}
                alt={review.comment ?? 'Review image'}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}
    </article>
  )
}
