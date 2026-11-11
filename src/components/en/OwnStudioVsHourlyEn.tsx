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
import { dataDateISO } from '@/lib/cityPages'
import { SITE_URL } from '@/lib/constants'
import { AUTHORS, AUTHOR_REFS, PUBLISHER, personSchema, taipeiYear } from '@/lib/editorial'
import { rateRangeEn } from '@/lib/en'
import { localeUrl } from '@/lib/i18nSeo'
import { formatShare, minimumHoursRow, type PriceReport } from '@/lib/priceReport'
import { USAGE_SCENARIOS, monthlyHourlyCost } from '@/lib/rentMath'
import { formatNtd } from '@/lib/spaces'

// English version of /guides/own-studio-vs-hourly-rent. Same rules as the
// zh-TW page: only SoloBeauté's listed hourly rates are data; no shop rent,
// deposit, fit-out or income figure is used.

const PAGE_PATH = '/guides/own-studio-vs-hourly-rent'
const PAGE_URL = localeUrl(PAGE_PATH, 'en')
const PUBLISHED = '2026-11-11'
const UPDATED = '2026-11-11'
const UPDATED_LABEL = 'November 11, 2026'
const en = (path: string) => localizePath(path, 'en')
const ASSUMPTION = 'assuming a 4-week month and 2 hours per client'

function h1Text(): string {
  return `Open your own beauty studio, or rent a workspace by the hour? ${taipeiYear()} comparison`
}

export function ownStudioTitleEn(): string {
  return `Own Beauty Studio vs Hourly Workspace Rental | ${taipeiYear()} Comparison`
}

export function ownStudioDescriptionEn(report: PriceReport | null): string {
  if (!report || report.hourly.median === null) {
    return 'Should you open your own beauty studio or rent a ready-to-use workspace by the hour? Compare the lease, deposit, fit-out and fixed monthly rent of a shop with renting a space a host has already set up, with a checklist.'
  }
  return `Should you open your own beauty studio or rent by the hour? Compare the lease, deposit, fit-out and fixed rent of a shop with renting one of ${report.total} beauty workspaces on SoloBeauté by the hour (median ${formatNtd(report.hourly.median)}), with an illustrative calculation.`
}

