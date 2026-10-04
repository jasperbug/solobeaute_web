import Link from 'next/link'
import type { ReactNode } from 'react'

import {
  BylineEn,
  DataTable,
  FaqBlock,
  NUM,
  Section as ContentSection,
  faqPageSchema,
  type QA,
} from '@/components/content/ContentBlocks'
import { JsonLd } from '@/components/spaces/JsonLd'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { localizePath } from '@/i18n/config'
import { SITE_URL } from '@/lib/constants'
import {
  AUTHORS,
  AUTHOR_REFS,
  ORGANIZATION_ID,
  PUBLISHER,
  REPORT_UPDATED_ISO,
  REPORT_UPDATED_LABEL_EN,
  personSchema,
  taipeiYear,
} from '@/lib/editorial'
import {
  BAND_EN,
  EQUIPMENT_EN,
  PROFESSION_EN,
  REPORT_SERVICE_EN,
  REPORT_SERVICE_SHORT_EN,
  cityNameEn,
  cityShortEn,
  equipmentEn,
  hoursLabelEn,
  joinEn,
  monthYearEn,
  spaceTypeLabelEn,
} from '@/lib/en'
import { localeUrl } from '@/lib/i18nSeo'
import { formatShare, minimumHoursRow, type PriceReport, type ProfessionRow, type RateSummary } from '@/lib/priceReport'
import { USAGE_SCENARIOS, monthlyHourlyCost } from '@/lib/rentMath'
import { formatNtd } from '@/lib/spaces'

// English version of /spaces/price-report (served at /en/spaces/price-report).
// Same sections and the same live numbers as the zh-TW page; nothing is
// hard-coded. This replaces the old standalone English summary at /en.

const PAGE_PATH = '/spaces/price-report'
const PAGE_URL = localeUrl(PAGE_PATH, 'en')
const ZH_URL = localeUrl(PAGE_PATH, 'zh-TW')
const FIRST_PUBLISHED = '2026-10-03'
export const PRICE_REPORT_NAME_EN = 'Taiwan Beauty Workspace Hourly Rental Prices'
const en = (path: string) => localizePath(path, 'en')

export function priceReportH1En(): string {
  return `${taipeiYear()} Taiwan beauty workspace hourly rental prices`
}

export function priceReportTitleEn(): string {
  return `${taipeiYear()} Taiwan Beauty Workspace Hourly Rental Prices | Beauty Studio Rates`
}

export const PRICE_REPORT_FALLBACK_DESCRIPTION_EN =
  'Hourly rental prices for beauty workspaces in Taiwan, calculated from the public prices of spaces listed on SoloBeauté: range, median, space type, city, half-day and full-day rates, minimum hours, equipment and suitable services.'

function rangeText(summary: Pick<RateSummary, 'min' | 'max'>): string {
  if (summary.min === null || summary.max === null) return '—'
  return summary.min === summary.max ? formatNtd(summary.min) : `${formatNtd(summary.min)}–${summary.max.toLocaleString('en-US')}`
}

function medianText(summary: Pick<RateSummary, 'median'>): string {
  return summary.median === null ? '—' : formatNtd(summary.median)
}

function professionMedian(row: ProfessionRow): string {
  return row.hourly.count >= 2 ? medianText(row.hourly) : '—'
}

function spaces(count: number): string {
  return `${count} ${count === 1 ? 'space' : 'spaces'}`
}

export function buildPriceReportDescriptionEn(report: PriceReport): string {
  return `Calculated from the public prices of ${report.total} beauty workspaces listed on SoloBeauté: ${rangeText(report.hourly)} per hour, median ${medianText(report.hourly)}. With figures by space type, ${report.cityCount} cities and counties, half-day and full-day rates, minimum hours, equipment and suitable services.`
}

