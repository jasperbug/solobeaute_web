import Link from 'next/link'

import {
  Breadcrumbs,
  BylineEn,
  DataTable,
  FaqBlock,
  LinkChips,
  NUM,
  Prose,
  Section,
  TOPIC_LINKS_EN,
  faqPageSchema,
  type QA,
} from '@/components/content/ContentBlocks'
import { JsonLd } from '@/components/spaces/JsonLd'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { localizePath } from '@/i18n/config'
import { SITE_URL } from '@/lib/constants'
import { AUTHORS, AUTHOR_REFS, PUBLISHER, personSchema, taipeiYear } from '@/lib/editorial'
import { monthYearEn } from '@/lib/en'
import { localeUrl } from '@/lib/i18nSeo'
import { formatShare, minimumHoursRow, type PriceReport } from '@/lib/priceReport'
import { USAGE_SCENARIOS, monthlyHourlyCost } from '@/lib/rentMath'
import { formatNtd } from '@/lib/spaces'

// English version of /guides/hourly-vs-monthly-rent. Only the hourly median is
// data; no market monthly-rent figure is used (same rule as the zh-TW page).

const PAGE_PATH = '/guides/hourly-vs-monthly-rent'
const PAGE_URL = localeUrl(PAGE_PATH, 'en')
const PUBLISHED = '2026-10-03'
const UPDATED = '2026-10-03'
const UPDATED_LABEL = 'October 3, 2026'
const en = (path: string) => localizePath(path, 'en')
const ASSUMPTION = 'assuming a 4-week month and 2 hours per client'

function h1Text(): string {
  return `Should you rent a beauty studio by the hour or by the month? ${taipeiYear()} worked example and comparison`
}

export function hourlyVsMonthlyTitleEn(): string {
  return `Beauty Studio Rental: Hourly vs Monthly | ${taipeiYear()} Worked Example`
}

export function hourlyVsMonthlyDescriptionEn(report: PriceReport | null): string {
  if (!report || report.hourly.median === null) {
    return 'How do hourly and monthly beauty studio rent compare? Use break-even hours = monthly quote ÷ hourly rate to see which costs less, with an illustrative calculation and a comparison checklist.'
  }
  return `Hourly or monthly beauty studio rent? An illustrative calculation using the median hourly rate of ${formatNtd(report.hourly.median)} across ${report.total} beauty workspaces on SoloBeauté: break-even hours = monthly quote ÷ hourly rate, plus a comparison checklist.`
}

