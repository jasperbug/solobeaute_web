import Link from 'next/link'

export type HomeStats = {
  dateLabel: string
  total: number
  cityCount: number
  median: number
}

// One server-rendered numbers sentence under the hero (zh-TW only). All values
// are live (lib/priceReport.ts); hidden when the API is unavailable.
export function HomeStatsLine({ stats }: { stats: HomeStats }) {
  return (
    <section className="container py-6" aria-label="美業空間時租數據" data-home-stats>
      <p className="mx-auto max-w-3xl rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm leading-7 text-black/70 [font-family:var(--font-body)] lining-nums tabular-nums md:text-base">
        截至 {stats.dateLabel}，SoloBeauté 上有 {stats.total} 間美業空間、分布在 {stats.cityCount} 個縣市，時租中位數 NT${stats.median.toLocaleString('en-US')}。
        <Link href="/spaces/price-report" className="ml-1 whitespace-nowrap text-brand underline underline-offset-4">看 2026 時租行情</Link>
      </p>
    </section>
  )
}
