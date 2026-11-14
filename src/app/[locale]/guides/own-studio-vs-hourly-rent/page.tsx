import { setRequestLocale } from 'next-intl/server'
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
import { OwnStudioVsHourlyEn, ownStudioDescriptionEn, ownStudioTitleEn } from '@/components/en/OwnStudioVsHourlyEn'
import { JsonLd } from '@/components/spaces/JsonLd'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { dataDateISO } from '@/lib/cityPages'
import { SITE_URL } from '@/lib/constants'
import { AUTHORS, AUTHOR_REFS, PUBLISHER, personSchema, taipeiYear } from '@/lib/editorial'
import { buildPriceReport, formatShare, minimumHoursRow, type PriceReport } from '@/lib/priceReport'
import { SCENARIO_ASSUMPTION, USAGE_SCENARIOS, monthlyHourlyCost } from '@/lib/rentMath'
import { localeAlternates, localeUrl, ogLocale } from '@/lib/i18nSeo'
import { fetchPublicSpaces, formatNtd } from '@/lib/spaces'

// 自己開店（簽約月租店面）vs 按小時租現成美業空間. A decision page, not a
// competitor comparison. Only SoloBeauté's own listed hourly rates are data; no
// shop rent, deposit, fit-out or income figure is used anywhere (no public
// source), so the shop side is qualitative only. Same disclaimer rules as
// /guides/hourly-vs-monthly-rent.

export const revalidate = 3600