function buildLead(report: PriceReport, dateLabel: string): string[] {
  const first: string[] = []
  first.push(`As of ${dateLabel}, ${report.total} beauty workspaces are listed on SoloBeauté, across ${report.cityCount} cities and counties in Taiwan.`)
  if (report.hourly.count > 0) {
    const quart = report.hourlyQuartiles
      ? `; the middle half of spaces charge ${formatNtd(report.hourlyQuartiles.q1)}–${report.hourlyQuartiles.q3.toLocaleString('en-US')}`
      : ''
    first.push(`Hourly rates run ${rangeText(report.hourly)}, with a median of ${medianText(report.hourly)}${quart}.`)
  }
  if (report.byType.length > 0) {
    first.push(`By space type, the median is ${joinEn(report.byType.map((row) => `${medianText(row)} for ${spaceTypeLabelEn(row.label).toLowerCase()}s`))}.`)
  }
  const second: string[] = []
  if (report.fullDay.count > 0) {
    const hours = report.fullDayHoursEquivalent !== null ? `, roughly ${report.fullDayHoursEquivalent} hours at the hourly rate` : ''
    second.push(`${spaces(report.fullDay.count)} also list a full-day rate (median ${medianText(report.fullDay)}${hours}).`)
  }
  if (report.halfDay.count > 0) {
    second.push(`${spaces(report.halfDay.count)} list a half-day rate (median ${medianText(report.halfDay)}).`)
  }
  const topServices = report.services.slice().sort((a, b) => b.count - a.count).slice(0, 3)
  if (topServices.length > 0) {
    second.push(`The services hosts most often mark as suitable are ${joinEn(topServices.map((row) => `${REPORT_SERVICE_SHORT_EN[row.label] ?? row.label} (${row.count})`))}.`)
  }
  return [first.join(' '), second.join(' ')].filter(Boolean)
}

function professionSentence(row: ProfessionRow, total: number): string {
  const names = PROFESSION_EN[row.key]
  if (row.count === 0) return `No host has marked a space as suitable for ${names?.services ?? row.serviceProse} yet.`
  const parts: string[] = []
  parts.push(`Of ${total} spaces, ${row.count} (${formatShare(row.share)}) are marked by hosts as suitable for ${names?.services ?? row.serviceProse}`)
  if (row.hourly.count > 0) {
    parts.push(row.hourly.count >= 2 ? `hourly rates run ${rangeText(row.hourly)}, median ${medianText(row.hourly)}` : `the hourly rate is ${rangeText(row.hourly)}`)
  }
  const equipment = row.equipment.filter((e) => e.count > 0).map((e) => `${e.count} have a ${equipmentEn(e.label).toLowerCase()}`)
  if (equipment.length) parts.push(joinEn(equipment))
  let text = `${parts.join('; ')}.`
  if (row.cities.length) text += ` They are in ${joinEn(row.cities.map((c) => `${cityShortEn(c.label)} (${c.count})`))}.`
  if (row.minTwoHours > 0) text += ` ${row.minTwoHours} of them have a 2-hour minimum booking.`
  if (row.halfDay.count > 0 || row.fullDay.count > 0) {
    const day: string[] = []
    if (row.halfDay.count > 0) day.push(`${row.halfDay.count} list a half-day rate (${row.halfDay.count >= 2 ? `median ${medianText(row.halfDay)}` : rangeText(row.halfDay)})`)
    if (row.fullDay.count > 0) day.push(`${row.fullDay.count} list a full-day rate (${row.fullDay.count >= 2 ? `median ${medianText(row.fullDay)}` : rangeText(row.fullDay)})`)
    text += ` ${joinEn(day)}.`
  }
  return text
}

const PROFESSION_NOTES: Record<ProfessionRow['key'], string> = {
  lash: 'Lash work usually needs a beauty bed and good lighting, so check the equipment list first.',
  nail: 'Fewer spaces suit nail work than lash work or facials; that is simply what is listed right now. Check for a nail table and chair and lighting before you book.',
  brow: 'Brow and lip embroidery needs a beauty bed and good lighting. Some spaces are also marked as suitable for brow tattoo removal or hairline micropigmentation; go by what each host marks on the space page.',
}

