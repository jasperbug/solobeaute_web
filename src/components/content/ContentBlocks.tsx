import Link from 'next/link'
import type { ReactNode } from 'react'

import { localizePath } from '@/i18n/config'
import { AUTHORS } from '@/lib/editorial'

// Small server components shared by the content pages (price report, guides,
// /hosts, /about). Plain markup only — no client JS.

export const NUM = '[font-family:var(--font-body)] lining-nums tabular-nums'

export function Breadcrumbs({ items, label = '麵包屑' }: { items: Array<{ label: string; href?: string }>; label?: string }) {
  return (
    <nav aria-label={label} className="text-sm text-black/55">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1">
            {index > 0 ? <span aria-hidden="true">›</span> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-brand">{item.label}</Link>
            ) : (
              <span aria-current="page" className="text-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
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

export function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section className="scroll-mt-28 space-y-4" id={id} aria-labelledby={`${id}-title`}>
      <div className="space-y-1">
        <h2 id={`${id}-title`} className="section-title">{title}</h2>
        {note ? <p className={`text-sm text-black/55 ${NUM}`}>{note}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className={`space-y-3 text-base leading-8 text-black/70 ${NUM}`}>{children}</div>
}

export type QA = { question: string; answer: string; links?: Array<{ text: string; href: string }> }

/** Answer text with given substrings turned into links (text stays identical to JSON-LD). */
function LinkedText({ text, links }: { text: string; links?: QA['links'] }) {
  if (!links || links.length === 0) return <>{text}</>
  const out: ReactNode[] = []
  let rest = text
  let key = 0
  while (rest.length > 0) {
    let next: { index: number; link: { text: string; href: string } } | null = null
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
      <Link key={key++} href={next.link.href} className="text-brand underline underline-offset-4">{next.link.text}</Link>
    )
    rest = rest.slice(next.index + next.link.text.length)
  }
  return <>{out}</>
}

export function FaqBlock({ id, title, items }: { id: string; title: string; items: QA[] }) {
  return (
    <section className="sb-card scroll-mt-28 space-y-5 p-6 md:p-8" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-xl font-semibold text-ink">{title}</h2>
      <div className="space-y-5" data-faq-block>
        {items.map((item) => (
          <div key={item.question} className="space-y-2">
            <h3 className="text-base font-semibold text-ink">{item.question}</h3>
            <p className={`text-sm leading-7 text-black/65 ${NUM}`}>
              <LinkedText text={item.answer} links={item.links} />
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function faqPageSchema(id: string, items: QA[], inLanguage: 'zh-TW' | 'en' = 'zh-TW') {
  return {
    '@type': 'FAQPage',
    '@id': id,
    inLanguage,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

/** 「撰文：Meigo Liu（美容職人）、Jasper Tsai（工程師）」 with links to /about. */
export function Byline({ updatedIso, updatedLabel, prefix = '撰文與資料整理' }: { updatedIso?: string; updatedLabel?: string; prefix?: string }) {
  return (
    <p className={`text-sm leading-7 text-black/60 ${NUM}`} data-byline>
      {prefix}：
      {AUTHORS.map((author, index) => (
        <span key={author.slug}>
          {index > 0 ? '、' : null}
          <Link href={`/about#${author.slug}`} className="text-ink underline-offset-4 hover:text-brand hover:underline">{author.name}</Link>
          （{author.jobTitle}）
        </span>
      ))}
      {updatedIso && updatedLabel ? (
        <>
          <span aria-hidden="true"> · </span>
          最後更新：<time dateTime={updatedIso}>{updatedLabel}</time>
        </>
      ) : null}
    </p>
  )
}

/** English byline: "Written and compiled by Meigo Liu (Beauty professional) and Jasper Tsai (Engineer)". */
export function BylineEn({ updatedIso, updatedLabel, prefix = 'Written and compiled by' }: { updatedIso?: string; updatedLabel?: string; prefix?: string }) {
  return (
    <p className={`text-sm leading-7 text-black/60 ${NUM}`} data-byline>
      {prefix}{' '}
      {AUTHORS.map((author, index) => (
        <span key={author.slug}>
          {index > 0 ? ' and ' : null}
          <Link href={`${localizePath('/about', 'en')}#${author.slug}`} className="text-ink underline-offset-4 hover:text-brand hover:underline">{author.name}</Link>
          {' '}({author.jobTitleEn})
        </span>
      ))}
      {updatedIso && updatedLabel ? (
        <>
          <span aria-hidden="true"> · </span>
          Last updated <time dateTime={updatedIso}>{updatedLabel}</time>
        </>
      ) : null}
    </p>
  )
}

export function LinkChips({ title, id, links }: { title: string; id: string; links: Array<{ href: string; label: string }> }) {
  return (
    <section className="space-y-4" aria-labelledby={id}>
      <h2 id={id} className="text-xl font-semibold text-ink">{title}</h2>
      <ul className={`flex flex-wrap gap-2 ${NUM}`}>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition hover:border-brand hover:text-brand">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Guide / topic pages linked from every content page (internal linking). */
export const TOPIC_LINKS: Array<{ href: string; label: string }> = [
  { href: '/spaces/price-report', label: '2026 美業空間時租行情' },
  { href: '/guides/lash-artist-studio', label: '美睫師租工作室' },
  { href: '/guides/hourly-vs-monthly-rent', label: '時租和月租怎麼比' },
  { href: '/hosts', label: '屋主出租閒置時段' },
  { href: '/spaces', label: '全部美業空間' },
  { href: '/faq', label: '常見問題' },
  { href: '/about', label: '關於 SoloBeauté' },
]

/** English versions of TOPIC_LINKS (all have an /en page). */
export const TOPIC_LINKS_EN: Array<{ href: string; label: string }> = [
  { href: '/spaces/price-report', label: '2026 hourly rental prices' },
  { href: '/guides/lash-artist-studio', label: 'Studios for lash artists' },
  { href: '/guides/hourly-vs-monthly-rent', label: 'Hourly vs monthly rent' },
  { href: '/hosts', label: 'For space hosts' },
  { href: '/spaces', label: 'All beauty workspaces' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About SoloBeauté' },
].map((link) => ({ ...link, href: localizePath(link.href, 'en') }))
