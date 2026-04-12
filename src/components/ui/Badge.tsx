import type { ReactNode } from 'react'

type BadgeProps = {
  children: ReactNode
  tone?: 'brand' | 'muted'
}

export function Badge({ children, tone = 'brand' }: BadgeProps) {
  return (
    <span
      className={
        tone === 'brand'
          ? 'inline-flex items-center rounded-md bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand'
          : 'inline-flex items-center rounded-md bg-black/5 px-2.5 py-1 text-xs font-medium text-black/60'
      }
    >
      {children}
    </span>
  )
}
