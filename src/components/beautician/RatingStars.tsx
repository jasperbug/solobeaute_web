import { StarIcon } from '../ui/Icons'

type RatingStarsProps = {
  rating: number
  className?: string
}

export function RatingStars({ rating, className = '' }: RatingStarsProps) {
  const activeCount = Math.round(rating)

  return (
    <div className={`flex items-center gap-1 ${className}`.trim()}>
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon
          key={index}
          className={`h-4 w-4 ${index < activeCount ? 'text-accent' : 'text-black/10'}`}
        />
      ))}
    </div>
  )
}
