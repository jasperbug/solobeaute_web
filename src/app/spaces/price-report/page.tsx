import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { JsonLd } from '@/components/spaces/JsonLd'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { dataDateLabel } from '@/lib/cityPages'
import { SITE_URL } from '@/lib/constants'
import { buildPriceReport, formatShare, type PriceReport, type RateSummary } from '@/lib/priceReport'
import { fetchPublicSpaces, formatNtd } from '@/lib/spaces'

// Same window as every space fetch in lib/spaces.ts.
export const revalidate = 3600

const PAGE_PATH = '/spaces/price-report'
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`
const ORGANIZATION_ID = `${SITE_URL}/#organization`
// First publication of this page (not a statistic).
const FIRST_PUBLISHED = '2026-10-03'

function taipeiYear(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', year: 'numeric' }).format(now)
}

function taipeiMonthIso(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit' }).formatToParts(now)
  return `${parts.find((p) => p.type === 'year')?.value}-${parts.find((p) => p.type === 'month')?.value}`
}

function h1Text(): string {
  return `${taipeiYear()} 台灣美業空間時租行情`
}

function rangeText(summary: Pick<RateSummary, 'min' | 'max'>): string {
  if (summary.min === null || summary.max === null) return '—'
  return summary.min === summary.max ? formatNtd(summary.min) : `${formatNtd(summary.min)}–${summary.max.toLocaleString('en-US')}`
}

function medianText(summary: Pick<RateSummary, 'median'>): string {
  return summary.median === null ? '—' : formatNtd(summary.median)
}

function buildReportDescription(report: PriceReport): string {
  return `依 SoloBeauté 上架中的 ${report.total} 間美業空間公開價格計算：時租 ${rangeText(report.hourly)}，中位數 ${medianText(report.hourly)}。附空間類型、${report.cityCount} 個縣市、半日／全日價、最低時數、設備與適合服務的統計。`
}

function buildLead(report: PriceReport, dateLabel: string): string[] {
  const first: string[] = []
  first.push(`截至 ${dateLabel}，SoloBeauté 上架中的美業空間共 ${report.total} 間，分布在 ${report.cityCount} 個縣市。`)
  if (report.hourly.count > 0) {
    const quart = report.hourlyQuartiles
      ? `，中間一半的空間落在 ${formatNtd(report.hourlyQuartiles.q1)}–${report.hourlyQuartiles.q3}`
      : ''
    first.push(`時租 ${rangeText(report.hourly)}，中位數 ${medianText(report.hourly)}${quart}。`)
  }
  if (report.byType.length > 0) {
    first.push(`依空間類型看，${report.byType.map((row) => `${row.label}中位數 ${medianText(row)}`).join('、')}。`)
  }
  const second: string[] = []
  if (report.fullDay.count > 0) {
    const hours = report.fullDayHoursEquivalent !== null ? `，大約等於 ${report.fullDayHoursEquivalent} 小時的時租` : ''
    second.push(`${report.fullDay.count} 間另有全日價，中位數 ${medianText(report.fullDay)}${hours}。`)
  }
  if (report.halfDay.count > 0) {
    second.push(`${report.halfDay.count} 間有半日價，中位數 ${medianText(report.halfDay)}。`)
  }
  const topServices = report.services.slice().sort((a, b) => b.count - a.count).slice(0, 3)
  if (topServices.length > 0) {
    second.push(`屋主最常標示適合的服務是${topServices.map((row) => `${row.label.replace(/（.*）/, '')}（${row.count} 間）`).join('、')}。`)
  }
  return [first.join(''), second.join('')].filter(Boolean)
}

