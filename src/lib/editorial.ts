import { SITE_URL } from './constants'

// ---------------------------------------------------------------------------
// Shared editorial facts for the content pages (price report, guides, /about,
// /hosts, /en): authors, the price report's citation line and its update date.
// ---------------------------------------------------------------------------

export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const ABOUT_PATH = '/about'
export const PRICE_REPORT_PATH = '/spaces/price-report'
export const PRICE_REPORT_URL = `${SITE_URL}${PRICE_REPORT_PATH}`
export const PRICE_REPORT_NAME = '2026 台灣美業空間時租行情'

/**
 * Last editorial update of /spaces/price-report (text, sections, checked
 * numbers). Bump this by hand when the copy or the headline numbers change —
 * it is deliberately NOT the render time, so `dateModified` stays stable.
 */
export const REPORT_UPDATED_ISO = '2026-10-03'
export const REPORT_UPDATED_LABEL = '2026 年 10 月 3 日'
export const REPORT_UPDATED_LABEL_EN = 'October 3, 2026'

export type Author = {
  slug: string
  name: string
  jobTitle: string
  jobTitleEn: string
  /** One-line background shown in bylines. */
  bio: string
}

// Text-only (no photos). Same people as the homepage Organization `founder`.
export const AUTHORS: Author[] = [
  {
    slug: 'meigo-liu',
    name: 'Meigo Liu',
    jobTitle: '美容職人',
    jobTitleEn: 'Beauty professional',
    bio: 'SoloBeauté 共同創辦人，長期在台灣美業第一線工作',
  },
  {
    slug: 'jasper-tsai',
    name: 'Jasper Tsai',
    jobTitle: '工程師',
    jobTitleEn: 'Engineer',
    bio: 'SoloBeauté 共同創辦人，負責產品、系統與資料整理',
  },
]

export function personId(author: Author): string {
  return `${SITE_URL}${ABOUT_PATH}#${author.slug}`
}

export function personSchema(author: Author, lang: 'zh' | 'en' = 'zh') {
  return {
    '@type': 'Person',
    '@id': personId(author),
    name: author.name,
    jobTitle: lang === 'en' ? author.jobTitleEn : author.jobTitle,
    url: `${SITE_URL}${ABOUT_PATH}#${author.slug}`,
    worksFor: { '@id': ORGANIZATION_ID },
  }
}

/** Short references for `author` once the full Person nodes are in the graph. */
export const AUTHOR_REFS = AUTHORS.map((author) => ({ '@type': 'Person', '@id': personId(author), name: author.name }))

export const PUBLISHER = {
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: 'SoloBeauté',
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/brand/logo.png` },
}

export function citationText(dateLabel: string): string {
  return `SoloBeauté〈${PRICE_REPORT_NAME}〉，最後更新 ${dateLabel}，${PRICE_REPORT_URL}`
}

/** Taipei calendar year, e.g. "2026". */
export function taipeiYear(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', year: 'numeric' }).format(now)
}
