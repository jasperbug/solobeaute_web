import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { JsonLd } from '@/components/spaces/JsonLd'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { SITE_URL } from '@/lib/constants'
import { buildFaqGroups, flattenFaq, type FaqEntry, type FaqItem } from '@/lib/faqPage'
import { fillFaqItems, getFaqFacts } from '@/lib/faqStats'
import { fetchPublicSpaces } from '@/lib/spaces'
import type { PublicSpace } from '@/lib/types'

export const revalidate = 3600

const PAGE_URL = `${SITE_URL}/faq`
const TITLE = '常見問題｜美業空間時租、預約、付款、上架'
const OG_TITLE = 'SoloBeauté 常見問題'
const DESCRIPTION =
  '美業空間怎麼按小時租、怎麼預約和付款、可以取消嗎、屋主怎麼上架、職人品牌頁怎麼公開？SoloBeauté 常見問題一次看完。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: OG_TITLE,
    description: DESCRIPTION,
    siteName: 'SoloBeauté',
    type: 'website',
    locale: 'zh_TW',
    url: PAGE_URL,
    images: ['/og-image.png'],
  },
  twitter: { card: 'summary_large_image', title: OG_TITLE, description: DESCRIPTION, images: ['/og-image.png'] },
}

/** Render `a` with its link substrings as <Link>; the text content is unchanged. */
function AnswerText({ item }: { item: FaqEntry }) {
  const links = item.links ?? []
  if (links.length === 0) return <>{item.a}</>
  const out: ReactNode[] = []
  let rest = item.a
  let key = 0
  while (rest.length > 0) {
    let next: { index: number; link: (typeof links)[number] } | null = null
    for (const link of links) {
      const index = rest.indexOf(link.text)
      if (index !== -1 && (next === null || index < next.index)) next = { index, link }
    }
    if (!next) {
      out.push(rest)
      break
    }
    if (next.index > 0) out.push(rest.slice(0, next.index))
    out.push(
      <Link key={key++} href={next.link.href} className="text-brand underline underline-offset-4">
        {next.link.text}
      </Link>
    )
    rest = rest.slice(next.index + next.link.text.length)
  }
  return <>{out}</>
}

export default async function FaqPage() {
  // Always zh-TW (the site's only SEO language), even for an `en` cookie.
  const tFaq = await getTranslations({ locale: 'zh-TW', namespace: 'faq' })
  const home = tFaq.raw('items') as FaqItem[]

  let spaces: PublicSpace[] | null = null
  try {
    spaces = await fetchPublicSpaces()
  } catch (error) {
    console.error('[faq] space data unavailable, using text without counts:', error)
  }

  const groups = buildFaqGroups(fillFaqItems(home, await getFaqFacts(spaces)), spaces)
  const items = flattenFaq(groups)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        '@id': `${PAGE_URL}#faq`,
        name: OG_TITLE,
        url: PAGE_URL,
        inLanguage: 'zh-TW',
        mainEntity: items.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '常見問題', item: PAGE_URL },
        ],
      },
    ],
  }

  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <JsonLd data={jsonLd} />

      <div className="container max-w-3xl space-y-10">
        <nav aria-label="麵包屑" className="text-sm text-black/55">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-brand">首頁</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-ink">常見問題</li>
          </ol>
        </nav>

        <header className="space-y-4">
          <p className="section-tag">常見問題</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">SoloBeauté 常見問題</h1>
          <p className="text-base leading-8 text-black/65">
            SoloBeauté 是台灣的美業空間時租 App：美甲、美睫、美容、紋繡等美業職人，可以按小時租用屋主已經備好的工作空間。下面整理了找空間、預約、付款、屋主上架和職人品牌頁最常被問到的問題。
          </p>
          <nav aria-label="問題分類" className="flex flex-wrap gap-2 pt-1">
            {groups.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition hover:border-brand hover:text-brand"
              >
                {group.title}
              </a>
            ))}
          </nav>
        </header>

        <div className="space-y-10" data-faq-page>
          {groups.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-28 space-y-4" aria-labelledby={`${group.id}-title`}>
              <h2 id={`${group.id}-title`} className="section-title">{group.title}</h2>
              <div className="sb-card divide-y divide-black/5 px-6 md:px-8">
                {group.items.map((item) => (
                  <div key={item.q} className="space-y-2 py-5" data-faq-item>
                    <h3 className="text-base font-semibold leading-7 text-ink">{item.q}</h3>
                    <p className="text-sm leading-7 text-black/65 [font-family:var(--font-body)] lining-nums">
                      <AnswerText item={item} />
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="sb-card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">還有其他問題？</h2>
          <p className="text-sm leading-7 text-black/65">
            可以到<Link href="/support" className="text-brand underline underline-offset-4">支援中心</Link>聯絡我們，或下載 SoloBeauté App 直接看空間。
          </p>
          <StoreButtons buttonClassName="btn-dark" />
        </section>
      </div>
    </main>
  )
}
