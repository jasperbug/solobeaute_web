import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import {
  Byline,
  DataTable,
  FaqBlock,
  NUM,
  Section as ContentSection,
  faqPageSchema,
  type QA,
} from '@/components/content/ContentBlocks'
import { JsonLd } from '@/components/spaces/JsonLd'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { dataDateLabel } from '@/lib/cityPages'
import { SITE_URL } from '@/lib/constants'
import {
  AUTHORS,
  AUTHOR_REFS,
  PUBLISHER,
  REPORT_UPDATED_ISO,
  REPORT_UPDATED_LABEL,
  REPORT_UPDATED_LABEL_EN,
  citationText,
  personSchema,
  taipeiYear,
} from '@/lib/editorial'
import {
  buildPriceReport,
  formatShare,
  minimumHoursRow,
  type PriceReport,
  type ProfessionRow,
  type RateSummary,
} from '@/lib/priceReport'
import { SCENARIO_ASSUMPTION, USAGE_SCENARIOS, monthlyHourlyCost } from '@/lib/rentMath'
import { fetchPublicSpaces, formatNtd } from '@/lib/spaces'

// Same window as every space fetch in lib/spaces.ts.
export const revalidate = 3600

const PAGE_PATH = '/spaces/price-report'
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`
const ORGANIZATION_ID = `${SITE_URL}/#organization`
// First publication of this page (not a statistic).
const FIRST_PUBLISHED = '2026-10-03'

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

function professionMedian(row: ProfessionRow): string {
  return row.hourly.count >= 2 ? medianText(row.hourly) : '—'
}

function professionSentence(row: ProfessionRow, total: number): string {
  if (row.count === 0) return `目前還沒有屋主標示適合${row.serviceProse}的空間。`
  const parts: string[] = []
  parts.push(`${total} 間空間中，屋主標示適合${row.serviceProse}的有 ${row.count} 間（${formatShare(row.share)}）`)
  if (row.hourly.count > 0) {
    parts.push(row.hourly.count >= 2 ? `時租 ${rangeText(row.hourly)}，中位數 ${medianText(row.hourly)}` : `時租 ${rangeText(row.hourly)}`)
  }
  const equipment = row.equipment.filter((e) => e.count > 0).map((e) => `${e.count} 間有${e.label}`)
  if (equipment.length) parts.push(equipment.join('、'))
  let text = `${parts.join('；')}。`
  if (row.cities.length) text += `分布在${row.cities.map((c) => `${c.short} ${c.count} 間`).join('、')}。`
  if (row.minTwoHours > 0) text += `其中 ${row.minTwoHours} 間最低租用 2 小時。`
  if (row.halfDay.count > 0 || row.fullDay.count > 0) {
    const day: string[] = []
    if (row.halfDay.count > 0) day.push(`${row.halfDay.count} 間有半日價（${row.halfDay.count >= 2 ? `中位數 ${medianText(row.halfDay)}` : rangeText(row.halfDay)}）`)
    if (row.fullDay.count > 0) day.push(`${row.fullDay.count} 間有全日價（${row.fullDay.count >= 2 ? `中位數 ${medianText(row.fullDay)}` : rangeText(row.fullDay)}）`)
    text += `${day.join('、')}。`
  }
  return text
}

const PROFESSION_NOTES: Record<ProfessionRow['key'], string> = {
  lash: '美睫通常需要美容床和照明，挑空間時先看設備清單；更多美睫師租工作室的比較，見「美睫師租工作室」。',
  nail: '適合美甲的空間比美睫、美容少，這是目前上架空間的實際情況；挑空間時先確認有沒有美甲桌椅和照明。',
  brow: '霧眉、霧唇會用到美容床和照明；部分空間也標示適合霧眉除色、髮際線紋繡，以各空間頁上屋主的標示為準。',
}

