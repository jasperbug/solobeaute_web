import type { Metadata } from 'next'
import Link from 'next/link'

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
import { JsonLd } from '@/components/spaces/JsonLd'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { dataDateLabel } from '@/lib/cityPages'
import { SITE_URL } from '@/lib/constants'
import { AUTHORS, AUTHOR_REFS, PUBLISHER, personSchema, taipeiYear } from '@/lib/editorial'
import { buildPriceReport, formatShare, spacesForProfession, type ProfessionRow, type RateSummary } from '@/lib/priceReport'
import { fetchPublicSpaces, formatNtd } from '@/lib/spaces'
import type { PublicSpace } from '@/lib/types'

export const revalidate = 3600

const PAGE_PATH = '/guides/lash-artist-studio'
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`
const PUBLISHED = '2026-10-03'
// Editorial update date (copy and sections); the numbers themselves are live.
const UPDATED = '2026-10-03'
const UPDATED_LABEL = '2026 年 10 月 3 日'

function h1Text(): string {
  return `${taipeiYear()} 美睫師租工作室：時租、分租、租位怎麼選`
}

function range(summary: Pick<RateSummary, 'min' | 'max'>): string {
  if (summary.min === null || summary.max === null) return '—'
  return summary.min === summary.max ? formatNtd(summary.min) : `${formatNtd(summary.min)}–${summary.max.toLocaleString('en-US')}`
}

function med(summary: RateSummary): string {
  return summary.count >= 2 && summary.median !== null ? formatNtd(summary.median) : '—'
}

function equipmentText(row: ProfessionRow): string {
  return row.equipment.filter((e) => e.count > 0).map((e) => `${e.count} 間有${e.label}`).join('、')
}

function leadText(row: ProfessionRow, total: number, dateLabel: string): string {
  if (row.count === 0) return `截至 ${dateLabel}，SoloBeauté 上架中的 ${total} 間美業空間裡，還沒有屋主標示適合美睫的空間。`
  const equipment = equipmentText(row)
  return `截至 ${dateLabel}，SoloBeauté 上架中的 ${total} 間美業空間裡，屋主標示適合嫁接睫毛或睫毛管理的有 ${row.count} 間（${formatShare(row.share)}），時租 ${range(row.hourly)}，中位數 ${med(row.hourly)}${equipment ? `；${equipment}` : ''}。`
}

function description(row: ProfessionRow | undefined, total: number): string {
  if (!row || row.count === 0) return '美睫師租工作室要多少錢？時租、分租、租位差在哪？依 SoloBeauté 上架空間的公開價格整理。'
  return `美睫師租工作室多少錢？SoloBeauté ${total} 間美業空間中有 ${row.count} 間適合美睫，時租 ${range(row.hourly)}、中位數 ${med(row.hourly)}。附縣市分布、時租／分租／租位比較與挑空間清單。`
}

async function load(): Promise<{ spaces: PublicSpace[]; lashSpaces: PublicSpace[]; row: ProfessionRow | undefined; total: number }> {
  const spaces = await fetchPublicSpaces()
  const report = buildPriceReport(spaces)
  return {
    spaces,
    lashSpaces: spacesForProfession(spaces, 'lash'),
    row: report.professions.find((p) => p.key === 'lash'),
    total: report.total,
  }
}

export async function generateMetadata(): Promise<Metadata> {
  let desc = description(undefined, 0)
  try {
    const { row, total } = await load()
    desc = description(row, total)
  } catch (error) {
    console.error('[lash-guide] metadata fallback:', error)
  }
  const title = `${taipeiYear()} 美睫師租工作室行情｜時租、分租、租位比較`
  return {
    title,
    description: desc,
    alternates: { canonical: PAGE_URL },
    openGraph: { title: `${title}｜SoloBeauté`, description: desc, siteName: 'SoloBeauté', type: 'article', locale: 'zh_TW', url: PAGE_URL, images: ['/og-image.png'] },
    twitter: { card: 'summary_large_image', title: `${title}｜SoloBeauté`, description: desc, images: ['/og-image.png'] },
  }
}

export default async function LashArtistStudioPage() {
  const { lashSpaces, row, total } = await load()
  const dateLabel = dataDateLabel()
  const h1 = h1Text()
  const desc = description(row, total)

  const cityRows = (row?.cities ?? []).map((city) => {
    const inCity = lashSpaces.filter((s) => (s.city ?? '').replace(/^臺/, '台') === city.label)
    const rates = inCity.map((s) => s.hourlyRate).filter((r): r is number => r !== null).sort((a, b) => a - b)
    const summary: RateSummary = {
      count: rates.length,
      min: rates.length ? rates[0] : null,
      max: rates.length ? rates[rates.length - 1] : null,
      median: rates.length ? (rates.length % 2 ? rates[(rates.length - 1) / 2] : Math.round((rates[rates.length / 2 - 1] + rates[rates.length / 2]) / 2)) : null,
    }
    return { city, summary }
  })

  const minTwo = row?.minTwoHours ?? 0
  const faq: QA[] = [
    {
      question: '美睫師租工作室一小時多少錢？',
      answer: row && row.count > 0
        ? `截至 ${dateLabel}，SoloBeauté 上適合美睫的 ${row.count} 間空間，時租 ${range(row.hourly)}，中位數 ${med(row.hourly)}${minTwo ? `；其中 ${minTwo} 間最低租用 2 小時` : ''}。價格由屋主自己訂，實際價格以各空間頁和 App 為準。`
        : '目前還沒有屋主標示適合美睫的空間，新空間陸續上架中。',
    },
    {
      question: '美睫師租位、分租和時租差在哪？',
      answer: '租位、分租常見的做法，是和店家談一個固定的床位、座位或時段，多半以月計，合約、押金和可用時段依各家而定。時租是有預約才租、按小時計價；SoloBeauté 上的空間會列出時租、最低租用時數、設備和適合的服務，在 App 傳訊息給屋主、送出預約，由屋主確認。',
    },
    {
      question: '哪些縣市有適合美睫的工作室可以按小時租？',
      answer: row && row.cities.length
        ? `目前在${row.cities.map((c) => `${c.short}（${c.count} 間）`).join('、')}。各縣市的空間列表和價格，可以看各縣市的美業空間頁。`
        : '目前還沒有屋主標示適合美睫的空間。',
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
        '@type': 'ItemList',
        '@id': `${PAGE_URL}#spaces`,
        name: '適合美睫的美業空間',
        numberOfItems: lashSpaces.length,
        itemListElement: lashSpaces.map((space, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${SITE_URL}/spaces/${space.id}`,
          name: space.title,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '美業空間', item: `${SITE_URL}/spaces` },
          { '@type': 'ListItem', position: 3, name: '美睫師租工作室', item: PAGE_URL },
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
        <Breadcrumbs items={[{ label: '首頁', href: '/' }, { label: '美業空間', href: '/spaces' }, { label: '美睫師租工作室' }]} />

        <header className="space-y-5">
          <p className="section-tag">美睫師・工作室租用</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">{h1}</h1>
          <Prose>
            <p data-guide-lead>{row ? leadText(row, total, dateLabel) : ''}</p>
            <p>剛開始接案、客人還不固定的美睫師，常在「租位」「分租」和「時租」之間猶豫。這一頁用 SoloBeauté 上架空間的公開價格，整理美睫師按小時租工作室的行情，並比較三種做法適合的情況。</p>
          </Prose>
          {row && row.count > 0 ? (
            <dl className={`grid grid-cols-2 gap-3 md:grid-cols-4 ${NUM}`}>
              {[
                { label: '適合美睫的空間', value: `${row.count} 間` },
                { label: '時租區間', value: range(row.hourly) },
                { label: '時租中位數', value: med(row.hourly) },
                { label: '有美容床', value: `${row.equipment.find((e) => e.label === '美容床')?.count ?? 0} 間` },
              ].map((fact) => (
                <div key={fact.label} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  <dt className="text-xs text-black/50">{fact.label}</dt>
                  <dd className="mt-1 text-base font-semibold text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <Byline updatedIso={UPDATED} updatedLabel={UPDATED_LABEL} />
          <p className={`text-xs leading-6 text-black/50 ${NUM}`}>
            數字依 SoloBeauté 上架中的空間每小時重新計算（資料日期：{dateLabel}），「適合美睫」以屋主標示的建議服務為準；樣本數少，僅供參考。全台統計見<Link href="/spaces/price-report" className="text-brand underline underline-offset-4">2026 台灣美業空間時租行情</Link>。
          </p>
        </header>

        {cityRows.length > 0 ? (
          <Section id="by-city" title="美睫工作室時租：依縣市" note="只有 1 間空間的縣市不計算中位數。">
            <DataTable
              caption="適合美睫的空間：依縣市"
              head={['縣市', '適合美睫的空間', '時租區間', '中位數']}
              rows={cityRows.map(({ city, summary }) => [
                <Link key={city.label} href={city.href} className="text-brand underline-offset-4 hover:underline">{city.label}</Link>,
                `${city.count} 間`,
                range(summary),
                med(summary),
              ])}
            />
          </Section>
        ) : null}

        <Section id="compare" title="時租、分租、租位有什麼不同">
          <DataTable
            caption="時租、分租、租位比較"
            head={['', '時租', '分租／租位']}
            rows={[
              ['怎麼計價', '按小時，有預約才租', '常見以月計，依各家而定'],
              ['使用時段', '每次預約時選', '常見是固定時段或固定位子'],
              ['合約', '按小時租，不簽長約', '依各家合約而定，先問清楚'],
              ['器材擺放', '每次自己帶，或用空間的設備', '固定位子比較容易放自己的器材'],
              ['適合誰', '客人還不固定、想先試地點', '每週固定排滿、需要固定位置'],
            ]}
          />
          <p className={`text-sm leading-7 text-black/60 ${NUM}`}>
            分租、租位的條件每家差很多，表格只列常見做法，實際以對方提供的條件為準。想算清楚哪一種比較划算，見<Link href="/guides/hourly-vs-monthly-rent" className="text-brand underline underline-offset-4">時租和月租怎麼比</Link>。
          </p>
        </Section>

        <Section id="how-to-choose" title="美睫師怎麼選">
          <ul className={`list-disc space-y-2 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li><strong className="text-ink">剛開始接案、客人還不固定：</strong>按小時租，有客人再租，先在不同地點試試看客人的反應。</li>
            <li><strong className="text-ink">每週有固定的客人量：</strong>先算每個月實際會用幾小時，再拿分租或月租的報價來比，打平時數 ＝ 月租報價 ÷ 時租。</li>
            <li><strong className="text-ink">需要固定擺放器材、做長期經營：</strong>固定的分租位子比較方便；也可以先用時租確認地點，再決定要不要長租。</li>
          </ul>
        </Section>

        <Section id="checklist" title="美睫師挑工作室的檢查清單">
          <ul className={`list-disc space-y-2 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li>美容床和照明：嫁接睫毛需要客人平躺、光線充足，先看設備清單有沒有美容床、美容燈{row ? `（適合美睫的 ${row.count} 間中，${equipmentText(row)}）` : ''}。</li>
            <li>空間類型：獨立房間、拉簾隔間或開放空間，依客人對隱私的需求選。</li>
            <li>最低租用時數：一組睫毛大約要多久，先對照空間的最低時數{minTwo ? `（適合美睫的空間中，${minTwo} 間是 2 小時）` : ''}。</li>
            <li>攝影機：空間頁會標示屋主揭露的攝影機狀態。</li>
            <li>耗材和個人工具：沒有列在設備清單裡的東西，租之前先傳訊息跟屋主確認。</li>
          </ul>
        </Section>

        {lashSpaces.length > 0 ? (
          <section className="space-y-5" aria-labelledby="lash-spaces">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id="lash-spaces" className="section-title">適合美睫的美業空間</h2>
              <span className={`text-sm text-black/55 ${NUM}`}>共 {lashSpaces.length} 間</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {lashSpaces.map((space) => <SpaceCard key={space.id} space={space} />)}
            </div>
          </section>
        ) : null}

        <FaqBlock id="faq" title="美睫師租工作室常見問題" items={faq} />

        <LinkChips id="more" title="繼續看" links={TOPIC_LINKS.filter((link) => link.href !== PAGE_PATH)} />

        <section className="sb-card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">下載 SoloBeauté App 找美睫工作室</h2>
          <p className="text-sm leading-7 text-black/65">在 App 裡可以看每個空間的照片、設備和可預約時段，直接傳訊息給屋主確認。</p>
          <StoreButtons buttonClassName="btn-dark" />
        </section>
      </div>
    </main>
  )
}