function buildReportFaq(report: PriceReport, dateLabel: string): QA[] {
  const lash = report.professions.find((p) => p.key === 'lash')
  const two = minimumHoursRow(report, 2)
  const quart = report.hourlyQuartiles ? `; the middle half of spaces charge ${formatNtd(report.hourlyQuartiles.q1)}–${report.hourlyQuartiles.q3.toLocaleString('en-US')}` : ''
  const others = report.minimumHours.filter((row) => row.label !== '2 小時')
  const median = report.hourly.median

  const items: QA[] = [
    {
      question: 'How much does it cost to rent a beauty studio by the hour in Taiwan?',
      answer: `As of ${dateLabel}, the ${report.total} beauty workspaces listed on SoloBeauté have a median hourly rate of ${medianText(report.hourly)} and a range of ${rangeText(report.hourly)}${quart}. Hosts set their own prices based on location, equipment and space type; the price on each space page and in the app is the one that applies.`,
    },
  ]
  if (lash) {
    const bed = lash.equipment.find((e) => e.label === '美容床')
    items.push({
      question: 'How much does it cost a lash artist to rent a studio?',
      answer: lash.count > 0
        ? `${spaces(lash.count)} (${formatShare(lash.share)}) are marked by hosts as suitable for eyelash extensions or lash care, at ${rangeText(lash.hourly)} per hour, median ${professionMedian(lash)}${bed && bed.count > 0 ? `; ${bed.count} of them have a beauty bed` : ''}. For a detailed comparison, see studios for lash artists.`
        : 'No host has marked a space as suitable for lash work yet.',
      links: [{ text: 'studios for lash artists', href: en('/guides/lash-artist-studio') }],
    })
  }
  items.push({
    question: 'What is the minimum booking time for a beauty workspace?',
    answer: two
      ? `${two.count} of ${report.total} spaces (${formatShare(two.share)}) have a 2-hour minimum booking${others.length ? `; ${joinEn(others.map((row) => `${row.count} have a ${hoursLabelEn(row.label).replace(/ hours?$/, '-hour')} minimum`))}` : ''}. Each space shows its minimum on the space page and in the app.`
      : `Each host sets a minimum booking time: ${joinEn(report.minimumHours.map((row) => `${hoursLabelEn(row.label)}: ${row.count}`))}.`,
  })
  items.push({
    question: 'How much are half-day and full-day rates?',
    answer: `${spaces(report.halfDay.count)} list a half-day rate (median ${medianText(report.halfDay)}) and ${spaces(report.fullDay.count)} list a full-day rate (median ${medianText(report.fullDay)}${report.fullDayHoursEquivalent !== null ? `, roughly ${report.fullDayHoursEquivalent} hours at the hourly rate` : ''}). How many hours a half or full day covers is explained on each space page and in the app.`,
  })
  items.push({
    question: 'Should I rent a beauty studio by the hour or by the month?',
    answer: median !== null
      ? `Start by estimating how many hours a month you will actually use. At the median hourly rate of ${formatNtd(median)}, 16 hours a month comes to about ${formatNtd(monthlyHourlyCost(16, median))}; divide a monthly quote you have received by ${median} to get the break-even hours. Below that many hours a month, renting by the hour costs less in total; above it, compare the monthly lease's other terms as well, such as the deposit and contract length. For the full worked example, see hourly vs monthly rent.`
      : 'Start by estimating how many hours a month you will actually use, then compare "hourly rate × hours" with the monthly quote. For the full worked example, see hourly vs monthly rent.',
    links: [{ text: 'hourly vs monthly rent', href: en('/guides/hourly-vs-monthly-rent') }],
  })
  return items
}

function taipeiMonthIso(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit' }).formatToParts(now)
  return `${parts.find((p) => p.type === 'year')?.value}-${parts.find((p) => p.type === 'month')?.value}`
}

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section className="space-y-4" aria-labelledby={id}>
      <div className="space-y-1">
        <h2 id={id} className="section-title">{title}</h2>
        {note ? <p className={`text-sm text-black/55 ${NUM}`}>{note}</p> : null}
      </div>
      {children}
    </section>
  )
}

const CHIP = 'inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition hover:border-brand hover:text-brand'

