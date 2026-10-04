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
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { localizePath } from '@/i18n/config'
import { SITE_URL } from '@/lib/constants'
import { AUTHORS, AUTHOR_REFS, PUBLISHER, personSchema, taipeiYear } from '@/lib/editorial'
import { cityNameEn, cityShortEn, equipmentEn, joinEn, monthYearEn } from '@/lib/en'
import { localeUrl } from '@/lib/i18nSeo'
import { formatShare, type ProfessionRow, type RateSummary } from '@/lib/priceReport'
import { formatNtd } from '@/lib/spaces'
import type { PublicSpace } from '@/lib/types'

// English version of /guides/lash-artist-studio (served at /en/guides/lash-artist-studio).

const PAGE_PATH = '/guides/lash-artist-studio'
const PAGE_URL = localeUrl(PAGE_PATH, 'en')
const PUBLISHED = '2026-10-03'
const UPDATED = '2026-10-03'
const UPDATED_LABEL = 'October 3, 2026'
const en = (path: string) => localizePath(path, 'en')

function h1Text(): string {
  return `${taipeiYear()} studio rental for lash artists: hourly rent, sublets or renting a bed?`
}

export function lashGuideTitleEn(): string {
  return `${taipeiYear()} Studio Rental Prices for Lash Artists | Hourly Rent vs Sublets vs Bed Rental`
}

function range(summary: Pick<RateSummary, 'min' | 'max'>): string {
  if (summary.min === null || summary.max === null) return '—'
  return summary.min === summary.max ? formatNtd(summary.min) : `${formatNtd(summary.min)}–${summary.max.toLocaleString('en-US')}`
}

function med(summary: RateSummary): string {
  return summary.count >= 2 && summary.median !== null ? formatNtd(summary.median) : '—'
}

function equipmentText(row: ProfessionRow): string {
  return joinEn(row.equipment.filter((e) => e.count > 0).map((e) => `${e.count} have a ${equipmentEn(e.label).toLowerCase()}`))
}

function leadText(row: ProfessionRow, total: number, dateLabel: string): string {
  if (row.count === 0) return `As of ${dateLabel}, none of the ${total} beauty workspaces listed on SoloBeauté is marked by its host as suitable for lash work yet.`
  const equipment = equipmentText(row)
  return `As of ${dateLabel}, of the ${total} beauty workspaces listed on SoloBeauté, ${row.count} (${formatShare(row.share)}) are marked by hosts as suitable for eyelash extensions or lash care. They rent for ${range(row.hourly)} per hour, with a median of ${med(row.hourly)}${equipment ? `; ${equipment}` : ''}.`
}

export function lashGuideDescriptionEn(row: ProfessionRow | undefined, total: number): string {
  if (!row || row.count === 0) return 'How much does it cost a lash artist to rent a studio, and how do hourly rent, sublets and bed rental compare? Based on the public prices of spaces listed on SoloBeauté.'
  return `What does a lash studio cost to rent? ${row.count} of the ${total} beauty workspaces on SoloBeauté suit lash work, at ${range(row.hourly)} per hour (median ${med(row.hourly)}). With a city breakdown, an hourly vs sublet vs bed-rental comparison and a checklist.`
}

