import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'

import {
  Breadcrumbs,
  Byline,
  DataTable,
  FaqBlock,
  LinkChips,
  NUM,
  Prose,
  Section,
  TOPIC_LINKS,
  faqPageSchema,
  type QA,
} from '@/components/content/ContentBlocks'
import { HourlyVsMonthlyEn, hourlyVsMonthlyDescriptionEn, hourlyVsMonthlyTitleEn } from '@/components/en/HourlyVsMonthlyEn'
import { JsonLd } from '@/components/spaces/JsonLd'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { dataDateLabel } from '@/lib/cityPages'
import { SITE_URL } from '@/lib/constants'
import { AUTHORS, AUTHOR_REFS, PUBLISHER, personSchema, taipeiYear } from '@/lib/editorial'
import { buildPriceReport, formatShare, minimumHoursRow, type PriceReport } from '@/lib/priceReport'
import { SCENARIO_ASSUMPTION, USAGE_SCENARIOS, monthlyHourlyCost } from '@/lib/rentMath'
import { localeAlternates, localeUrl, ogLocale } from '@/lib/i18nSeo'
import { fetchPublicSpaces, formatNtd } from '@/lib/spaces'

export const revalidate = 3600

const PAGE_PATH = '/guides/hourly-vs-monthly-rent'
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`
const PUBLISHED = '2026-10-03'
const UPDATED = '2026-10-03'
const UPDATED_LABEL = '2026 年 10 月 3 日'

function h1Text(): string {
  return `美容工作室時租還是月租划算？${taipeiYear()} 試算與比較`
}

function description(report: PriceReport | null): string {
  if (!report || report.hourly.median === null) {
    return '美容工作室時租和月租怎麼比？用「打平時數 ＝ 月租報價 ÷ 時租」算出哪一種比較划算，附示意試算與比較清單。'
  }
  return `美容工作室時租還是月租划算？用 SoloBeauté ${report.total} 間美業空間的時租中位數 ${formatNtd(report.hourly.median)} 示意試算：打平時數 ＝ 月租報價 ÷ 時租，附比較清單。`
}

export async function generateMetadata(): Promise<Metadata> {
  const isEn = (await getLocale()) === 'en'
  const describe = isEn ? hourlyVsMonthlyDescriptionEn : description
  let desc = describe(null)
  try {
    desc = describe(buildPriceReport(await fetchPublicSpaces()))
  } catch (error) {
    console.error('[hourly-vs-monthly] metadata fallback:', error)
  }
  const title = isEn ? hourlyVsMonthlyTitleEn() : `美容工作室時租 vs 月租怎麼選｜${taipeiYear()} 試算`
  const social = isEn ? `${title} | SoloBeauté` : `${title}｜SoloBeauté`
  return {
    title,
    description: desc,
    alternates: localeAlternates(PAGE_PATH, isEn ? 'en' : 'zh-TW'),
    openGraph: { title: social, description: desc, siteName: 'SoloBeauté', type: 'article', ...ogLocale(isEn ? 'en' : 'zh-TW'), url: localeUrl(PAGE_PATH, isEn ? 'en' : 'zh-TW'), images: ['/og-image.png'] },
    twitter: { card: 'summary_large_image', title: social, description: desc, images: ['/og-image.png'] },
  }
}

export default async function HourlyVsMonthlyPage() {
  const report = buildPriceReport(await fetchPublicSpaces())
  if ((await getLocale()) === 'en') return <HourlyVsMonthlyEn report={report} />
  const dateLabel = dataDateLabel()
  const h1 = h1Text()
  const desc = description(report)
  const median = report.hourly.median
  const two = minimumHoursRow(report, 2)

  const faq: QA[] = [
    {
      question: '美容工作室時租和月租哪個划算？',
      answer: median !== null
        ? `看你每個月實際用幾小時。打平時數 ＝ 月租報價 ÷ 時租；以 SoloBeauté 上架空間的時租中位數 ${formatNtd(median)} 計算，每月用的時數低於「月租報價 ÷ ${median}」，時租的總額比較低，高於的話再比較月租的其他條件。`
        : '看你每個月實際用幾小時。打平時數 ＝ 月租報價 ÷ 時租，每月用的時數低於打平時數，時租的總額比較低。',
    },
    {
      question: '每個月只接幾位客人，租工作室大概要花多少？',
      answer: median !== null
        ? `示意試算：以時租中位數 ${formatNtd(median)}、每位客人租 2 小時計，每週 1 位客人（每月 8 小時）約 ${formatNtd(monthlyHourlyCost(8, median))}，每週 2 位（每月 16 小時）約 ${formatNtd(monthlyHourlyCost(16, median))}。這是試算，不是報價，實際以各空間的價格為準。`
        : '用「時租 × 每月時數」估算，每個空間的時租以空間頁和 App 為準。',
    },
    {
      question: '時租的空間有半日、全日方案嗎？',
      answer: `部分有。SoloBeauté 上架的 ${report.total} 間空間中，${report.halfDay.count} 間有半日價（中位數 ${report.halfDay.median !== null ? formatNtd(report.halfDay.median) : '—'}），${report.fullDay.count} 間有全日價（中位數 ${report.fullDay.median !== null ? formatNtd(report.fullDay.median) : '—'}）。詳細見「2026 台灣美業空間時租行情」。`,
      links: [{ text: '2026 台灣美業空間時租行情', href: '/spaces/price-report' }],
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${PAGE_URL}#article`,
        headline: h1,
        description: desc,
        inLanguage: 'zh-TW',
        url: PAGE_URL,
        mainEntityOfPage: PAGE_URL,
        datePublished: PUBLISHED,
        dateModified: UPDATED,
        author: AUTHOR_REFS,
        publisher: PUBLISHER,
        image: [`${SITE_URL}/og-image.png`],
        isBasedOn: `${SITE_URL}/spaces/price-report`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '時租行情', item: `${SITE_URL}/spaces/price-report` },
          { '@type': 'ListItem', position: 3, name: '時租和月租怎麼比', item: PAGE_URL },
        ],
      },
      faqPageSchema(`${PAGE_URL}#faq`, faq),
      ...AUTHORS.map((author) => personSchema(author)),
    ],
  }

  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <JsonLd data={jsonLd} />
      <div className="container max-w-4xl space-y-12">
        <Breadcrumbs items={[{ label: '首頁', href: '/' }, { label: '時租行情', href: '/spaces/price-report' }, { label: '時租和月租怎麼比' }]} />

        <header className="space-y-5">
          <p className="section-tag">時租・月租比較</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">{h1}</h1>
          <Prose>
            <p data-guide-lead>
              時租和月租哪個划算，取決於你每個月實際用幾小時。算法很簡單：<strong className="text-ink">打平時數 ＝ 月租報價 ÷ 時租</strong>。每月用的時數低於打平時數，按小時租的總額比較低；高於的話，月租才值得認真比較。
            </p>
            {median !== null ? (
              <p>
                截至 {dateLabel}，SoloBeauté 上架中的 {report.total} 間美業空間，時租中位數 {formatNtd(median)}（區間 {report.hourly.min !== null ? formatNtd(report.hourly.min) : '—'}–{report.hourly.max?.toLocaleString('en-US') ?? '—'}）。下面用這個中位數做示意試算；月租因為每家條件差很多，本頁不提供月租數字，請用你實際拿到的報價代入。
              </p>
            ) : null}
          </Prose>
          <Byline updatedIso={UPDATED} updatedLabel={UPDATED_LABEL} />
        </header>

        {median !== null ? (
          <Section id="example" title="示意試算：每月用多少小時、時租要花多少" note={`示意試算，不是報價或市場月租行情。時租用中位數 ${formatNtd(median)}，${SCENARIO_ASSUMPTION}。`}>
            <DataTable
              caption="時租每月總額示意試算"
              head={['每月用量', '每月時數', `時租總額（${formatNtd(median)}／小時）`]}
              rows={USAGE_SCENARIOS.map((row) => [row.label, `${row.hours} 小時`, formatNtd(monthlyHourlyCost(row.hours, median))])}
            />
            <div className={`space-y-2 text-sm leading-7 text-black/70 ${NUM}`}>
              <p>
                <strong className="text-ink">怎麼用這張表：</strong>拿你實際拿到的月租報價，除以 {median}，得到打平時數，再看自己落在表格哪一列。例如打平時數算出來是 30 小時，而你每週只有 2 位客人（每月約 16 小時），按小時租的總額就比較低。
              </p>
              {two ? <p>注意最低租用時數：{report.total} 間中有 {two.count} 間（{formatShare(two.share)}）最低租用 2 小時，所以每次預約至少以 2 小時計算。</p> : null}
              {report.fullDayHoursEquivalent !== null ? (
                <p>一天排很多位客人時，可以看全日價：全日價中位數 {report.fullDay.median !== null ? formatNtd(report.fullDay.median) : '—'}，大約等於 {report.fullDayHoursEquivalent} 小時的時租。</p>
              ) : null}
            </div>
          </Section>
        ) : null}

        <Section id="checklist" title="除了價格，還要比什麼">
          <DataTable
            caption="時租與月租比較清單"
            head={['比較項目', '時租', '月租']}
            rows={[
              ['付款方式', '有預約才付，按使用時數', '每月固定支出，有沒有客人都要付'],
              ['合約', '按小時租，不簽長約', '合約期間、提前解約條件要先問'],
              ['其他費用', '空間頁會列出時租、半日、全日價', '押金、水電、冷氣、耗材是否另計，以合約為準'],
              ['時段', '熱門時段可能被預約走，要提早約', '自己的空間，時段自由'],
              ['器材', '每次自己帶，或用空間的設備', '可以固定擺放自己的器材'],
              ['地點', '可以在不同地點接不同客人', '固定一個地點'],
            ]}
          />
        </Section>

        <Section id="when" title="什麼情況適合時租、什麼情況考慮月租">
          <ul className={`list-disc space-y-2 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li><strong className="text-ink">適合時租：</strong>剛開始接案、兼職、客人量還不穩定；想在不同城市或地區試試看；只需要偶爾一個安靜的空間。</li>
            <li><strong className="text-ink">考慮月租：</strong>每週穩定排滿、每月使用時數明顯高於打平時數；需要固定擺放器材或做門面經營。</li>
            <li><strong className="text-ink">兩者並用：</strong>也可以先用時租確認地點和客源，再決定要不要長租。</li>
          </ul>
          <p className={`text-sm leading-7 text-black/60 ${NUM}`}>
            美睫師的比較（時租、分租、租位），見<Link href="/guides/lash-artist-studio" className="text-brand underline underline-offset-4">美睫師租工作室</Link>。
          </p>
        </Section>

        <FaqBlock id="faq" title="時租和月租常見問題" items={faq} />

        <LinkChips id="more" title="繼續看" links={TOPIC_LINKS.filter((link) => link.href !== PAGE_PATH)} />

        <section className="sb-card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">下載 SoloBeauté App 看空間</h2>
          <p className="text-sm leading-7 text-black/65">在 App 裡可以看每個空間的時租、半日、全日價和最低時數，直接傳訊息給屋主確認時段。</p>
          <StoreButtons buttonClassName="btn-dark" />
        </section>
      </div>
    </main>
  )
}
