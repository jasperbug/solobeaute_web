import type { Metadata } from 'next'
import Link from 'next/link'

import {
  Breadcrumbs,
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
import { JsonLd } from '@/components/spaces/JsonLd'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { dataDateLabel } from '@/lib/cityPages'
import { SITE_URL } from '@/lib/constants'
import { ORGANIZATION_ID } from '@/lib/editorial'
import { buildPriceReport, formatShare, type PriceReport, type RateSummary } from '@/lib/priceReport'
import { fetchPublicSpaces, formatNtd } from '@/lib/spaces'

export const revalidate = 3600

const PAGE_PATH = '/hosts'
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`
const TITLE = '美容室閒置時段出租｜屋主上架說明與時租行情'
const DESCRIPTION =
  '有閒置的美容室、美睫或美甲座位？在 SoloBeauté App 上架，按小時租給美業職人。只上架空著的時段，每筆預約由你決定接受或拒絕，附其他屋主的時租標價分布。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: { title: `${TITLE}｜SoloBeauté`, description: DESCRIPTION, siteName: 'SoloBeauté', type: 'website', locale: 'zh_TW', url: PAGE_URL, images: ['/og-image.png'] },
  twitter: { card: 'summary_large_image', title: `${TITLE}｜SoloBeauté`, description: DESCRIPTION, images: ['/og-image.png'] },
}

function range(summary: Pick<RateSummary, 'min' | 'max'>): string {
  if (summary.min === null || summary.max === null) return '—'
  return summary.min === summary.max ? formatNtd(summary.min) : `${formatNtd(summary.min)}–${summary.max.toLocaleString('en-US')}`
}

function med(summary: RateSummary): string {
  return summary.count >= 2 && summary.median !== null ? formatNtd(summary.median) : '—'
}

// Same facts as the /faq 屋主 questions (faq.items + lib/faqPage.ts).
const FAQ: QA[] = [
  {
    question: '怎麼把空間出租給美業職人？',
    answer: '下載 SoloBeauté App 註冊成屋主，準備好空間照片、可出租的時段和時租價格就能上架。不太會拍照也沒關係，我們團隊可以協助拍攝和上架，整個過程大約 30 分鐘。',
  },
  {
    question: '店裡只有部分時段空著，也可以出租嗎？',
    answer: '可以。你只要上架閒置的時段，其他時間照常營業。每一筆預約你都可以接受或拒絕，也能設定自己的出租規則。',
  },
  {
    question: '上架空間要填哪些資料？',
    answer: '在 App 裡主要會填：空間照片（建議包含入口、室內和設備）、地址、空間類型（開放空間、拉簾隔間或獨立房間）、設備清單、適合和不開放的服務、時租價格（也可以另外設半日、全日價）、最低租用時數，以及空間內有沒有攝影機。官網上的空間頁只會顯示到縣市和區。',
  },
  {
    question: '租金怎麼收？',
    answer: '目前租金是職人到現場用現金直接付給屋主。進場前付還是做完再付，可以先在 App 裡跟職人講好。',
  },
]

function pricingLead(report: PriceReport, dateLabel: string): string {
  return `截至 ${dateLabel}，SoloBeauté 上架中的 ${report.total} 間空間，屋主標的時租 ${range(report.hourly)}，中位數 ${med(report.hourly)}；${report.halfDay.count} 間另設半日價、${report.fullDay.count} 間另設全日價。`
}

export default async function HostsPage() {
  const report = buildPriceReport(await fetchPublicSpaces())
  const dateLabel = dataDateLabel()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${PAGE_URL}#page`,
        name: '出租美容室閒置時段給美業職人',
        description: DESCRIPTION,
        url: PAGE_URL,
        inLanguage: 'zh-TW',
        isPartOf: { '@type': 'WebSite', name: 'SoloBeauté', url: SITE_URL },
        publisher: { '@id': ORGANIZATION_ID },
        audience: { '@type': 'Audience', audienceType: '美業空間屋主' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '屋主出租', item: PAGE_URL },
        ],
      },
      faqPageSchema(`${PAGE_URL}#faq`, FAQ),
    ],
  }

  const two = report.minimumHours.find((row) => row.label === '2 小時')

  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <JsonLd data={jsonLd} />
      <div className="container max-w-4xl space-y-12">
        <Breadcrumbs items={[{ label: '首頁', href: '/' }, { label: '屋主出租' }]} />

        <header className="space-y-5">
          <p className="section-tag">空間屋主</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">出租美容室閒置時段給美業職人</h1>
          <Prose>
            <p data-hosts-lead>
              有閒置的美容室、美睫床位或美甲座位，可以在 SoloBeauté App 上架，按小時租給美甲、美睫、美容、紋繡等美業職人。你只要上架空著的時段，其他時間照常營業；每一筆預約都由你決定接受或拒絕。
            </p>
            <p>{pricingLead(report, dateLabel)}</p>
          </Prose>
          <StoreButtons buttonClassName="btn-dark" />
        </header>

        <Section id="steps" title="上架流程">
          <ol className={`list-decimal space-y-3 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li>下載 SoloBeauté App，註冊成屋主。</li>
            <li>準備空間照片（入口、室內、設備）、可出租的時段和時租價格；不太會拍照的話，團隊可以協助拍攝和上架，大約 30 分鐘。</li>
            <li>填寫空間類型、設備清單、適合和不開放的服務、最低租用時數，以及空間內有沒有攝影機。</li>
            <li>美業職人在 App 裡看到你的空間，傳訊息詢問、送出預約；你確認後預約才成立。</li>
            <li>當天職人依約到場使用，租金在現場用現金付給你。</li>
          </ol>
        </Section>

        <Section id="you-decide" title="屋主可以自己決定的事">
          <ul className={`list-disc space-y-2 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li>價格：時租，也可以另外設半日、全日價。</li>
            <li>最低租用時數{two ? `（目前 ${report.total} 間中有 ${two.count} 間設 2 小時，占 ${formatShare(two.share)}）` : ''}。</li>
            <li>可以出租的日期和時段。</li>
            <li>適合和不開放的服務，以及出租規則。</li>
            <li>每一筆預約要接受或拒絕。</li>
          </ul>
        </Section>

        <Section id="pricing" title="其他屋主怎麼訂價" note={`依 SoloBeauté 上架中的 ${report.total} 間空間公開標價計算（資料日期：${dateLabel}），可作為訂價參考。`}>
          <DataTable
            caption="依空間類型的時租標價"
            head={['空間類型', '空間數', '時租區間', '中位數']}
            rows={report.byType.map((row) => [row.label, `${row.count} 間`, range(row), med(row)])}
          />
          <DataTable
            caption="半日與全日價"
            head={['方案', '有設定的空間', '價格區間', '中位數']}
            rows={[
              ['時租', `${report.hourly.count} 間`, range(report.hourly), med(report.hourly)],
              ['半日', `${report.halfDay.count} 間`, range(report.halfDay), med(report.halfDay)],
              ['全日', `${report.fullDay.count} 間`, range(report.fullDay), med(report.fullDay)],
            ]}
          />
          <p className={`text-sm leading-7 text-black/60 ${NUM}`}>
            依縣市、設備和適合服務的完整統計，見<Link href="/spaces/price-report" className="text-brand underline underline-offset-4">2026 台灣美業空間時租行情</Link>。
          </p>
        </Section>

        <Section id="privacy" title="屋主的隱私">
          <p className={`text-base leading-8 text-black/70 ${NUM}`}>
            官網上的空間頁只顯示縣市和區，不顯示門牌地址和屋主資料；完整位置請在 SoloBeauté App 查看。
          </p>
        </Section>

        <FaqBlock id="faq" title="屋主常見問題" items={FAQ} />

        <LinkChips id="more" title="繼續看" links={TOPIC_LINKS.filter((link) => link.href !== PAGE_PATH)} />
      </div>
    </main>
  )
}