const PAGE_PATH = '/guides/own-studio-vs-hourly-rent'
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`
const PUBLISHED = '2026-11-11'
const UPDATED = '2026-11-11'
const UPDATED_LABEL = '2026 年 11 月 11 日'

function h1Text(): string {
  return `自己開美容工作室，還是按小時租美業空間？${taipeiYear()} 比較`
}

function rangeText(report: PriceReport): string {
  const { min, max } = report.hourly
  if (min === null || max === null) return '—'
  return min === max ? formatNtd(min) : `${formatNtd(min)}–${max.toLocaleString('en-US')}`
}

function description(report: PriceReport | null): string {
  if (!report || report.hourly.median === null) {
    return '自己開美容工作室還是按小時租？比較開店常見的合約、押金、裝潢與固定月租，和按小時租屋主備好的美業空間有什麼不同，附比較清單。'
  }
  return `自己開美容工作室還是按小時租？比較開店常見的合約、押金、裝潢與固定月租，和 SoloBeauté ${report.total} 間美業空間按小時租（時租中位數 ${formatNtd(report.hourly.median)}）的差別，附示意試算與比較清單。`
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  setRequestLocale(params.locale)
  const isEn = (await getLocale()) === 'en'
  const describe = isEn ? ownStudioDescriptionEn : description
  let desc = describe(null)
  try {
    desc = describe(buildPriceReport(await fetchPublicSpaces()))
  } catch (error) {
    console.error('[own-studio-vs-hourly] metadata fallback:', error)
  }
  const title = isEn ? ownStudioTitleEn() : `自己開店 vs 按小時租美業空間｜${taipeiYear()} 美容工作室比較`
  const social = isEn ? `${title} | SoloBeauté` : `${title}｜SoloBeauté`
  return {
    title,
    description: desc,
    alternates: localeAlternates(PAGE_PATH, isEn ? 'en' : 'zh-TW'),
    openGraph: { title: social, description: desc, siteName: 'SoloBeauté', type: 'article', ...ogLocale(isEn ? 'en' : 'zh-TW'), url: localeUrl(PAGE_PATH, isEn ? 'en' : 'zh-TW'), images: ['/og-image.png'] },
    twitter: { card: 'summary_large_image', title: social, description: desc, images: ['/og-image.png'] },
  }
}

export default async function OwnStudioVsHourlyPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  const report = buildPriceReport(await fetchPublicSpaces())
  if ((await getLocale()) === 'en') return <OwnStudioVsHourlyEn report={report} />
  const h1 = h1Text()
  const desc = description(report)
  const median = report.hourly.median
  const two = minimumHoursRow(report, 2)
  const dateISO = dataDateISO()

  const faq: QA[] = [
    {
      question: '自己開美容工作室和按小時租，哪個比較划算？',
      answer: median !== null
        ? `看你每個月實際用幾小時，以及你拿到的店面條件。可以用「打平時數 ＝ 每月固定支出 ÷ 時租」來比：以 SoloBeauté 上架空間的時租中位數 ${formatNtd(median)} 示意，每月用的時數低於「每月固定支出 ÷ ${median}」，按小時租的總額比較低。本頁不提供店面月租、押金或裝潢費數字，請用你實際拿到的報價代入。`
        : '看你每個月實際用幾小時，以及你拿到的店面條件。可以用「打平時數 ＝ 每月固定支出 ÷ 時租」來比。本頁不提供店面月租、押金或裝潢費數字，請用你實際拿到的報價代入。',
    },
    {
      question: '按小時租美業空間怎麼算錢、怎麼付款？',
      answer: `依租用的時數計算，時租、半日、全日價由屋主自己訂，標在空間頁和 App 裡${two ? `；${report.total} 間中有 ${two.count} 間最低租用 2 小時` : ''}。美業職人在 SoloBeauté App 傳訊息給屋主確認時段，租金現場付現給屋主。`,
    },
    {
      question: '每個月只接幾位客人，按小時租大概要花多少？',
      answer: median !== null
        ? `示意試算：以時租中位數 ${formatNtd(median)}、每位客人租 2 小時計，每週 1 位客人（每月 8 小時）約 ${formatNtd(monthlyHourlyCost(8, median))}，每週 2 位（每月 16 小時）約 ${formatNtd(monthlyHourlyCost(16, median))}。這是用公開標價做的試算，不是報價，實際以各空間的價格為準。`
        : '用「時租 × 每月時數」估算，每個空間的時租以空間頁和 App 為準。',
    },
    {
      question: '已經有自己的工作室，可以把空閒時段租出去嗎？',
      answer: '可以在 SoloBeauté App 自行上架空間，自己決定可出租的時段和價格。實際出租情況依地點與需求而定，詳細流程見屋主出租閒置時段。',
      links: [{ text: '屋主出租閒置時段', href: '/hosts' }],
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
          { '@type': 'ListItem', position: 3, name: '自己開店還是按小時租', item: PAGE_URL },
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
        <Breadcrumbs items={[{ label: '首頁', href: '/' }, { label: '時租行情', href: '/spaces/price-report' }, { label: '自己開店還是按小時租' }]} />

        <header className="space-y-5">
          <p className="section-tag">開店・時租比較</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">{h1}</h1>
          <Prose>
            <p data-ai-summary>
              自己開店通常要找店面、簽租約、付押金、裝潢，之後每個月有固定租金；按小時租則是使用屋主已經備好設備的空間，只租要用的時段。
              {median !== null
                ? `截至資料更新日，SoloBeauté 上架中的 ${report.total} 間美業空間時租 ${rangeText(report)}、中位數 ${formatNtd(median)}，美業職人在 App 傳訊息給屋主確認時段，租金現場付現。`
                : '在 SoloBeauté，美業職人在 App 傳訊息給屋主確認時段，租金現場付現。'}
              本頁不提供店面月租、押金或裝潢費數字，時租試算只是示意。
            </p>
            <p className={`text-sm font-medium text-ink ${NUM}`} data-ai-summary-date>
              資料更新：<time dateTime={dateISO}>{dateISO}</time>
            </p>
          </Prose>
          <Byline updatedIso={UPDATED} updatedLabel={UPDATED_LABEL} />
        </header>

        <Section id="compare" title="自己開店和按小時租，差在哪裡">
          <DataTable
            caption="自己開店與按小時租比較"
            head={['比較項目', '自己開店（簽約租店面）', '按小時租（SoloBeauté）']}
            rows={[
              ['開始前', '通常要找店面、簽租約、付押金，自己裝潢、買設備', '屋主已經備好空間和設備，設備以空間頁列出的為準'],
              ['固定支出', '每月固定租金，有沒有客人都要付；水電、管理費等依合約', '只付租用的時段；時租、半日、全日價標在空間頁'],
              ['合約', '合約期間、提前解約、押金退還等條件依房東合約', '按時段租用，最低時數、取消等條件由屋主設定，以空間頁和 App 說明為準'],
              ['時段', '自己的店，營業時間自己決定', '熱門時段可能已被租走，要提早跟屋主確認'],
              ['門面和器材', '可以自己設計門面、固定擺放器材', '每次帶自己的器材，或用空間的設備'],
              ['地點', '固定一個地點', `可以在不同地區的空間接客；目前空間分布 ${report.cityCount} 個縣市`],
              ['付款', '依房東合約', '在 App 傳訊息給屋主確認時段，租金現場付現'],
            ]}
          />
          <p className={`text-sm leading-7 text-black/60 ${NUM}`}>
            店面月租、押金和裝潢費每個地點差很多，本頁沒有可靠的公開數字，所以不列；請用你實際拿到的報價比較。
          </p>
        </Section>

        {median !== null ? (
          <Section id="example" title="示意試算：按小時租每月大概花多少" note={`示意試算，不是報價。時租用 SoloBeauté 上架空間的時租中位數 ${formatNtd(median)}，${SCENARIO_ASSUMPTION}。`}>
            <DataTable
              caption="按小時租每月總額示意試算"
              head={['每月用量', '每月時數', `時租總額（${formatNtd(median)}／小時）`]}
              rows={USAGE_SCENARIOS.map((row) => [row.label, `${row.hours} 小時`, formatNtd(monthlyHourlyCost(row.hours, median))])}
            />
            <div className={`space-y-2 text-sm leading-7 text-black/70 ${NUM}`}>
              <p>
                <strong className="text-ink">怎麼跟開店比：</strong>把你拿到的店面每月固定支出（月租加上水電、管理費等）除以 {median}，得到打平時數，再看自己每月實際用幾小時。押金和裝潢是一次性的支出，要另外考慮。
              </p>
              <p>
                以上用的是屋主在 SoloBeauté 上的公開標價做示意，不是報價，也不代表你實際會有的收入或客源；實際花費依你租的空間和時數而定，屋主的實際出租率也依地點與需求而定。
              </p>
              {two ? <p>注意最低租用時數：{report.total} 間中有 {two.count} 間（{formatShare(two.share)}）最低租用 2 小時。</p> : null}
              <p>
                逐步算法和時租、月租比較清單，見<Link href="/guides/hourly-vs-monthly-rent" className="text-brand underline underline-offset-4">時租和月租怎麼比</Link>。
              </p>
            </div>
          </Section>
        ) : null}

        <Section id="when" title="什麼情況適合哪一種">
          <ul className={`list-disc space-y-2 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li><strong className="text-ink">適合按小時租：</strong>剛開始接案、兼職、客人量還不穩定；想先在不同城市或地區試試看；不想一開始就簽約和裝潢。</li>
            <li><strong className="text-ink">考慮自己開店：</strong>每週穩定排滿、每月使用時數明顯高於打平時數；需要固定門面、固定擺放器材，或想自己決定裝潢和營業時間。</li>
            <li><strong className="text-ink">兩者並用：</strong>可以先按小時租確認地點和客源，再決定要不要開店；已經有店的話，空閒時段也可以在 App 上架出租。</li>
          </ul>
          <p className={`text-sm leading-7 text-black/60 ${NUM}`}>
            時租、分租、租位的差別，見<Link href="/guides/lash-artist-studio#compare" className="text-brand underline underline-offset-4">美睫師租工作室：時租、分租、租位有什麼不同</Link>；看目前可以租的空間，見<Link href="/spaces" className="text-brand underline underline-offset-4">全部美業空間</Link>和<Link href="/spaces/price-report" className="text-brand underline underline-offset-4">美業空間時租行情</Link>；有空間想出租，見<Link href="/hosts" className="text-brand underline underline-offset-4">屋主出租閒置時段</Link>。
          </p>
        </Section>

        <FaqBlock id="faq" title="自己開店還是按小時租：常見問題" items={faq} />

        <LinkChips id="more" title="繼續看" links={TOPIC_LINKS.filter((link) => link.href !== PAGE_PATH)} />

        <section className="sb-card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">下載 SoloBeauté App 看空間</h2>
          <p className="text-sm leading-7 text-black/65">在 App 裡可以看每個空間的時租、半日、全日價和最低時數，直接傳訊息給屋主確認時段，租金現場付現。</p>
          <StoreButtons buttonClassName="btn-dark" />
        </section>
      </div>
    </main>
  )
}