function buildReportFaq(report: PriceReport, dateLabel: string): QA[] {
  const lash = report.professions.find((p) => p.key === 'lash')
  const two = minimumHoursRow(report, 2)
  const quart = report.hourlyQuartiles ? `，中間一半的空間落在 ${formatNtd(report.hourlyQuartiles.q1)}–${report.hourlyQuartiles.q3}` : ''
  const others = report.minimumHours.filter((row) => row.label !== '2 小時')
  const median = report.hourly.median

  const items: QA[] = [
    {
      question: '美容工作室時租一小時多少錢？',
      answer: `截至 ${dateLabel}，SoloBeauté 上架中的 ${report.total} 間美業空間，時租中位數 ${medianText(report.hourly)}，區間 ${rangeText(report.hourly)}${quart}。價格由屋主依地點、設備和空間類型自己訂，實際價格以各空間頁和 App 為準。`,
    },
  ]
  if (lash) {
    const bed = lash.equipment.find((e) => e.label === '美容床')
    items.push({
      question: '美睫師租工作室要多少錢？',
      answer: lash.count > 0
        ? `屋主標示適合嫁接睫毛或睫毛管理的空間有 ${lash.count} 間（占 ${formatShare(lash.share)}），時租 ${rangeText(lash.hourly)}，中位數 ${professionMedian(lash)}${bed && bed.count > 0 ? `，其中 ${bed.count} 間有美容床` : ''}。詳細比較見「美睫師租工作室」。`
        : '目前還沒有屋主標示適合美睫的空間。',
      links: [{ text: '美睫師租工作室', href: '/guides/lash-artist-studio' }],
    })
  }
  items.push({
    question: '美業空間最少要租幾小時？',
    answer: two
      ? `${report.total} 間中有 ${two.count} 間（${formatShare(two.share)}）最低租用 2 小時${others.length ? `，其餘${others.map((row) => ` ${row.count} 間是 ${row.label}`).join('、')}` : ''}。每個空間的最低時數會標在空間頁和 App 裡。`
      : `最低租用時數由屋主設定：${report.minimumHours.map((row) => `${row.label} ${row.count} 間`).join('、')}。`,
  })
  items.push({
    question: '美容工作室半日租、全日租多少錢？',
    answer: `${report.halfDay.count} 間有半日價，中位數 ${medianText(report.halfDay)}；${report.fullDay.count} 間有全日價，中位數 ${medianText(report.fullDay)}${report.fullDayHoursEquivalent !== null ? `，大約等於 ${report.fullDayHoursEquivalent} 小時的時租` : ''}。各空間的半日、全日是幾小時，以空間頁和 App 的說明為準。`,
  })
  items.push({
    question: '美容工作室時租和月租怎麼選？',
    answer: median !== null
      ? `先估每個月實際會用幾小時。以時租中位數 ${formatNtd(median)} 試算，每月用 16 小時約 ${formatNtd(monthlyHourlyCost(16, median))}；把你拿到的月租報價除以 ${median}，就是打平的時數。每月用的時數低於打平時數，時租的總額比較低；高於的話，再把月租的押金、合約期間等條件一起比較。完整試算見「時租和月租怎麼比」。`
      : '先估每個月實際會用幾小時，再用「時租 × 時數」和月租報價比較。完整試算見「時租和月租怎麼比」。',
    links: [{ text: '時租和月租怎麼比', href: '/guides/hourly-vs-monthly-rent' }],
  })
  return items
}

function enRange(summary: Pick<RateSummary, 'min' | 'max'>): string {
  if (summary.min === null || summary.max === null) return 'n/a'
  return summary.min === summary.max ? `at ${formatNtd(summary.min)}` : `from ${formatNtd(summary.min)} to ${formatNtd(summary.max)}`
}

function englishSummary(report: PriceReport): string[] {
  const two = minimumHoursRow(report, 2)
  const lash = report.professions.find((p) => p.key === 'lash')
  const first = `SoloBeauté price data, last updated ${REPORT_UPDATED_LABEL_EN}: across ${report.total} beauty workspaces listed on SoloBeauté in ${report.cityCount} cities and counties in Taiwan, hourly rates range ${enRange(report.hourly)}, with a median of ${medianText(report.hourly)} per hour.`
  const second: string[] = []
  if (report.halfDay.count > 0) second.push(`${report.halfDay.count} spaces also list a half-day rate (median ${medianText(report.halfDay)})`)
  if (report.fullDay.count > 0) second.push(`${report.fullDay.count} list a full-day rate (median ${medianText(report.fullDay)})`)
  const third: string[] = []
  if (two) third.push(`${two.count} of ${report.total} spaces (${formatShare(two.share)}) require a 2-hour minimum booking`)
  if (lash && lash.count > 0) third.push(`${lash.count} (${formatShare(lash.share)}) are marked by hosts as suitable for eyelash extensions`)
  return [
    first,
    second.length ? `${second.join(' and ')}.` : '',
    third.length ? `${third.join(', and ')}.` : '',
    'Figures are list prices set by hosts, not transaction prices, and the sample is small. Rates are recalculated hourly from public listings.',
  ].filter(Boolean)
}