export function OwnStudioVsHourlyEn({ report }: { report: PriceReport }) {
  const h1 = h1Text()
  const desc = ownStudioDescriptionEn(report)
  const median = report.hourly.median
  const two = minimumHoursRow(report, 2)
  const dateISO = dataDateISO()

  const faq: QA[] = [
    {
      question: 'Is it cheaper to open my own beauty studio or to rent by the hour?',
      answer: median !== null
        ? `It depends on how many hours you actually use each month and on the shop terms you are offered. Compare with break-even hours = fixed monthly cost ÷ hourly rate: at the median hourly rate of ${formatNtd(median)} for spaces listed on SoloBeauté, if you use fewer hours a month than "fixed monthly cost ÷ ${median}", renting by the hour costs less in total. This page gives no shop rent, deposit or fit-out figures; plug in the quotes you have actually received.`
        : 'It depends on how many hours you actually use each month and on the shop terms you are offered. Compare with break-even hours = fixed monthly cost ÷ hourly rate. This page gives no shop rent, deposit or fit-out figures; plug in the quotes you have actually received.',
    },
    {
      question: 'How is hourly rent charged, and how do I pay?',
      answer: `By the hours you rent. Hosts set their own hourly, half-day and full-day rates, shown on the space page and in the app${two ? `; ${two.count} of ${report.total} spaces have a 2-hour minimum` : ''}. Beauty professionals message the host in the SoloBeauté app to confirm a time and pay the host in cash on site.`,
    },
    {
      question: 'If I only see a few clients a month, roughly what does hourly rent cost?',
      answer: median !== null
        ? `As an illustration, at the median hourly rate of ${formatNtd(median)} and 2 hours per client: 1 client a week (8 hours a month) comes to about ${formatNtd(monthlyHourlyCost(8, median))}, and 2 clients a week (16 hours a month) to about ${formatNtd(monthlyHourlyCost(16, median))}. This uses listed prices and is not a quote; each space's own price is what applies.`
        : 'Estimate it as hourly rate × hours per month; each space’s hourly rate is shown on its space page and in the app.',
    },
    {
      question: 'I already have a studio. Can I rent out its idle hours?',
      answer: 'You can list your space yourself in the SoloBeauté app and decide which hours are available and at what price. How often it is rented depends on the location and demand; see the page for space hosts for how it works.',
      links: [{ text: 'page for space hosts', href: en('/hosts') }],
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
          { '@type': 'ListItem', position: 3, name: 'Own studio vs hourly rent', item: PAGE_URL },
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
        <Breadcrumbs label="Breadcrumb" items={[{ label: 'Home', href: en('/') }, { label: 'Hourly rental prices', href: en('/spaces/price-report') }, { label: 'Own studio vs hourly rent' }]} />

        <header className="space-y-5">
          <p className="section-tag">Own studio vs hourly rent</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">{h1}</h1>
          <Prose>
            <p data-ai-summary>
              Opening your own studio usually means finding a shop, signing a lease, paying a deposit and fitting it out, then paying a fixed rent every month; renting by the hour means using a space a host has already equipped, only for the hours you need.{' '}
              {median !== null
                ? `As of ${dateISO}, the ${report.total} beauty workspaces listed on SoloBeauté charge ${rateRangeEn(report.hourly.min, report.hourly.max)} per hour (median ${formatNtd(median)}); beauty professionals message the host in the app to confirm a time and pay in cash on site.`
                : 'On SoloBeauté, beauty professionals message the host in the app to confirm a time and pay in cash on site.'}{' '}
              This page gives no shop rent, deposit or fit-out figures, and the hourly figures are illustrations only.
            </p>
            <p className={`text-sm font-medium text-ink ${NUM}`} data-ai-summary-date>
              Updated: <time dateTime={dateISO}>{dateISO}</time>
            </p>
          </Prose>
          <BylineEn updatedIso={UPDATED} updatedLabel={UPDATED_LABEL} />
        </header>

        <Section id="compare" title="Own studio vs hourly rent: the differences">
          <DataTable
            caption="Own studio vs hourly rent"
            head={['What to compare', 'Own studio (leased shop)', 'Hourly rent (SoloBeauté)']}
            rows={[
              ['Before you start', 'Usually find a shop, sign a lease, pay a deposit, fit it out and buy equipment', 'The host has already set up the space and equipment; equipment is as listed on the space page'],
              ['Fixed costs', 'A fixed monthly rent, with or without clients; utilities and fees depend on the lease', 'You pay only for the hours you rent; hourly, half-day and full-day rates are on the space page'],
              ['Contract', 'Lease length, early termination and deposit refunds depend on the landlord', 'Rented by time slot; the host sets the minimum hours and cancellation terms, shown on the space page and in the app'],
              ['Time slots', 'Your own shop, so you set your hours', 'Popular slots may already be taken, so check with the host early'],
              ['Storefront and equipment', 'You can design the storefront and keep equipment in place', 'Bring your own equipment each time, or use what the space has'],
              ['Location', 'One fixed location', `You can see clients in spaces in different areas; spaces are currently in ${report.cityCount} cities and counties`],
              ['Payment', 'As set by the lease', 'Message the host in the app to confirm a time; pay the host in cash on site'],
            ]}
          />
          <p className={`text-sm leading-7 text-black/60 ${NUM}`}>
            Shop rent, deposits and fit-out costs vary widely by location and there is no reliable public figure, so this page does not list any; compare using the quotes you actually receive.
          </p>
        </Section>

        {median !== null ? (
          <Section id="example" title="Illustration: what hourly rent costs per month" note={`An illustration, not a quote. Uses the median hourly rate of ${formatNtd(median)} for spaces listed on SoloBeauté, ${ASSUMPTION}.`}>
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
                <strong className="text-ink">How to compare with a shop:</strong> divide the shop&apos;s fixed monthly cost you have been quoted (rent plus utilities, fees and so on) by {median} to get your break-even hours, then compare with the hours you actually use each month. The deposit and fit-out are one-off costs to weigh separately.
              </p>
              <p>
                These figures use hosts&apos; listed prices on SoloBeauté as an illustration. They are not a quote and say nothing about the income or clients you will actually get; what you spend depends on the space and hours you rent, and how often a host&apos;s space is rented depends on the location and demand.
              </p>
              {two ? <p>Mind the minimum booking time: {two.count} of {report.total} spaces ({formatShare(two.share)}) have a 2-hour minimum.</p> : null}
              <p>
                For the step-by-step calculation and an hourly vs monthly checklist, see <Link href={en('/guides/hourly-vs-monthly-rent')} className="text-brand underline underline-offset-4">hourly vs monthly rent</Link>.
              </p>
            </div>
          </Section>
        ) : null}

        <Section id="when" title="Which one fits">
          <ul className={`list-disc space-y-2 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li><strong className="text-ink">Hourly rent fits:</strong> you are just starting out, working part-time or your client numbers aren&apos;t steady yet; you want to try a different city or area first; or you don&apos;t want to sign a lease and fit out a shop straight away.</li>
            <li><strong className="text-ink">Consider your own studio:</strong> your week is consistently full and your monthly hours are clearly above the break-even; or you need a fixed storefront, want to keep equipment in place, or want to decide the fit-out and opening hours yourself.</li>
            <li><strong className="text-ink">Use both:</strong> confirm a location and your client base by the hour first, then decide whether to open a studio; if you already have one, you can list its idle hours in the app.</li>
          </ul>
          <p className={`text-sm leading-7 text-black/60 ${NUM}`}>
            For hourly rent vs sublets and bed rental, see <Link href={en('/guides/lash-artist-studio#compare')} className="text-brand underline underline-offset-4">studios for lash artists: hourly rent, sublets and bed rental</Link>. To see spaces you can rent now, see <Link href={en('/spaces')} className="text-brand underline underline-offset-4">all beauty workspaces</Link> and the <Link href={en('/spaces/price-report')} className="text-brand underline underline-offset-4">hourly rate report</Link>; if you have a space to rent out, see <Link href={en('/hosts')} className="text-brand underline underline-offset-4">for space hosts</Link>.
          </p>
        </Section>

        <FaqBlock id="faq" title="Own studio vs hourly rent: FAQ" items={faq} />

        <LinkChips id="more" title="Read next" links={TOPIC_LINKS_EN.filter((link) => link.href !== en(PAGE_PATH))} />

        <section className="sb-card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">Browse spaces in the SoloBeauté app</h2>
          <p className="text-sm leading-7 text-black/65">In the app you can see each space&apos;s hourly, half-day and full-day rates and minimum booking time, message the host directly to confirm a time slot, and pay the host in cash on site.</p>
          <StoreButtons buttonClassName="btn-dark" />
        </section>
      </div>
    </main>
  )
}