export async function generateMetadata(): Promise<Metadata> {
  const title = `${h1Text()}｜美容工作室時租價格`
  let description = '依 SoloBeauté 上架中的美業空間公開價格計算的時租行情：價格區間、中位數、空間類型、縣市、半日／全日價、最低時數、設備與適合的服務。'
  try {
    description = buildReportDescription(buildPriceReport(await fetchPublicSpaces()))
  } catch (error) {
    console.error('[price-report] metadata fallback:', error)
  }
  return {
    title,
    description,
    alternates: { canonical: PAGE_URL },
    openGraph: {
      title: `${h1Text()}｜SoloBeauté`,
      description,
      siteName: 'SoloBeauté',
      type: 'article',
      locale: 'zh_TW',
      url: PAGE_URL,
      images: ['/og-image.png'],
    },
    twitter: { card: 'summary_large_image', title: `${h1Text()}｜SoloBeauté`, description, images: ['/og-image.png'] },
  }
}

const NUM = '[font-family:var(--font-body)] lining-nums tabular-nums'

function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
      <table className={`w-full text-left text-[13px] md:text-sm ${NUM}`}>
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-warm text-xs text-black/55">
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col" className="px-3 py-3 font-medium md:px-4">{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 text-ink">
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                cellIndex === 0
                  ? <th key={cellIndex} scope="row" className="px-3 py-3 font-medium md:px-4">{cell}</th>
                  : <td key={cellIndex} className="whitespace-nowrap px-3 py-3 md:px-4">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section className="space-y-4" aria-labelledby={id}>
      <div className="space-y-1">
        <h2 id={id} className="section-title">{title}</h2>
        {note ? <p className={`text-sm text-black/55 ${NUM}`}>{note}</p> : null}
      </div>
      {children}
    </section>
  )
}

