import { SPACE_CITIES, normalizeCityName } from './cities'
import { buildPriceReport } from './priceReport'
import { fetchPublicSpaces, formatNtd } from './spaces'
import type { PublicSpace } from './types'

// ---------------------------------------------------------------------------
// Live values for the FAQ copy (homepage FAQ + /faq). `faq.items` in
// zh-TW.json uses {placeholders}; fillFaqItems() replaces them so the visible
// text and the FAQPage JSON-LD are built from the same filled strings.
// ---------------------------------------------------------------------------

export type FaqFacts = {
  spaceCount: string
  cityCount: string
  cityList: string
  rateRange: string
  /** Interquartile range of hourly rates (nearest-rank, same as /spaces/price-report). */
  typicalRange: string
}

// Used ONLY when the public API cannot be reached, so the page still renders.
// Snapshot of 2026-10-03; normal renders always use live data.
const FALLBACK_FACTS: FaqFacts = {
  spaceCount: '17',
  cityCount: '7',
  cityList: '台北、新北、桃園、台中、高雄、彰化、南投',
  rateRange: 'NT$100–350',
  typicalRange: 'NT$150–200',
}

function range(min: number, max: number, approx = false): string {
  if (min === max) return approx ? `${formatNtd(min)} 左右` : formatNtd(min)
  return `${formatNtd(min)}–${max.toLocaleString('en-US')}`
}

export function computeFaqFacts(spaces: PublicSpace[]): FaqFacts | null {
  if (spaces.length === 0) return null
  const report = buildPriceReport(spaces)
  const cityNames = Array.from(new Set(spaces.map((s) => normalizeCityName(s.city)).filter(Boolean)))
  const order = (name: string) => {
    const index = SPACE_CITIES.findIndex((city) => city.name === name)
    return index === -1 ? SPACE_CITIES.length : index
  }
  const cityList = cityNames
    .sort((a, b) => order(a) - order(b) || a.localeCompare(b, 'zh-Hant'))
    .map((name) => SPACE_CITIES.find((city) => city.name === name)?.short ?? name)
    .join('、')
  if (report.hourly.min === null || report.hourly.max === null) return null
  const quart = report.hourlyQuartiles
  return {
    spaceCount: String(spaces.length),
    cityCount: String(cityNames.length),
    cityList,
    rateRange: range(report.hourly.min, report.hourly.max),
    typicalRange: quart ? range(quart.q1, quart.q3, true) : range(report.hourly.min, report.hourly.max, true),
  }
}

export async function getFaqFacts(spaces?: PublicSpace[] | null): Promise<FaqFacts> {
  try {
    const list = spaces ?? (await fetchPublicSpaces())
    return computeFaqFacts(list) ?? FALLBACK_FACTS
  } catch (error) {
    console.error('[faq] live facts unavailable, using 2026-10 snapshot:', error)
    return FALLBACK_FACTS
  }
}

export function fillFaqText(text: string, facts: FaqFacts): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in facts ? facts[key as keyof FaqFacts] : match
  )
}

export function fillFaqItems<T extends { q: string; a: string }>(items: T[], facts: FaqFacts): T[] {
  return items.map((item) => ({ ...item, q: fillFaqText(item.q, facts), a: fillFaqText(item.a, facts) }))
}