export function LashGuideEn({ lashSpaces, row, total }: { lashSpaces: PublicSpace[]; row: ProfessionRow | undefined; total: number }) {
  const dateLabel = monthYearEn()
  const h1 = h1Text()
  const desc = lashGuideDescriptionEn(row, total)

  const cityRows = (row?.cities ?? []).map((city) => {
    const inCity = lashSpaces.filter((s) => (s.city ?? '').replace(/^臺/, '台') === city.label)
    const rates = inCity.map((s) => s.hourlyRate).filter((r): r is number => r !== null).sort((a, b) => a - b)
    const summary: RateSummary = {
      count: rates.length,
      min: rates.length ? rates[0] : null,
      max: rates.length ? rates[rates.length - 1] : null,
      median: rates.length ? (rates.length % 2 ? rates[(rates.length - 1) / 2] : Math.round((rates[rates.length / 2 - 1] + rates[rates.length / 2]) / 2)) : null,
    }
    return { city, summary }
  })

  const minTwo = row?.minTwoHours ?? 0
  const bedCount = row?.equipment.find((e) => e.label === '美容床')?.count ?? 0
  const faq: QA[] = [
    {
      question: 'How much does it cost a lash artist to rent a studio per hour?',
      answer: row && row.count > 0
        ? `As of ${dateLabel}, the ${row.count} spaces on SoloBeauté that suit lash work rent for ${range(row.hourly)} per hour, with a median of ${med(row.hourly)}${minTwo ? `; ${minTwo} of them have a 2-hour minimum booking` : ''}. Hosts set their own prices; the price on each space page and in the app is the one that applies.`
        : 'No host has marked a space as suitable for lash work yet; new spaces are being added.',
    },
    {
      question: 'What is the difference between renting a bed, subletting and renting by the hour?',
      answer: 'Renting a bed or subletting usually means agreeing on a fixed bed, seat or time slot with a salon, mostly by the month, with contract, deposit and available hours depending on the salon. Renting by the hour means you book only when you have a client and pay per hour. Spaces on SoloBeauté list their hourly rate, minimum booking time, equipment and suitable services, and you message the host and send a booking request in the app for the host to confirm.',
    },
    {
      question: 'Which cities have studios suited to lash work that can be rented by the hour?',
      answer: row && row.cities.length
        ? `Currently ${joinEn(row.cities.map((c) => `${cityShortEn(c.label)} (${c.count})`))}. For each city's spaces and prices, see its beauty workspace page.`
        : 'No host has marked a space as suitable for lash work yet.',
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
        '@type': 'ItemList',
        '@id': `${PAGE_URL}#spaces`,
        name: 'Beauty workspaces suited to lash work',
        numberOfItems: lashSpaces.length,
        itemListElement: lashSpaces.map((space, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: localeUrl(`/spaces/${space.id}`, 'en'),
          name: space.title,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: localeUrl('/', 'en') },
          { '@type': 'ListItem', position: 2, name: 'Beauty workspaces', item: localeUrl('/spaces', 'en') },
          { '@type': 'ListItem', position: 3, name: 'Studios for lash artists', item: PAGE_URL },
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
        <Breadcrumbs label="Breadcrumb" items={[{ label: 'Home', href: en('/') }, { label: 'Beauty workspaces', href: en('/spaces') }, { label: 'Studios for lash artists' }]} />

        <header className="space-y-5">
          <p className="section-tag">Lash artists · Studio rental</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">{h1}</h1>
          <Prose>
            <p data-guide-lead>{row ? leadText(row, total, dateLabel) : ''}</p>
            <p>Lash artists who are just starting out, or whose client list isn&apos;t steady yet, often weigh up renting a bed, subletting and renting by the hour. This page uses the public prices of spaces listed on SoloBeauté to show what lash artists pay to rent a studio by the hour, and compares when each option makes sense.</p>
          </Prose>
          {row && row.count > 0 ? (
            <dl className={`grid grid-cols-2 gap-3 md:grid-cols-4 ${NUM}`}>
              {[
                { label: 'Spaces suited to lash work', value: `${row.count}` },
                { label: 'Hourly range', value: range(row.hourly) },
                { label: 'Median hourly rate', value: med(row.hourly) },
                { label: 'With a beauty bed', value: `${bedCount}` },
              ].map((fact) => (
                <div key={fact.label} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  <dt className="text-xs text-black/50">{fact.label}</dt>
                  <dd className="mt-1 text-base font-semibold text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <BylineEn updatedIso={UPDATED} updatedLabel={UPDATED_LABEL} />
          <p className={`text-xs leading-6 text-black/50 ${NUM}`}>
            Figures are recalculated every hour from the spaces listed on SoloBeauté (data as of {dateLabel}); &ldquo;suited to lash work&rdquo; follows the services each host recommends. The sample is small, so treat the numbers as a reference. For figures across Taiwan, see the <Link href={en('/spaces/price-report')} className="text-brand underline underline-offset-4">{taipeiYear()} Taiwan beauty workspace hourly rental prices</Link>.
          </p>
        </header>

        {cityRows.length > 0 ? (
          <Section id="by-city" title="Lash studio hourly rates by city" note="No median is shown for cities with a single space.">
            <DataTable
              caption="Spaces suited to lash work, by city"
              head={['City / county', 'Spaces suited to lash work', 'Hourly range', 'Median']}
              rows={cityRows.map(({ city, summary }) => [
                <Link key={city.label} href={en(city.href)} className="text-brand underline-offset-4 hover:underline">{cityNameEn(city.label)}</Link>,
                `${city.count}`,
                range(summary),
                med(summary),
              ])}
            />
          </Section>
        ) : null}

        <Section id="compare" title="Hourly rent, sublets and bed rental compared">
          <DataTable
            caption="Hourly rent vs sublets and bed rental"
            head={['', 'Hourly rent', 'Sublet / bed rental']}
            rows={[
              ['How it is priced', 'By the hour, only when you have a booking', 'Usually by the month; varies by salon'],
              ['When you use it', 'You choose the slot each time you book', 'Usually a fixed slot or a fixed spot'],
              ['Contract', 'Rented by the hour, no long-term lease', 'Depends on the salon’s contract; ask first'],
              ['Your equipment', 'Bring your own each time, or use what the space has', 'A fixed spot makes it easier to keep your own kit there'],
              ['Best for', 'A client list that isn’t steady yet, or trying out a location', 'A fully booked week and a need for a fixed spot'],
            ]}
          />
          <p className={`text-sm leading-7 text-black/60 ${NUM}`}>
            Sublet and bed-rental terms vary a lot from salon to salon; the table shows only common arrangements, and what the other party actually offers is what counts. To work out which option costs less, see <Link href={en('/guides/hourly-vs-monthly-rent')} className="text-brand underline underline-offset-4">hourly vs monthly rent</Link>.
          </p>
        </Section>

        <Section id="how-to-choose" title="How lash artists can choose">
          <ul className={`list-disc space-y-2 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li><strong className="text-ink">Just starting out, clients not yet steady:</strong> rent by the hour, only when you have a client, and try a few locations to see how clients respond.</li>
            <li><strong className="text-ink">A steady number of clients each week:</strong> work out how many hours a month you actually use, then compare against sublet or monthly quotes. Break-even hours = monthly quote ÷ hourly rate.</li>
            <li><strong className="text-ink">You need to keep equipment in place or are building for the long term:</strong> a fixed sublet spot is more convenient; you can also test a location by the hour first, then decide whether to commit longer term.</li>
          </ul>
        </Section>

        <Section id="checklist" title="Checklist for lash artists choosing a studio">
          <ul className={`list-disc space-y-2 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li>Beauty bed and lighting: lash extensions need the client lying down and plenty of light, so check the equipment list for a beauty bed and beauty lamp{row && row.count > 0 ? ` (of the ${row.count} spaces suited to lash work, ${equipmentText(row)})` : ''}.</li>
            <li>Space type: a private room, curtained partition or open space, depending on how much privacy your clients want.</li>
            <li>Minimum booking time: compare how long a full set takes with the space&apos;s minimum{minTwo ? ` (${minTwo} of the spaces suited to lash work have a 2-hour minimum)` : ''}.</li>
            <li>Cameras: each space page shows the camera status the host has disclosed.</li>
            <li>Consumables and personal tools: for anything not on the equipment list, message the host before you book.</li>
          </ul>
        </Section>

        {lashSpaces.length > 0 ? (
          <section className="space-y-5" aria-labelledby="lash-spaces">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id="lash-spaces" className="section-title">Beauty workspaces suited to lash work</h2>
              <span className={`text-sm text-black/55 ${NUM}`}>{lashSpaces.length} {lashSpaces.length === 1 ? 'space' : 'spaces'}</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {lashSpaces.map((space) => <SpaceCard key={space.id} space={space} locale="en" />)}
            </div>
          </section>
        ) : null}

        <FaqBlock id="faq" title="Studio rental for lash artists: FAQ" items={faq} />

        <LinkChips id="more" title="Read next" links={TOPIC_LINKS_EN.filter((link) => link.href !== en(PAGE_PATH))} />

        <section className="sb-card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">Find a lash studio in the SoloBeauté app</h2>
          <p className="text-sm leading-7 text-black/65">In the app you can see each space&apos;s photos, equipment and available time slots, and message the host directly to confirm.</p>
          <StoreButtons buttonClassName="btn-dark" />
        </section>
      </div>
    </main>
  )
}
