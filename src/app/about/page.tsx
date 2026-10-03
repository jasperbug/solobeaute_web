import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs, LinkChips, NUM, Prose, Section, TOPIC_LINKS } from '@/components/content/ContentBlocks'
import { JsonLd } from '@/components/spaces/JsonLd'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { dataDateLabel } from '@/lib/cityPages'
import { INSTAGRAM_URL, SITE_URL, THREADS_URL } from '@/lib/constants'
import { AUTHORS, ORGANIZATION_ID, personId, personSchema } from '@/lib/editorial'
import { buildPriceReport, type PriceReport } from '@/lib/priceReport'
import { fetchPublicSpaces, formatNtd } from '@/lib/spaces'

export const revalidate = 3600

const PAGE_PATH = '/about'
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`
const TITLE = '關於 SoloBeauté｜由工程師和美容職人共同創辦'
const DESCRIPTION =
  'SoloBeauté 是台灣的美業空間時租 App，由工程師 Jasper Tsai 和美容職人 Meigo Liu 共同創辦，讓美業職人按小時租用屋主已經備好的工作空間。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: { title: TITLE, description: DESCRIPTION, siteName: 'SoloBeauté', type: 'website', locale: 'zh_TW', url: PAGE_URL, images: ['/og-image.png'] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og-image.png'] },
}

// Bios: same wording as the homepage 「關於我們」 section (zh-TW.json about.*).
const BIOS: Record<string, string> = {
  'jasper-tsai': '把產品、系統和網站一個一個搭起來，目標很直接：讓這個產業少一點阻力，多一點可以開始做事的工具。',
  'meigo-liu': '長期在台灣美業第一線工作，理解職人每天的工作節奏，也知道哪些流程真的有幫助，哪些只是增加負擔。',
}

async function loadReport(): Promise<PriceReport | null> {
  try {
    return buildPriceReport(await fetchPublicSpaces())
  } catch (error) {
    console.error('[about] space data unavailable:', error)
    return null
  }
}

export default async function AboutPage() {
  const report = await loadReport()
  const dateLabel = dataDateLabel()
  // Jasper first on /about (engineer + beauty professional), matching the homepage order.
  const founders = ['jasper-tsai', 'meigo-liu']
    .map((slug) => AUTHORS.find((author) => author.slug === slug))
    .filter((author): author is (typeof AUTHORS)[number] => Boolean(author))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': `${PAGE_URL}#page`,
        name: '關於 SoloBeauté',
        url: PAGE_URL,
        inLanguage: 'zh-TW',
        description: DESCRIPTION,
        isPartOf: { '@type': 'WebSite', name: 'SoloBeauté', url: SITE_URL },
        mainEntity: { '@id': ORGANIZATION_ID },
      },
      {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: 'SoloBeauté',
        alternateName: ['Solobeaute', 'SoloBeaute'],
        url: SITE_URL,
        logo: `${SITE_URL}/images/brand/logo.png`,
        founder: founders.map((author) => ({ '@id': personId(author) })),
        sameAs: [INSTAGRAM_URL, THREADS_URL],
      },
      ...founders.map((author) => ({ ...personSchema(author), description: BIOS[author.slug] })),
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '關於我們', item: PAGE_URL },
        ],
      },
    ],
  }

  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <JsonLd data={jsonLd} />
      <div className="container max-w-3xl space-y-12">
        <Breadcrumbs items={[{ label: '首頁', href: '/' }, { label: '關於我們' }]} />

        <header className="space-y-5">
          <p className="section-tag">關於我們</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">關於 SoloBeauté</h1>
          <Prose>
            <p data-about-lead>
              SoloBeauté 是台灣的美業空間時租 App：美甲、美睫、美容、紋繡等美業職人，可以按小時租用屋主已經備好的工作空間；有閒置美容室或座位的屋主，可以把空著的時段租出去。
            </p>
            <p>SoloBeauté 由一位工程師和一位美容職人共同創辦。一個懂技術，一個懂台灣美業現場，我們做的是一個真的能讓職人開始接案、讓屋主開始出租的工具。</p>
          </Prose>
        </header>

        <Section id="founders" title="創辦團隊">
          <div className="grid gap-5 md:grid-cols-2">
            {founders.map((author) => (
              <article key={author.slug} id={author.slug} className="sb-card scroll-mt-28 space-y-2 p-6">
                <h3 className="text-lg font-semibold text-ink">{author.name}</h3>
                <p className="text-sm text-brand">{author.jobTitle}・SoloBeauté 共同創辦人</p>
                <p className="text-sm leading-7 text-black/65">{BIOS[author.slug]}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section id="what-we-do" title="我們在做什麼">
          <ul className={`list-disc space-y-2 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li><strong className="text-ink">美業職人：</strong>在 App 裡找空間、看價格和設備，直接傳訊息給屋主、送出預約；租金現場付給屋主。也可以建立自己的品牌頁。</li>
            <li><strong className="text-ink">空間屋主：</strong>把閒置的時段上架，自己訂價格和規則，每筆預約自己決定接受或拒絕。詳見<Link href="/hosts" className="text-brand underline underline-offset-4">屋主出租說明</Link>。</li>
            <li><strong className="text-ink">消費者：</strong>線上預約還沒開放；目前可以在網站上看職人的品牌頁，再透過職人自己的管道聯繫。</li>
          </ul>
        </Section>

        {report && report.total > 0 && report.hourly.median !== null ? (
          <Section id="numbers" title="目前的數字">
            <p className={`text-base leading-8 text-black/70 ${NUM}`}>
              截至 {dateLabel}，SoloBeauté 上架中的美業空間有 {report.total} 間，分布在 {report.cityCount} 個縣市，時租中位數 {formatNtd(report.hourly.median)}。完整統計見<Link href="/spaces/price-report" className="text-brand underline underline-offset-4">2026 台灣美業空間時租行情</Link>。
            </p>
          </Section>
        ) : null}

        <Section id="name" title="名稱">
          <p className={`text-base leading-8 text-black/70 ${NUM}`}>
            正式名稱是「SoloBeauté」（最後的 é 有重音），App Store 上寫作「Solobeaute」，兩種寫法都是同一個服務。SoloBeauté 和國外的 Solo Beauty、Soo Beauté 是不同的服務，彼此沒有關係。
          </p>
        </Section>

        <Section id="contact" title="聯絡我們">
          <p className={`text-base leading-8 text-black/70 ${NUM}`}>
            問題與合作可以到<Link href="/support" className="text-brand underline underline-offset-4">支援中心</Link>，或在 <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer me" className="text-brand underline underline-offset-4">Instagram</a>、<a href={THREADS_URL} target="_blank" rel="noopener noreferrer me" className="text-brand underline underline-offset-4">Threads</a>（@_solobeaute_）找到我們。
          </p>
          <StoreButtons buttonClassName="btn-dark" />
        </Section>

        <LinkChips id="more" title="繼續看" links={TOPIC_LINKS.filter((link) => link.href !== PAGE_PATH)} />
      </div>
    </main>
  )
}
