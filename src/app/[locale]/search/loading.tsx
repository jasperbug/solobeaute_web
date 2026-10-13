import { Skeleton } from '@/components/ui/Skeleton'

export default function SearchLoading() {
  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <div className="container space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-[420px] w-full" />
          <Skeleton className="h-[420px] w-full" />
        </div>
      </div>
    </main>
  )
}