export function PriceReportEn({ report }: { report: PriceReport }) {
  const dateLabel = monthYearEn()
  const h1 = priceReportH1En()
  const description = buildPriceReportDescriptionEn(report)
  const lead = buildLead(report, dateLabel)
  const methodology = `Calculated from the public prices of the ${report.total} spaces listed on SoloBeauté; data as of ${dateLabel}.`
  const faq = buildReportFaq(report, dateLabel)
  const citation = `SoloBeauté, “${taipeiYear()} ${PRICE_REPORT_NAME_EN}”, last updated ${REPORT_UPDATED_LABEL_EN}, ${PAGE_URL}`
  const median = report.hourly.median
  const equipmentRows = report.equipment

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${PAGE_URL}#article`,
        headline: h1,
        description,
        inLanguage: 'en',
        url: PAGE_URL,
        mainEntityOfPage: PAGE_URL,
        datePublished: FIRST_PUBLISHED,
        dateModified: REPORT_UPDATED_ISO,
        author: AUTHOR_REFS,
        publisher: PUBLISHER,
        image: [`${SITE_URL}/og-image.png`],
        about: { '@id': `${PAGE_URL}#dataset` },
        translationOfWork: { '@id': `${ZH_URL}#article` },
      },
      {
        '@type': 'Dataset',
        '@id': `${PAGE_URL}#dataset`,
        name: `${h1} (public prices of spaces listed on SoloBeauté)`,
        description: `${description} ${methodology} The sample is small; for reference only.`,
        url: PAGE_URL,
        inLanguage: 'en',
        creator: { '@type': 'Organization', '@id': ORGANIZATION_ID, name: 'SoloBeauté', url: SITE_URL },
        datePublished: FIRST_PUBLISHED,
        dateModified: REPORT_UPDATED_ISO,
        citation,
        temporalCoverage: taipeiMonthIso(),
        spatialCoverage: { '@type': 'Place', name: 'Taiwan', address: { '@type': 'PostalAddress', addressCountry: 'TW' } },
        keywords: ['beauty workspace hourly rental', 'beauty studio rental Taiwan', 'lash studio hourly rent', 'brow embroidery studio rental', 'nail studio rental'],
        measurementTechnique: 'Aggregates the public list prices of active (ACTIVE) spaces on SoloBeauté; for an even count, the median is the average of the two middle values, rounded.',
        variableMeasured: [
          {
            '@type': 'PropertyValue',
            name: 'Hourly rate',
            unitText: 'TWD per hour',
            ...(report.hourly.min !== null ? { minValue: report.hourly.min, maxValue: report.hourly.max } : {}),
            ...(report.hourly.median !== null ? { value: report.hourly.median, description: 'Median' } : {}),
          },
          ...(report.halfDay.count > 0
            ? [{ '@type': 'PropertyValue', name: 'Half-day rate', unitText: 'TWD', minValue: report.halfDay.min, maxValue: report.halfDay.max, value: report.halfDay.median, description: 'Median' }]
            : []),
          ...(report.fullDay.count > 0
            ? [{ '@type': 'PropertyValue', name: 'Full-day rate', unitText: 'TWD', minValue: report.fullDay.min, maxValue: report.fullDay.max, value: report.fullDay.median, description: 'Median' }]
            : []),
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: localeUrl('/', 'en') },
          { '@type': 'ListItem', position: 2, name: 'Beauty workspaces', item: localeUrl('/spaces', 'en') },
          { '@type': 'ListItem', position: 3, name: 'Hourly rental prices', item: PAGE_URL },
        ],
      },
      faqPageSchema(`${PAGE_URL}#faq`, faq, 'en'),
      ...AUTHORS.map((author) => personSchema(author, 'en')),
    ],
  }

  const facts = [
    { label: 'Spaces listed', value: `${report.total}` },
    { label: 'Hourly range', value: rangeText(report.hourly) },
    { label: 'Median hourly rate', value: medianText(report.hourly) },
    report.hourlyQuartiles
      ? { label: 'Middle half', value: `${formatNtd(report.hourlyQuartiles.q1)}–${report.hourlyQuartiles.q3.toLocaleString('en-US')}` }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null)

  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <JsonLd data={jsonLd} />

      <div className="container max-w-4xl space-y-12">
        <nav aria-label="Breadcrumb" className="text-sm text-black/55">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href={en('/')} className="hover:text-brand">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href={en('/spaces')} className="hover:text-brand">Beauty workspaces</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-ink">Hourly rental prices</li>
          </ol>
        </nav>

        <header className="space-y-5">
          <p className="section-tag">Beauty workspace rental prices</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">{h1}</h1>
          <div className={`space-y-3 text-base leading-8 text-black/70 ${NUM}`} data-report-lead>
            {lead.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <p className={`text-sm font-medium text-ink ${NUM}`} data-report-updated>
            Last updated: <time dateTime={REPORT_UPDATED_ISO}>{REPORT_UPDATED_LABEL_EN}</time>
          </p>
          <BylineEn />
          <dl className={`grid grid-cols-2 gap-3 md:grid-cols-4 ${NUM}`} data-report-facts>
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                <dt className="text-xs text-black/50">{fact.label}</dt>
                <dd className="mt-1 text-base font-semibold text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <p className={`text-xs leading-6 text-black/50 ${NUM}`} data-report-method>
            {methodology} The sample is small and the numbers change as spaces are listed or unlisted, so treat them as a reference; the price on each space page and in the app is the one that applies.
          </p>
        </header>

        <Section id="bands" title="Hourly price distribution" note={`${spaces(report.hourly.count)} list an hourly rate`}>
          <DataTable
            caption="Hourly price distribution"
            head={['Hourly rate', 'Spaces', 'Share']}
            rows={report.hourlyBands.map((row) => [BAND_EN[row.label] ?? row.label, `${row.count}`, formatShare(row.share)])}
          />
        </Section>

        <Section id="by-type" title="By space type">
          <DataTable
            caption="Hourly rates by space type"
            head={['Type', 'Spaces', 'Hourly range', 'Median']}
            rows={report.byType.map((row) => [spaceTypeLabelEn(row.label), `${row.count}`, rangeText(row), medianText(row)])}
          />
        </Section>

        <Section id="by-city" title="By city" note="Select a city to see its spaces and common questions.">
          <DataTable
            caption="Hourly rates by city"
            head={['City / county', 'Spaces', 'Hourly range', 'Median']}
            rows={report.byCity.map((row) => [
              row.href ? <Link key={row.label} href={en(row.href)} className="text-brand underline-offset-4 hover:underline">{cityNameEn(row.label)}</Link> : cityNameEn(row.label),
              `${row.count}`,
              rangeText(row),
              row.count >= 2 ? medianText(row) : '—',
            ])}
          />
          <p className={`text-xs text-black/50 ${NUM}`}>No median is shown for cities with a single space.</p>
        </Section>

        <Section id="day-rates" title="Half-day and full-day rates" note="Some hosts also offer half-day and full-day prices; how many hours they cover is explained on each space page and in the app.">
          <DataTable
            caption="Hourly, half-day and full-day rates"
            head={['Plan', 'Spaces offering it', 'Range', 'Median']}
            rows={[
              ['Hourly', `${report.hourly.count}`, rangeText(report.hourly), medianText(report.hourly)],
              ['Half day', `${report.halfDay.count}`, rangeText(report.halfDay), medianText(report.halfDay)],
              ['Full day', `${report.fullDay.count}`, rangeText(report.fullDay), medianText(report.fullDay)],
            ]}
          />
          {report.fullDayHoursEquivalent !== null ? (
            <p className={`text-sm text-black/60 ${NUM}`}>
              For spaces with both an hourly and a full-day rate, the median full-day rate equals about {report.fullDayHoursEquivalent} hours at the hourly rate.
            </p>
          ) : null}
        </Section>

        <Section id="min-hours" title="Minimum booking time">
          <DataTable
            caption="Minimum booking time"
            head={['Minimum', 'Spaces', 'Share']}
            rows={report.minimumHours.map((row) => [hoursLabelEn(row.label), `${row.count}`, formatShare(row.share)])}
          />
        </Section>

        <ContentSection id="by-profession" title="By profession: lash, nail and brow artists" note={`Based on the services hosts recommend; one space can suit several professions. Shares are out of ${report.total} spaces.`}>
          <DataTable
            caption="Hourly rates by profession"
            head={['Profession', 'Suitable spaces', 'Hourly range', 'Median']}
            rows={report.professions.map((row) => [
              <a key={row.key} href={`#${row.key}`} className="text-brand underline-offset-4 hover:underline">{PROFESSION_EN[row.key]?.name ?? row.profession}</a>,
              `${row.count} (${formatShare(row.share)})`,
              rangeText(row.hourly),
              professionMedian(row),
            ])}
          />
          <div className="space-y-5">
            {report.professions.map((row) => (
              <div key={row.key} id={row.key} className="scroll-mt-28 space-y-2">
                <h3 className="text-lg font-semibold text-ink">Studios for {PROFESSION_EN[row.key]?.name.toLowerCase() ?? row.profession}</h3>
                <p className={`text-sm leading-7 text-black/70 ${NUM}`}>{professionSentence(row, report.total)}</p>
                <p className={`text-sm leading-7 text-black/55 ${NUM}`}>
                  {PROFESSION_NOTES[row.key]}
                  {row.key === 'lash' ? (
                    <> For more on renting a studio as a lash artist, see <Link href={en('/guides/lash-artist-studio')} className="text-brand underline underline-offset-4">studios for lash artists</Link>.</>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        </ContentSection>

        {median !== null ? (
          <ContentSection id="hourly-vs-monthly" title="Hourly vs monthly rent (illustrative calculation)" note={`An illustration, not a market monthly-rent figure: it uses this page's median hourly rate of ${formatNtd(median)} and assumes a 4-week month and 2 hours per client.`}>
            <DataTable
              caption="Illustrative monthly cost at the median hourly rate"
              head={['Monthly usage', 'Hours per month', `Hourly total (${formatNtd(median)}/hour)`]}
              rows={USAGE_SCENARIOS.map((row) => [
                `${row.clientsPerWeek} ${row.clientsPerWeek === 1 ? 'client' : 'clients'} a week`,
                `${row.hours}`,
                formatNtd(monthlyHourlyCost(row.hours, median)),
              ])}
            />
            <div className={`space-y-2 text-sm leading-7 text-black/70 ${NUM}`}>
              <p>
                This page gives no monthly-rent figure. Divide a monthly quote you have received by {median} to get the break-even hours: if you use fewer hours than that each month, renting by the hour costs less in total; if you use more, compare the monthly lease&apos;s other terms too, such as the deposit, contract length and whether utilities and consumables are extra.
              </p>
              {report.fullDayHoursEquivalent !== null ? (
                <p>If you book several clients in one day, look at full-day rates as well: the median full-day rate is {medianText(report.fullDay)}, roughly {report.fullDayHoursEquivalent} hours at the hourly rate.</p>
              ) : null}
              <p>
                For a step-by-step calculation and comparison checklist, see <Link href={en('/guides/hourly-vs-monthly-rent')} className="text-brand underline underline-offset-4">hourly vs monthly rent</Link>.
              </p>
            </div>
          </ContentSection>
        ) : null}

        <Section id="services" title="Suitable services" note={`Based on the services hosts recommend; one space can list several services. Shares are out of ${report.total} spaces.`}>
          <DataTable
            caption="Suitable services"
            head={['Service', 'Spaces', 'Share']}
            rows={report.services.map((row) => [REPORT_SERVICE_EN[row.label] ?? row.label, `${row.count}`, formatShare(row.share)])}
          />
        </Section>

        <Section id="equipment" title="Common equipment" note={`Based on the equipment hosts list; only items found in at least 2 spaces are shown. Shares are out of ${report.total} spaces.`}>
          <DataTable
            caption="Common equipment"
            head={['Equipment', 'Spaces', 'Share']}
            rows={equipmentRows.map((row) => [EQUIPMENT_EN[row.label] ?? row.label, `${row.count}`, formatShare(row.share)])}
          />
          {report.withRoomScan > 0 ? (
            <p className={`text-sm text-black/60 ${NUM}`}>{spaces(report.withRoomScan)} also offer a 3D tour you can view in the app first.</p>
          ) : null}
        </Section>

        <FaqBlock id="faq" title="Rental prices: FAQ" items={faq} />

        <section className="sb-card space-y-3 p-6 md:p-8" aria-labelledby="method">
          <h2 id="method" className="text-xl font-semibold text-ink">Method and limitations</h2>
          <ul className={`list-disc space-y-2 pl-5 text-sm leading-7 text-black/65 ${NUM}`}>
            <li>{methodology} Only active (public) spaces are included; drafts and unlisted spaces are not.</li>
            <li>Prices are the list prices hosts publish on SoloBeauté, not transaction prices; the price on each space page and in the app is the one that applies.</li>
            <li>Median: prices sorted from low to high, taking the middle value; for an even count, the average of the two middle values, rounded. The &ldquo;middle half&rdquo; is the 25th to 75th percentile (nearest-rank method).</li>
            <li>The sample is small ({report.total} spaces), so a single space being listed or unlisted can move the numbers noticeably, especially in cities with only one or two spaces. Treat the figures as a reference, not a picture of the whole market.</li>
            <li>The page is recalculated every hour from the latest public data; the text and sections were last updated on {REPORT_UPDATED_LABEL_EN}.</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-2xl border border-brand/30 bg-white p-6 md:p-8" aria-labelledby="cite" data-report-cite>
          <h2 id="cite" className="text-xl font-semibold text-ink">How to cite this data</h2>
          <ul className={`list-disc space-y-1 pl-5 text-sm leading-7 text-black/70 ${NUM}`}>
            <li>Sample: the {report.total} active (public) beauty workspaces listed on SoloBeauté, in {report.cityCount} cities and counties.</li>
            <li>Method: aggregates the list prices hosts publish on SoloBeauté and calculates ranges and medians; drafts and unlisted spaces are excluded, and the page is recalculated every hour.</li>
            <li>Last updated: <time dateTime={REPORT_UPDATED_ISO}>{REPORT_UPDATED_LABEL_EN}</time>. The numbers change as spaces are listed or unlisted, so please note the date you viewed them when citing.</li>
          </ul>
          <p className="text-sm text-black/55">Suggested citation:</p>
          <p className={`break-all rounded-xl bg-surface-warm px-4 py-3 text-sm leading-7 text-ink ${NUM}`} data-report-citation>{citation}</p>
        </section>

        <p className={`text-sm text-black/60 ${NUM}`}>
          Compiled by SoloBeauté co-founders {joinEn(AUTHORS.map((a) => `${a.name} (${a.jobTitleEn.toLowerCase()})`))}. <Link href={en('/about')} className="text-brand underline underline-offset-4">About us</Link>
        </p>

        <section className="space-y-4" aria-labelledby="more">
          <h2 id="more" className="text-xl font-semibold text-ink">Read next</h2>
          <ul className={`flex flex-wrap gap-2 ${NUM}`}>
            <li>
              <Link href={en('/spaces')} className={CHIP}>All beauty workspaces</Link>
            </li>
            {report.byCity.map((row) => (
              <li key={row.label}>
                <Link href={en(row.href ?? '/spaces')} className={CHIP}>
                  {cityShortEn(row.label)} beauty workspaces · {row.count}
                </Link>
              </li>
            ))}
            {[
              { href: '/guides/lash-artist-studio', label: 'Studios for lash artists' },
              { href: '/guides/hourly-vs-monthly-rent', label: 'Hourly vs monthly rent' },
              { href: '/hosts', label: 'For space hosts' },
              { href: '/faq', label: 'FAQ' },
            ].map((link) => (
              <li key={link.href}>
                <Link href={en(link.href)} className={CHIP}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="sb-card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">Find a space in the SoloBeauté app</h2>
          <p className="text-sm leading-7 text-black/65">
            In the app you can see each space&apos;s photos, equipment and available time slots and message the host directly. If you have an idle treatment room or station, you can also list it for rent in the app and set your own hourly rate.
          </p>
          <StoreButtons buttonClassName="btn-dark" />
        </section>
      </div>
    </main>
  )
}