export default async function PriceReportPage() {
  const spaces = await fetchPublicSpaces()
  const report = buildPriceReport(spaces)
  const dateLabel = dataDateLabel()
  const h1 = h1Text()
  const description = buildReportDescription(report)
  const lead = buildLead(report, dateLabel)
  // Stable editorial date (lib/editorial.ts), not the render time.
  const dateModified = REPORT_UPDATED_ISO
  const methodology = `依 SoloBeauté 上架中的 ${report.total} 間空間公開價格計算，資料日期：${dateLabel}。`
  const faq = buildReportFaq(report, dateLabel)
  const english = englishSummary(report)
  const citation = citationText(REPORT_UPDATED_LABEL)
  const median = report.hourly.median

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
        author: AUTHOR_REFS,
        publisher: PUBLISHER,
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
        datePublished: FIRST_PUBLISHED,
        dateModified,
        citation,
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
      faqPageSchema(`${PAGE_URL}#faq`, faq),
      ...AUTHORS.map((author) => personSchema(author)),
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
          <p className={`text-sm font-medium text-ink ${NUM}`} data-report-updated>
            資料更新：<time dateTime={REPORT_UPDATED_ISO}>{REPORT_UPDATED_LABEL}</time>
          </p>
          <Byline />
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

        <ContentSection id="by-profession" title="依職業看：美睫師、美甲師、霧眉師" note={`依屋主標示的建議服務分類，一間空間可以同時適合多種職業；占比的分母是 ${report.total} 間。`}>
          <DataTable
            caption="依職業的時租"
            head={['職業', '適合的空間', '時租區間', '中位數']}
            rows={report.professions.map((row) => [
              <a key={row.key} href={`#${row.key}`} className="text-brand underline-offset-4 hover:underline">{row.profession}</a>,
              `${row.count} 間（${formatShare(row.share)}）`,
              rangeText(row.hourly),
              professionMedian(row),
            ])}
          />
          <div className="space-y-5">
            {report.professions.map((row) => (
              <div key={row.key} id={row.key} className="scroll-mt-28 space-y-2">
                <h3 className="text-lg font-semibold text-ink">{row.profession}租工作室</h3>
                <p className={`text-sm leading-7 text-black/70 ${NUM}`}>{professionSentence(row, report.total)}</p>
                <p className={`text-sm leading-7 text-black/55 ${NUM}`}>
                  {row.key === 'lash' ? (
                    <>美睫通常需要美容床和照明，挑空間時先看設備清單；更多美睫師租工作室的比較，見<Link href="/guides/lash-artist-studio" className="text-brand underline underline-offset-4">美睫師租工作室</Link>。</>
                  ) : PROFESSION_NOTES[row.key]}
                </p>
              </div>
            ))}
          </div>
        </ContentSection>

        {median !== null ? (
          <ContentSection id="hourly-vs-monthly" title="時租和月租怎麼比（示意試算）" note={`以下是示意試算，不是市場月租行情：時租用本頁中位數 ${formatNtd(median)}，${SCENARIO_ASSUMPTION}。`}>
            <DataTable
              caption="時租每月總額示意試算"
              head={['每月用量', '每月時數', `時租總額（${formatNtd(median)}／小時）`]}
              rows={USAGE_SCENARIOS.map((row) => [row.label, `${row.hours} 小時`, formatNtd(monthlyHourlyCost(row.hours, median))])}
            />
            <div className={`space-y-2 text-sm leading-7 text-black/70 ${NUM}`}>
              <p>
                本頁不提供月租數字。把你拿到的月租報價除以 {median}，就是「打平時數」：每月實際使用的時數低於這個數字，按小時租的總額比較低；高於的話，再把月租的押金、合約期間、水電與耗材是否另計等條件一起比較。
              </p>
              {report.fullDayHoursEquivalent !== null ? (
                <p>如果一天排滿多位客人，也可以看全日價：全日價中位數 {medianText(report.fullDay)}，大約等於 {report.fullDayHoursEquivalent} 小時的時租。</p>
              ) : null}
              <p>
                逐步試算和比較清單，見<Link href="/guides/hourly-vs-monthly-rent" className="text-brand underline underline-offset-4">時租和月租怎麼比</Link>。
              </p>
            </div>
          </ContentSection>
        ) : null}

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

        <FaqBlock id="faq" title="時租行情常見問題" items={faq} />

        <section className="sb-card space-y-3 p-6 md:p-8" aria-labelledby="method">
          <h2 id="method" className="text-xl font-semibold text-ink">計算方式與限制</h2>
          <ul className={`list-disc space-y-2 pl-5 text-sm leading-7 text-black/65 ${NUM}`}>
            <li>{methodology}只計算上架中（公開）的空間，不含草稿或已下架的空間。</li>
            <li>價格是屋主在 SoloBeauté 上公開標示的掛牌價，不是成交價；實際價格以各空間頁和 App 顯示為準。</li>
            <li>中位數：把價格由低到高排列取中間值；偶數筆時取中間兩筆的平均後四捨五入。「中間一半」是第 25 到第 75 百分位（最近排名法）。</li>
            <li>樣本數少（{report.total} 間），單一空間上下架就可能讓數字明顯變動，特別是只有 1–2 間空間的縣市，請當作參考，不要當作市場全貌。</li>
            <li>頁面每小時依最新的公開資料重新計算；文字與章節的最後更新日期是 {REPORT_UPDATED_LABEL}。</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-brand/30 bg-white p-6 md:p-8 space-y-3" aria-labelledby="cite" data-report-cite>
          <h2 id="cite" className="text-xl font-semibold text-ink">如何引用這份資料</h2>
          <ul className={`list-disc space-y-1 pl-5 text-sm leading-7 text-black/70 ${NUM}`}>
            <li>樣本：SoloBeauté 上架中（公開）的 {report.total} 間美業空間，分布在 {report.cityCount} 個縣市。</li>
            <li>方法：彙整屋主在 SoloBeauté 公開標示的掛牌價，計算區間與中位數；不含草稿或已下架的空間，頁面每小時重新計算。</li>
            <li>最後更新：<time dateTime={REPORT_UPDATED_ISO}>{REPORT_UPDATED_LABEL}</time>；數字會隨空間上下架變動，引用時請註明你查看的日期。</li>
          </ul>
          <p className="text-sm text-black/55">建議引用格式：</p>
          <p className={`rounded-xl bg-surface-warm px-4 py-3 text-sm leading-7 text-ink break-all ${NUM}`} data-report-citation>{citation}</p>
        </section>

        <section lang="en" className="sb-card space-y-3 p-6 md:p-8" aria-labelledby="english-summary" data-report-english>
          <h2 id="english-summary" className="text-xl font-semibold text-ink">English summary</h2>
          <div className={`space-y-2 text-sm leading-7 text-black/70 ${NUM}`}>
            {english.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <p>
              Suggested citation: SoloBeauté, &ldquo;2026 Taiwan Beauty Workspace Hourly Rental Prices&rdquo;, last updated {REPORT_UPDATED_LABEL_EN}, {PAGE_URL}. More in English: <Link href="/en" className="text-brand underline underline-offset-4">About SoloBeauté (English)</Link>.
            </p>
          </div>
        </section>

        <p className={`text-sm text-black/60 ${NUM}`}>
          本文由 SoloBeauté 共同創辦人 {AUTHORS.map((a) => `${a.name}（${a.jobTitle}）`).join('、')} 整理。<Link href="/about" className="text-brand underline underline-offset-4">關於我們</Link>
        </p>

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
            {[
              { href: '/guides/lash-artist-studio', label: '美睫師租工作室' },
              { href: '/guides/hourly-vs-monthly-rent', label: '時租和月租怎麼比' },
              { href: '/hosts', label: '屋主出租閒置時段' },
              { href: '/faq', label: '常見問題' },
              { href: '/en', label: 'English' },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition hover:border-brand hover:text-brand">{link.label}</Link>
              </li>
            ))}
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
