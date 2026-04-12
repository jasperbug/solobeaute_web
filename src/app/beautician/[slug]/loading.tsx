import { Skeleton } from '@/components/ui/Skeleton'

export default function BeauticianLoading() {
  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <div className="container space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-[280px] w-full" />
        <Skeleton className="h-[240px] w-full" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    </main>
  )
}