export default async function PriceReportPage() {
  const spaces = await fetchPublicSpaces()
  const report = buildPriceReport(spaces)
  const dateLabel = dataDateLabel()
  const h1 = h1Text()
  const description = buildReportDescription(report)
  const lead = buildLead(report, dateLabel)
  const dateModified = report.lastUpdated ?? new Date().toISOString()
  const methodology = `依 SoloBeauté 上架中的 ${report.total} 間空間公開價格計算，資料日期：${dateLabel}。`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${PAGE_URL}#article`,
        headline: h1,
        description,
        inLanguage: 'zh-TW',
        url: PAGE_URL,
        mainEntityOfPage: PAGE_URL,
        datePublished: FIRST_PUBLISHED,
        dateModified,
        author: { '@type': 'Organization', '@id': ORGANIZATION_ID, name: 'SoloBeauté', url: SITE_URL },
        publisher: {
          '@type': 'Organization',
          '@id': ORGANIZATION_ID,
          name: 'SoloBeauté',
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/brand/logo.png` },
        },
        image: [`${SITE_URL}/og-image.png`],
        about: { '@id': `${PAGE_URL}#dataset` },
      },
      {
        '@type': 'Dataset',
        '@id': `${PAGE_URL}#dataset`,
        name: `${h1}（SoloBeauté 上架空間公開價格）`,
        description: `${description}${methodology}樣本數少，僅供參考。`,
        url: PAGE_URL,
        inLanguage: 'zh-TW',
        isAccessibleForFree: true,
        creator: { '@type': 'Organization', '@id': ORGANIZATION_ID, name: 'SoloBeauté', url: SITE_URL },
        dateModified,
        temporalCoverage: taipeiMonthIso(),
        spatialCoverage: { '@type': 'Place', name: '台灣', address: { '@type': 'PostalAddress', addressCountry: 'TW' } },
        keywords: ['美業空間時租', '美容工作室時租', '美睫工作室時租', '霧眉工作室出租', '美甲工作室出租'],
        measurementTechnique: '彙整 SoloBeauté 上架中（ACTIVE）空間的公開掛牌價；中位數為偶數筆時取中間兩筆平均後四捨五入。',
        variableMeasured: [
          {
            '@type': 'PropertyValue',
            name: '時租',
            unitText: 'TWD／小時',
            ...(report.hourly.min !== null ? { minValue: report.hourly.min, maxValue: report.hourly.max } : {}),
            ...(report.hourly.median !== null ? { value: report.hourly.median, description: '中位數' } : {}),
          },
          ...(report.halfDay.count > 0
            ? [{ '@type': 'PropertyValue', name: '半日價', unitText: 'TWD', minValue: report.halfDay.min, maxValue: report.halfDay.max, value: report.halfDay.median, description: '中位數' }]
            : []),
          ...(report.fullDay.count > 0
            ? [{ '@type': 'PropertyValue', name: '全日價', unitText: 'TWD', minValue: report.fullDay.min, maxValue: report.fullDay.max, value: report.fullDay.median, description: '中位數' }]
            : []),
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '美業空間', item: `${SITE_URL}/spaces` },
          { '@type': 'ListItem', position: 3, name: '時租行情', item: PAGE_URL },
        ],
      },
    ],
  }

  const facts = [
    { label: '上架中空間', value: `${report.total} 間` },
    { label: '時租區間', value: rangeText(report.hourly) },
    { label: '時租中位數', value: medianText(report.hourly) },
    report.hourlyQuartiles
      ? { label: '中間一半', value: `${formatNtd(report.hourlyQuartiles.q1)}–${report.hourlyQuartiles.q3}` }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null)

  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <JsonLd data={jsonLd} />

      <div className="container max-w-4xl space-y-12">
        <nav aria-label="麵包屑" className="text-sm text-black/55">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-brand">首頁</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/spaces" className="hover:text-brand">美業空間</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-ink">時租行情</li>
          </ol>
        </nav>

        <header className="space-y-5">
          <p className="section-tag">美業空間時租行情</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">{h1}</h1>
          <div className={`space-y-3 text-base leading-8 text-black/70 ${NUM}`} data-report-lead>
            {lead.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <dl className={`grid grid-cols-2 gap-3 md:grid-cols-4 ${NUM}`} data-report-facts>
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                <dt className="text-xs text-black/50">{fact.label}</dt>
                <dd className="mt-1 text-base font-semibold text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <p className={`text-xs leading-6 text-black/50 ${NUM}`} data-report-method>
            {methodology}樣本數少，數字會隨空間上下架變動，僅供參考；實際價格以各空間頁和 App 顯示為準。
          </p>
        </header>

        <Section id="bands" title="時租價格分布" note={`${report.hourly.count} 間有標示時租`}>
          <DataTable
            caption="時租價格分布"
            head={['時租', '空間數', '占比']}
            rows={report.hourlyBands.map((row) => [row.label, `${row.count} 間`, formatShare(row.share)])}
          />
        </Section>

        <Section id="by-type" title="依空間類型">
          <DataTable
            caption="依空間類型的時租"
            head={['類型', '空間數', '時租區間', '中位數']}
            rows={report.byType.map((row) => [row.label, `${row.count} 間`, rangeText(row), medianText(row)])}
          />
        </Section>

        <Section id="by-city" title="依縣市" note="點縣市名稱可以看該縣市的空間列表和常見問題。">
          <DataTable
            caption="依縣市的時租"
            head={['縣市', '空間數', '時租區間', '中位數']}
            rows={report.byCity.map((row) => [
              row.href ? <Link key={row.label} href={row.href} className="text-brand underline-offset-4 hover:underline">{row.label}</Link> : row.label,
              `${row.count} 間`,
              rangeText(row),
              row.count >= 2 ? medianText(row) : '—',
            ])}
          />
          <p className={`text-xs text-black/50 ${NUM}`}>只有 1 間空間的縣市不計算中位數。</p>
        </Section>

        <Section id="day-rates" title="半日價與全日價" note="部分屋主另外提供半日、全日價格；各空間的半日、全日是幾小時，以空間頁和 App 的說明為準。">
          <DataTable
            caption="半日與全日價"
            head={['方案', '有提供的空間', '價格區間', '中位數']}
            rows={[
              ['時租', `${report.hourly.count} 間`, rangeText(report.hourly), medianText(report.hourly)],
              ['半日', `${report.halfDay.count} 間`, rangeText(report.halfDay), medianText(report.halfDay)],
              ['全日', `${report.fullDay.count} 間`, rangeText(report.fullDay), medianText(report.fullDay)],
            ]}
          />
          {report.fullDayHoursEquivalent !== null ? (
            <p className={`text-sm text-black/60 ${NUM}`}>
              同時有時租和全日價的空間，全日價中位數大約等於 {report.fullDayHoursEquivalent} 小時的時租。
            </p>
          ) : null}
        </Section>

        <Section id="min-hours" title="最低租用時數">
          <DataTable
            caption="最低租用時數"
            head={['最低時數', '空間數', '占比']}
            rows={report.minimumHours.map((row) => [row.label, `${row.count} 間`, formatShare(row.share)])}
          />
        </Section>

        <Section id="services" title="適合的服務" note={`依屋主標示的建議服務計算，一間空間可以標示多種服務；占比的分母是 ${report.total} 間。`}>
          <DataTable
            caption="適合的服務"
            head={['服務', '空間數', '占比']}
            rows={report.services.map((row) => [row.label, `${row.count} 間`, formatShare(row.share)])}
          />
        </Section>

        <Section id="equipment" title="常見設備" note={`依屋主列出的設備計算，只列 2 間以上有的設備；占比的分母是 ${report.total} 間。`}>
          <DataTable
            caption="常見設備"
            head={['設備', '空間數', '占比']}
            rows={report.equipment.map((row) => [row.label, `${row.count} 間`, formatShare(row.share)])}
          />
          {report.withRoomScan > 0 ? (
            <p className={`text-sm text-black/60 ${NUM}`}>另外有 {report.withRoomScan} 間空間提供 3D 實景，可以先在 App 看空間。</p>
          ) : null}
        </Section>

        <section className="sb-card space-y-3 p-6 md:p-8" aria-labelledby="method">
          <h2 id="method" className="text-xl font-semibold text-ink">計算方式與限制</h2>
          <ul className={`list-disc space-y-2 pl-5 text-sm leading-7 text-black/65 ${NUM}`}>
            <li>{methodology}只計算上架中（公開）的空間，不含草稿或已下架的空間。</li>
            <li>價格是屋主在 SoloBeauté 上公開標示的掛牌價，不是成交價；實際價格以各空間頁和 App 顯示為準。</li>
            <li>中位數：把價格由低到高排列取中間值；偶數筆時取中間兩筆的平均後四捨五入。「中間一半」是第 25 到第 75 百分位（最近排名法）。</li>
            <li>樣本數少（{report.total} 間），單一空間上下架就可能讓數字明顯變動，特別是只有 1–2 間空間的縣市，請當作參考，不要當作市場全貌。</li>
            <li>頁面每小時依最新的公開資料重新計算。</li>
          </ul>
        </section>

        <section className="space-y-4" aria-labelledby="more">
          <h2 id="more" className="text-xl font-semibold text-ink">繼續看</h2>
          <ul className={`flex flex-wrap gap-2 ${NUM}`}>
            <li>
              <Link href="/spaces" className="inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition hover:border-brand hover:text-brand">全部美業空間</Link>
            </li>
            {report.byCity.map((row) => (
              <li key={row.label}>
                <Link href={row.href ?? '/spaces'} className="inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition hover:border-brand hover:text-brand">
                  {row.label.replace(/[市縣]$/, '')}美業空間 · {row.count} 間
                </Link>
              </li>
            ))}
            <li>
              <Link href="/faq" className="inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition hover:border-brand hover:text-brand">常見問題</Link>
            </li>
          </ul>
        </section>

        <section className="sb-card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">下載 SoloBeauté App 找空間</h2>
          <p className="text-sm leading-7 text-black/65">
            在 App 裡可以看每個空間的照片、設備、可預約時段，直接傳訊息給屋主。有閒置的美容室或座位，也可以在 App 上架出租，自己訂時租價格。
          </p>
          <StoreButtons buttonClassName="btn-dark" />
        </section>
      </div>
    </main>
  )
}
