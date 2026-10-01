import Image from 'next/image'
import Link from 'next/link'

import { formatNtd, spaceTypeLabel } from '@/lib/spaces'
import type { PublicSpace } from '@/lib/types'

type SpaceCardProps = {
  space: PublicSpace
  /** Heading level inside the card, so lists keep a valid outline. */
  headingLevel?: 'h2' | 'h3'
}

// Server component: receives the already-whitelisted PublicSpace only.
export function SpaceCard({ space, headingLevel = 'h3' }: SpaceCardProps) {
  const Heading = headingLevel
  const services = space.recommendedServices.slice(0, 3)

  return (
    <Link
      href={`/spaces/${space.id}`}
      className="sb-card group flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] w-full bg-surface-warm">
        {space.coverPhotoUrl ? (
          <Image
            src={space.coverPhotoUrl}
            alt={`${space.title} 空間照片`}
            fill
            sizes="(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-black/40">尚無照片</div>
        )}
        {space.roomScanUrl ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-brand">3D 實景</span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-xs text-black/50">
          {space.district ?? space.city} · {spaceTypeLabel(space.spaceType)}
        </p>
        <Heading className="text-lg font-semibold leading-snug text-ink group-hover:text-brand">{space.title}</Heading>
        {services.length > 0 ? (
          <p className="text-sm text-black/60">適合：{services.join('、')}</p>
        ) : null}
        <p className="mt-auto pt-2 text-sm text-ink">
          {space.hourlyRate ? (
            <>
              <span className="text-base font-semibold">{formatNtd(space.hourlyRate)}</span>
              <span className="text-black/50">／小時</span>
            </>
          ) : (
            <span className="text-black/50">價格請在 App 查看</span>
          )}
          {space.minimumHours ? <span className="text-black/50"> · 最低 {space.minimumHours} 小時</span> : null}
        </p>
      </div>
    </Link>
  )
}
