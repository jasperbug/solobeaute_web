type RatingDistributionProps = {
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>
}

export function RatingDistribution({ distribution }: RatingDistributionProps) {
  const total = Object.values(distribution).reduce((sum, value) => sum + value, 0)

  return (
    <div className="space-y-3">
      {(['5', '4', '3', '2', '1'] as const).map((bucket) => {
        const count = distribution[bucket]
        const width = total ? `${(count / total) * 100}%` : '0%'

        return (
          <div key={bucket} className="grid grid-cols-[36px_1fr_32px] items-center gap-3">
            <span className="text-sm text-black/60">{bucket}★</span>
            <div className="h-2 overflow-hidden rounded-full bg-black/5">
              <div className="h-full rounded-full bg-brand" style={{ width }} />
            </div>
            <span className="text-right text-sm text-black/45">{count}</span>
          </div>
        )
      })}
    </div>
  )
}