export function HourlyVsMonthlyEn({ report }: { report: PriceReport }) {
  const dateLabel = monthYearEn()
  const h1 = h1Text()
  const desc = hourlyVsMonthlyDescriptionEn(report)
  const median = report.hourly.median
  const two = minimumHoursRow(report, 2)
  const priceReportLabel = `${taipeiYear()} Taiwan beauty workspace hourly rental prices`

  const faq: QA[] = [
    {
      question: 'Is it cheaper to rent a beauty studio by the hour or by the month?',
      answer: median !== null
        ? `It depends on how many hours you actually use each month. Break-even hours = monthly quote ÷ hourly rate. At the median hourly rate of ${formatNtd(median)} for spaces listed on SoloBeauté, if you use fewer hours a month than "monthly quote ÷ ${median}", renting by the hour costs less in total; if you use more, compare the monthly lease's other terms as well.`
        : 'It depends on how many hours you actually use each month. Break-even hours = monthly quote ÷ hourly rate; if you use fewer hours than that, renting by the hour costs less in total.',
    },
    {
      question: 'If I only see a few clients a month, roughly what will a studio cost?',
      answer: median !== null
        ? `As an illustration, at the median hourly rate of ${formatNtd(median)} and 2 hours per client: 1 client a week (8 hours a month) comes to about ${formatNtd(monthlyHourlyCost(8, median))}, and 2 clients a week (16 hours a month) to about ${formatNtd(monthlyHourlyCost(16, median))}. This is an estimate, not a quote; each space's own price is what applies.`
        : 'Estimate it as hourly rate × hours per month; each space’s hourly rate is shown on its space page and in the app.',
    },
    {
      question: 'Do hourly spaces also offer half-day or full-day rates?',
      answer: `Some do. Of the ${report.total} spaces listed on SoloBeauté, ${report.halfDay.count} list a half-day rate (median ${report.halfDay.median !== null ? formatNtd(report.halfDay.median) : '—'}) and ${report.fullDay.count} list a full-day rate (median ${report.fullDay.median !== null ? formatNtd(report.fullDay.median) : '—'}). For details, see the ${priceReportLabel}.`,
      links: [{ text: priceReportLabel, href: en('/spaces/price-report') }],
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
        inLanguage: 'en',
        url: PAGE_URL,
        mainEntityOfPage: PAGE_URL,
        datePublished: PUBLISHED,
        dateModified: UPDATED,
        author: AUTHOR_REFS,
        publisher: PUBLISHER,
        image: [`${SITE_URL}/og-image.png`],
        isBasedOn: localeUrl('/spaces/price-report', 'en'),
        translationOfWork: { '@id': `${localeUrl(PAGE_PATH, 'zh-TW')}#article` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: localeUrl('/', 'en') },
          { '@type': 'ListItem', position: 2, name: 'Hourly rental prices', item: localeUrl('/spaces/price-report', 'en') },
          { '@type': 'ListItem', position: 3, name: 'Hourly vs monthly rent', item: PAGE_URL },
        ],
      },
      faqPageSchema(`${PAGE_URL}#faq`, faq, 'en'),
      ...AUTHORS.map((author) => personSchema(author, 'en')),
    ],
  }

  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <JsonLd data={jsonLd} />
      <div className="container max-w-4xl space-y-12">
        <Breadcrumbs label="Breadcrumb" items={[{ label: 'Home', href: en('/') }, { label: 'Hourly rental prices', href: en('/spaces/price-report') }, { label: 'Hourly vs monthly rent' }]} />

        <header className="space-y-5">
          <p className="section-tag">Hourly vs monthly rent</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">{h1}</h1>
          <Prose>
            <p data-guide-lead>
              Whether hourly or monthly rent works out cheaper depends on how many hours you actually use each month. The calculation is simple: <strong className="text-ink">break-even hours = monthly quote ÷ hourly rate</strong>. If you use fewer hours than that each month, renting by the hour costs less in total; if you use more, a monthly lease is worth a serious look.
            </p>
            {median !== null ? (
              <p>
                As of {dateLabel}, the {report.total} beauty workspaces listed on SoloBeauté have a median hourly rate of {formatNtd(median)} (range {report.hourly.min !== null ? formatNtd(report.hourly.min) : '—'}–{report.hourly.max?.toLocaleString('en-US') ?? '—'}). The examples below use that median. Because monthly terms vary so much from place to place, this page gives no monthly-rent figure; plug in the quote you have actually received.
              </p>
            ) : null}
          </Prose>
          <BylineEn updatedIso={UPDATED} updatedLabel={UPDATED_LABEL} />
        </header>

        {median !== null ? (
          <Section id="example" title="Worked example: hours per month and what hourly rent costs" note={`An illustration, not a quote or a market monthly-rent figure. Uses the median hourly rate of ${formatNtd(median)}, ${ASSUMPTION}.`}>
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
                <strong className="text-ink">How to use this table:</strong> divide the monthly quote you have received by {median} to get your break-even hours, then see which row you fall into. For example, if your break-even works out at 30 hours and you see only 2 clients a week (about 16 hours a month), renting by the hour costs less in total.
              </p>
              {two ? <p>Mind the minimum booking time: {two.count} of {report.total} spaces ({formatShare(two.share)}) have a 2-hour minimum, so each booking counts as at least 2 hours.</p> : null}
              {report.fullDayHoursEquivalent !== null ? (
                <p>If you book many clients in one day, look at full-day rates: the median full-day rate is {report.fullDay.median !== null ? formatNtd(report.fullDay.median) : '—'}, roughly {report.fullDayHoursEquivalent} hours at the hourly rate.</p>
              ) : null}
            </div>
          </Section>
        ) : null}

        <Section id="checklist" title="Beyond price: what else to compare">
          <DataTable
            caption="Hourly vs monthly rent checklist"
            head={['What to compare', 'Hourly rent', 'Monthly rent']}
            rows={[
              ['How you pay', 'Only when you have a booking, by the hours you use', 'A fixed monthly cost, with or without clients'],
              ['Contract', 'Rented by the hour, no long-term lease', 'Ask about the contract length and early-termination terms'],
              ['Other costs', 'The space page lists hourly, half-day and full-day rates', 'Whether the deposit, utilities, air conditioning and consumables are extra depends on the contract'],
              ['Time slots', 'Popular slots can get booked, so book early', 'Your own space, so you set your hours'],
              ['Equipment', 'Bring your own each time, or use what the space has', 'You can keep your own equipment in place'],
              ['Location', 'You can see different clients in different locations', 'One fixed location'],
            ]}
          />
        </Section>

        <Section id="when" title="When hourly rent fits, and when to consider monthly">
          <ul className={`list-disc space-y-2 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li><strong className="text-ink">Hourly rent fits:</strong> you are just starting out, working part-time or your client numbers aren&apos;t steady yet; you want to try a different city or area; or you only need a quiet space now and then.</li>
            <li><strong className="text-ink">Consider monthly rent:</strong> your week is consistently full and your monthly hours are clearly above the break-even; or you need to keep equipment in place or build a storefront.</li>
            <li><strong className="text-ink">Use both:</strong> you can also confirm a location and your client base by the hour first, then decide whether to commit to a longer lease.</li>
          </ul>
          <p className={`text-sm leading-7 text-black/60 ${NUM}`}>
            For a comparison aimed at lash artists (hourly rent, sublets and bed rental), see <Link href={en('/guides/lash-artist-studio')} className="text-brand underline underline-offset-4">studios for lash artists</Link>.
          </p>
        </Section>

        <FaqBlock id="faq" title="Hourly vs monthly rent: FAQ" items={faq} />

        <LinkChips id="more" title="Read next" links={TOPIC_LINKS_EN.filter((link) => link.href !== en(PAGE_PATH))} />

        <section className="sb-card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">Browse spaces in the SoloBeauté app</h2>
          <p className="text-sm leading-7 text-black/65">In the app you can see each space&apos;s hourly, half-day and full-day rates and minimum booking time, and message the host directly to confirm a time slot.</p>
          <StoreButtons buttonClassName="btn-dark" />
        </section>
      </div>
    </main>
  )
}
