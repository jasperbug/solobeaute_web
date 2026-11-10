import type { PriceReport } from './priceReport'
import { formatNtd, spaceTypeLabel } from './spaces'

// ---------------------------------------------------------------------------
// Homepage host calculator: the three per-type hourly medians and the hint
// under it. Computed on the server from the same buildPriceReport() data as
// /spaces/price-report, then passed to the client CalculatorSection as props.
// `calculator.hint` in the messages is a {placeholder} template (stripped from
// the client messages in app/[locale]/layout.tsx).
// ---------------------------------------------------------------------------

export type CalculatorRates = { open: number; curtain: number; private: number }
export type CalculatorData = { rates: CalculatorRates; hint: string }

type HintFacts = {
  dateISO: string
  total: number
  open: number
  curtain: number
  private: number
  min: number
  max: number
  median: number
}

// FALLBACK ONLY: used when the public API cannot be reached, so the calculator
// still works. Snapshot of /spaces/price-report on 2026-11-10; the hint then
// names that date. Normal renders always use live data.
const FALLBACK_FACTS: HintFacts = {
  dateISO: '2026-11-10',
  total: 18,
  open: 170,
  curtain: 200,
  private: 210,
  min: 100,
  max: 350,
  median: 200,
}

function typeMedian(report: PriceReport, type: 'OPEN_SPACE' | 'CURTAIN_PARTITION' | 'PRIVATE_ROOM'): number | null {
  return report.byType.find((row) => row.label === spaceTypeLabel(type))?.median ?? null
}

function liveFacts(report: PriceReport, dateISO: string): HintFacts | null {
  const { min, max, median } = report.hourly
  if (report.total === 0 || min === null || max === null || median === null) return null
  return {
    dateISO,
    total: report.total,
    // A type with no listed space falls back to the overall median.
    open: typeMedian(report, 'OPEN_SPACE') ?? median,
    curtain: typeMedian(report, 'CURTAIN_PARTITION') ?? median,
    private: typeMedian(report, 'PRIVATE_ROOM') ?? median,
    min,
    max,
    median,
  }
}

function fillHint(template: string, facts: HintFacts): string {
  const values: Record<string, string> = {
    dateISO: facts.dateISO,
    total: String(facts.total),
    openMedian: formatNtd(facts.open),
    curtainMedian: formatNtd(facts.curtain),
    privateMedian: formatNtd(facts.private),
    hourlyRange: facts.min === facts.max ? formatNtd(facts.min) : `${formatNtd(facts.min)}–${facts.max.toLocaleString('en-US')}`,
    hourlyMedian: formatNtd(facts.median),
  }
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)
}

export function buildCalculatorData(report: PriceReport | null, dateISO: string, hintTemplate: string): CalculatorData {
  const facts = (report && liveFacts(report, dateISO)) ?? FALLBACK_FACTS
  return {
    rates: { open: facts.open, curtain: facts.curtain, private: facts.private },
    hint: fillHint(hintTemplate, facts),
  }
}
