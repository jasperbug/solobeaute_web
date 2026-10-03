import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { JsonLd } from '@/components/spaces/JsonLd'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { SITE_URL } from '@/lib/constants'
import {
  AUTHORS,
  AUTHOR_REFS,
  ORGANIZATION_ID,
  PUBLISHER,
  REPORT_UPDATED_ISO,
  REPORT_UPDATED_LABEL_EN,
  personSchema,
} from '@/lib/editorial'
import { buildPriceReport, formatShare, minimumHoursRow, type PriceReport, type RateSummary } from '@/lib/priceReport'
import { USAGE_SCENARIOS, monthlyHourlyCost } from '@/lib/rentMath'
import { fetchPublicSpaces, formatNtd } from '@/lib/spaces'

export const revalidate = 3600

// English summary of the zh-TW price report (/spaces/price-report). Every
// number comes from the same live buildPriceReport(); nothing is hard-coded.
const PAGE_PATH = '/en'
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`
const REPORT_URL = `${SITE_URL}/spaces/price-report`
const FIRST_PUBLISHED = '2026-10-03'
const TITLE = 'Taiwan Beauty Workspace Hourly Rental Prices 2026 | SoloBeauté'
const H1 = 'Taiwan beauty workspace hourly rental prices 2026'
const FALLBACK_DESCRIPTION =
  'SoloBeauté is a Taiwan-based app for renting ready-to-use beauty workspaces by the hour. 2026 hourly rental prices from the spaces listed on SoloBeauté: range, median, half-day and full-day rates, by city, space type and profession.'

const CITY_EN: Record<string, string> = {
  台北市: 'Taipei City',
  新北市: 'New Taipei City',
  桃園市: 'Taoyuan City',
  台中市: 'Taichung City',
  高雄市: 'Kaohsiung City',
  彰化縣: 'Changhua County',
  南投縣: 'Nantou County',
}
const TYPE_EN: Record<string, string> = { 開放空間: 'Open space', 拉簾隔間: 'Curtained partition', 獨立房間: 'Private room' }
const SERVICE_EN: Record<string, string> = {
  '美睫（嫁接睫毛、睫毛管理）': 'Eyelash extensions / lash care',
  '美容（臉部護膚）': 'Facials (skin care)',
  '霧眉、霧唇': 'Brow / lip embroidery',
  美甲: 'Nails',
  美髮: 'Hair',
  '彩妝、新娘秘書': 'Makeup / bridal styling',
  '按摩（身體、油壓、運動、美胸）': 'Massage',
  '紋繡（髮際線、黑眼圈遮瑕）': 'Other cosmetic tattooing (hairline, under-eye)',
  熱蠟除毛: 'Hot-wax hair removal',
  '耳燭、采耳': 'Ear candling / ear cleaning',
}
const EQUIPMENT_EN: Record<string, string> = {
  冷氣: 'Air conditioning',
  化妝室: 'Restroom',
  'Wi-Fi': 'Wi-Fi',
  工作推車: 'Work trolley',
  美容床: 'Beauty bed',
  美容燈: 'Beauty lamp',
  拋棄式床紙: 'Disposable bed sheets',
  延長線: 'Extension cords',
  鏡台: 'Mirror station',
  沙發椅: 'Sofa',
  消毒櫃: 'Sterilizing cabinet',
  美甲桌椅: 'Nail table and chair',
  洗頭台: 'Shampoo station',
  吹風機: 'Hair dryer',
  停車位: 'Parking',
  淋浴間: 'Shower',
}
const PROFESSION_EN: Record<string, { name: string; services: string }> = {
  lash: { name: 'Lash artists', services: 'eyelash extensions or lash care' },
  nail: { name: 'Nail artists', services: 'nails' },
  brow: { name: 'Brow / lip embroidery artists', services: 'brow or lip embroidery' },
}
const BAND_EN: Record<string, string> = {
  'NT$100 以下': 'NT$100 or less',
  'NT$301 以上': 'NT$301 or more',
}

function range(summary: Pick<RateSummary, 'min' | 'max'>): string {
  if (summary.min === null || summary.max === null) return '—'
  return summary.min === summary.max ? formatNtd(summary.min) : `${formatNtd(summary.min)}–${summary.max.toLocaleString('en-US')}`
}

function rangeWords(summary: Pick<RateSummary, 'min' | 'max'>): string {
  if (summary.min === null || summary.max === null) return 'n/a'
  return summary.min === summary.max ? formatNtd(summary.min) : `from ${formatNtd(summary.min)} to ${formatNtd(summary.max)}`
}

function med(summary: RateSummary): string {
  return summary.count >= 2 && summary.median !== null ? formatNtd(summary.median) : '—'
}

function monthYear(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', year: 'numeric', month: 'long' }).format(now)
}

function buildDescription(report: PriceReport): string {
  if (report.total === 0) return FALLBACK_DESCRIPTION
  return `Hourly beauty workspace rental prices in Taiwan, ${monthYear()}: ${report.total} spaces listed on SoloBeauté in ${report.cityCount} cities and counties, ${rangeWords(report.hourly)} per hour, median ${med(report.hourly)}. By city, space type and profession.`
}

export async function generateMetadata(): Promise<Metadata> {
  let description = FALLBACK_DESCRIPTION
  try {
    description = buildDescription(buildPriceReport(await fetchPublicSpaces()))
  } catch (error) {
    console.error('[en] metadata fallback:', error)
  }
  return {
    title: { absolute: TITLE },
    description,
    alternates: { canonical: PAGE_URL },
    openGraph: { title: TITLE, description, siteName: 'SoloBeauté', type: 'article', locale: 'en_US', url: PAGE_URL, images: ['/og-image.png'] },
    twitter: { card: 'summary_large_image', title: TITLE, description, images: ['/og-image.png'] },
  }
}

const NUM = '[font-family:var(--font-body)] lining-nums tabular-nums'
const CELL = 'px-3 py-3 md:px-4'

function Table({ caption, head, rows }: { caption: string; head?: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
      <table className={`w-full text-left text-[13px] md:text-sm ${NUM}`}>
        <caption className="sr-only">{caption}</caption>
        {head ? (
          <thead className="bg-surface-warm text-xs text-black/55">
            <tr>{head.map((cell) => <th key={cell} scope="col" className={`${CELL} font-medium`}>{cell}</th>)}</tr>
          </thead>
        ) : null}
        <tbody className="divide-y divide-black/5 text-ink">
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, i) => (i === 0
                ? <th key={i} scope="row" className={`${CELL} font-medium`}>{cell}</th>
                : <td key={i} className={`${CELL} whitespace-nowrap`}>{cell}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
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

type QA = { question: string; answer: string }

function buildFaq(report: PriceReport, asOf: string): QA[] {
  const two = minimumHoursRow(report, 2)
  const lash = report.professions.find((p) => p.key === 'lash')
  const items: QA[] = [
    {
      question: 'How much does it cost to rent a beauty studio by the hour in Taiwan?',
      answer: `As of ${asOf}, the ${report.total} beauty workspaces listed on SoloBeauté charge ${rangeWords(report.hourly)} per hour, with a median of ${med(report.hourly)}${report.hourlyQuartiles ? `; the middle half fall between ${formatNtd(report.hourlyQuartiles.q1)} and ${formatNtd(report.hourlyQuartiles.q3)}` : ''}. Hosts set their own prices.`,
    },
  ]
  if (lash && lash.count > 0) {
    items.push({
      question: 'How much does an eyelash extension studio cost to rent in Taiwan?',
      answer: `${lash.count} of ${report.total} spaces (${formatShare(lash.share)}) are marked by hosts as suitable for eyelash extensions or lash care. Their hourly rates range ${rangeWords(lash.hourly)}, median ${med(lash.hourly)}.`,
    })
  }
  items.push({
    question: 'What is the minimum booking time?',
    answer: two
      ? `${two.count} of ${report.total} spaces (${formatShare(two.share)}) require a 2-hour minimum booking. Each space shows its minimum in the app.`
      : `Each host sets a minimum booking time: ${report.minimumHours.map((row) => `${row.label.replace(' 小時', ' h')}: ${row.count}`).join(', ')}.`,
  })
  items.push({
    question: 'Are there half-day or full-day rates?',
    answer: `${report.halfDay.count} spaces list a half-day rate (median ${med(report.halfDay)}) and ${report.fullDay.count} list a full-day rate (median ${med(report.fullDay)}${report.fullDayHoursEquivalent !== null ? `, roughly ${report.fullDayHoursEquivalent} hours at the hourly rate` : ''}). How many hours a half or full day covers depends on the space.`,
  })
  items.push({
    question: 'Can clients book beauty services on SoloBeauté?',
    answer: 'Not yet. Online booking for consumers is not open; clients currently contact beauty professionals through the professionals’ own channels. Beauty professionals book workspaces from hosts in the SoloBeauté app.',
  })
  return items
}

export default async function EnglishPage() {
  const report = buildPriceReport(await fetchPublicSpaces())
  const asOf = monthYear()
  const description = buildDescription(report)
  const two = minimumHoursRow(report, 2)
  const median = report.hourly.median
  const faq = buildFaq(report, asOf)
  const equipmentRows = report.equipment.filter((row) => EQUIPMENT_EN[row.label])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${PAGE_URL}#article`,
        headline: H1,
        description,
        inLanguage: 'en',
        url: PAGE_URL,
        mainEntityOfPage: PAGE_URL,
        datePublished: FIRST_PUBLISHED,
        dateModified: REPORT_UPDATED_ISO,
        author: AUTHOR_REFS,
        publisher: PUBLISHER,
        image: [`${SITE_URL}/og-image.png`],
        about: { '@id': ORGANIZATION_ID },
        isBasedOn: { '@id': `${REPORT_URL}#dataset` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${PAGE_URL}#faq`,
        inLanguage: 'en',
        mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'English', item: PAGE_URL },
        ],
      },
      ...AUTHORS.map((author) => personSchema(author, 'en')),
    ],
  }

  return (
    <main lang="en" className="bg-[var(--color-bg)] pb-20 pt-32">
      <JsonLd data={jsonLd} />
      <div className="container max-w-4xl space-y-12">
        <nav aria-label="Breadcrumb" className="text-sm text-black/55">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-brand">SoloBeauté</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-ink">English</li>
          </ol>
        </nav>

        <header className="space-y-5">
          <p className="section-tag">SoloBeauté · English</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">{H1}</h1>
          <div className={`space-y-3 text-base leading-8 text-black/70 ${NUM}`}>
            <p data-en-lead>
              As of {asOf}, {report.total} beauty workspaces are listed on SoloBeauté across {report.cityCount} cities and counties in Taiwan. Hourly rates range {rangeWords(report.hourly)}, with a median of {med(report.hourly)} per hour{report.hourlyQuartiles ? `; the middle half of spaces charge ${formatNtd(report.hourlyQuartiles.q1)}–${report.hourlyQuartiles.q3.toLocaleString('en-US')}` : ''}.
            </p>
            <p>
              SoloBeauté (also written Solobeaute) is a Taiwan-based app that lets independent beauty professionals — lash artists, nail artists, estheticians and brow/lip embroidery artists — rent ready-to-use workspaces by the hour from hosts who have idle rooms or chairs. This page is an English summary of the Traditional Chinese report <Link href="/spaces/price-report" className="text-brand underline underline-offset-4">2026 台灣美業空間時租行情</Link>.
            </p>
          </div>
          <p className={`text-sm text-black/60 ${NUM}`}>
            Last updated: <time dateTime={REPORT_UPDATED_ISO}>{REPORT_UPDATED_LABEL_EN}</time> · By{' '}
            {AUTHORS.map((author, index) => (
              <span key={author.slug}>
                {index > 0 ? ' and ' : null}
                <Link href={`/about#${author.slug}`} className="text-ink underline-offset-4 hover:text-brand hover:underline">{author.name}</Link> ({author.jobTitleEn.toLowerCase()})
              </span>
            ))}
            , co-founders of SoloBeauté
          </p>
        </header>

        <Section id="at-a-glance" title="At a glance">
          <Table
            caption="Key figures"
            rows={[
              ['Spaces listed', `${report.total}`],
              ['Cities / counties', `${report.cityCount}`],
              ['Hourly rate range', range(report.hourly)],
              ['Median hourly rate', med(report.hourly)],
              ...(report.hourlyQuartiles ? [['Middle half (25th–75th percentile)', `${formatNtd(report.hourlyQuartiles.q1)}–${report.hourlyQuartiles.q3.toLocaleString('en-US')}`]] : []),
              ['Half-day rate, median', report.halfDay.count ? `${med(report.halfDay)} (${report.halfDay.count} spaces)` : '—'],
              ['Full-day rate, median', report.fullDay.count ? `${med(report.fullDay)} (${report.fullDay.count} spaces)` : '—'],
              ...(two ? [['2-hour minimum booking', `${two.count} of ${report.total} (${formatShare(two.share)})`]] : []),
            ]}
          />
        </Section>

        <Section id="bands" title="Hourly price distribution" note={`${report.hourly.count} spaces list an hourly rate.`}>
          <Table caption="Hourly price distribution" head={['Hourly rate', 'Spaces', 'Share']} rows={report.hourlyBands.map((row) => [BAND_EN[row.label] ?? row.label, `${row.count}`, formatShare(row.share)])} />
        </Section>

        <Section id="by-city" title="By city" note="No median is shown for cities with a single space. City pages are in Traditional Chinese.">
          <Table
            caption="Hourly rates by city"
            head={['City / county', 'Spaces', 'Hourly range', 'Median']}
            rows={report.byCity.map((row) => [
              row.href ? <Link key={row.label} href={row.href} className="text-brand underline-offset-4 hover:underline">{CITY_EN[row.label] ?? row.label}</Link> : (CITY_EN[row.label] ?? row.label),
              `${row.count}`,
              range(row),
              row.count >= 2 ? med(row) : '—',
            ])}
          />
        </Section>

        <Section id="by-type" title="By space type">
          <Table caption="Hourly rates by space type" head={['Space type', 'Spaces', 'Hourly range', 'Median']} rows={report.byType.map((row) => [TYPE_EN[row.label] ?? row.label, `${row.count}`, range(row), med(row)])} />
        </Section>

        <Section id="day-rates" title="Half-day and full-day rates" note="Some hosts also offer half-day and full-day prices; how many hours they cover depends on the space.">
          <Table
            caption="Hourly, half-day and full-day rates"
            head={['Plan', 'Spaces offering it', 'Range', 'Median']}
            rows={[
              ['Hourly', `${report.hourly.count}`, range(report.hourly), med(report.hourly)],
              ['Half day', `${report.halfDay.count}`, range(report.halfDay), med(report.halfDay)],
              ['Full day', `${report.fullDay.count}`, range(report.fullDay), med(report.fullDay)],
            ]}
          />
          {report.fullDayHoursEquivalent !== null ? (
            <p className={`text-sm text-black/60 ${NUM}`}>For spaces with both an hourly and a full-day rate, the median full-day rate equals about {report.fullDayHoursEquivalent} hours at the hourly rate.</p>
          ) : null}
        </Section>

        <Section id="min-hours" title="Minimum booking time">
          <Table caption="Minimum booking time" head={['Minimum', 'Spaces', 'Share']} rows={report.minimumHours.map((row) => [row.label.replace(' 小時', row.label.startsWith('1 ') ? ' hour' : ' hours'), `${row.count}`, formatShare(row.share)])} />
        </Section>

        <Section id="by-profession" title="By profession" note={`Based on the services hosts mark as suitable; one space can suit several professions. Shares are out of ${report.total} spaces.`}>
          <Table
            caption="Hourly rates by profession"
            head={['Profession', 'Suitable spaces', 'Hourly range', 'Median']}
            rows={report.professions.map((row) => [PROFESSION_EN[row.key]?.name ?? row.profession, `${row.count} (${formatShare(row.share)})`, range(row.hourly), med(row.hourly)])}
          />
          <ul className={`list-disc space-y-2 pl-5 text-sm leading-7 text-black/70 ${NUM}`}>
            {report.professions.filter((row) => row.count > 0).map((row) => {
              const equipment = row.equipment.filter((e) => e.count > 0 && EQUIPMENT_EN[e.label]).map((e) => `${e.count} have a ${EQUIPMENT_EN[e.label].toLowerCase()}`)
              return (
                <li key={row.key}>
                  <strong className="text-ink">{PROFESSION_EN[row.key]?.name}:</strong> {row.count} spaces are marked as suitable for {PROFESSION_EN[row.key]?.services}
                  {equipment.length ? `; ${equipment.join(', ')}` : ''}
                  {row.cities.length ? `; in ${row.cities.map((c) => `${CITY_EN[c.label] ?? c.label} (${c.count})`).join(', ')}` : ''}.
                </li>
              )
            })}
          </ul>
        </Section>

        {report.services.length > 0 ? (
          <Section id="services" title="Services hosts mark as suitable" note={`One space can list several services; shares are out of ${report.total} spaces.`}>
            <Table caption="Suitable services" head={['Service', 'Spaces', 'Share']} rows={report.services.map((row) => [SERVICE_EN[row.label] ?? row.label, `${row.count}`, formatShare(row.share)])} />
          </Section>
        ) : null}

        {equipmentRows.length > 0 ? (
          <Section id="equipment" title="Common equipment" note={`Equipment listed by hosts in at least 2 spaces; shares are out of ${report.total} spaces.`}>
            <Table caption="Common equipment" head={['Equipment', 'Spaces', 'Share']} rows={equipmentRows.map((row) => [EQUIPMENT_EN[row.label], `${row.count}`, formatShare(row.share)])} />
          </Section>
        ) : null}

        {median !== null ? (
          <Section id="hourly-vs-monthly" title="Hourly vs monthly rent (illustrative calculation)" note={`Illustration only, not a market monthly-rent figure: uses the median hourly rate of ${formatNtd(median)}; assumes a 4-week month and 2 hours per client.`}>
            <Table
              caption="Illustrative monthly cost at the median hourly rate"
              head={['Usage', 'Hours per month', `Hourly total (${formatNtd(median)}/h)`]}
              rows={USAGE_SCENARIOS.map((row) => {
                const clients = row.clientsPerWeek
                return [`${clients} client${clients === 1 ? '' : 's'} a week`, `${row.hours}`, formatNtd(monthlyHourlyCost(row.hours, median))]
              })}
            />
            <p className={`text-sm leading-7 text-black/70 ${NUM}`}>
              This page gives no monthly-rent figure. Divide a monthly quote you have received by {median} to get the break-even hours: below that many hours a month, renting by the hour costs less in total.
            </p>
          </Section>
        ) : null}

        <Section id="how-it-works" title="How SoloBeauté works">
          <ul className={`list-disc space-y-2 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li>Beauty professionals browse spaces in the SoloBeauté app (iOS and Android), check photos, equipment, prices and minimum hours, message the host and send a booking request. The host confirms each booking.</li>
            <li>Rent is paid to the host in cash on site.</li>
            <li>Hosts list only their idle hours, set their own hourly, half-day and full-day rates, and accept or decline each request.</li>
            <li>Online booking for consumers is not open yet; clients currently contact beauty professionals through the professionals&apos; own channels.</li>
            <li>The website shows only the city and district of each space; the full location is in the app.</li>
          </ul>
        </Section>

        <section className="sb-card space-y-5 p-6 md:p-8" aria-labelledby="faq-title" id="faq">
          <h2 id="faq-title" className="text-xl font-semibold text-ink">FAQ</h2>
          <div className="space-y-5">
            {faq.map((item) => (
              <div key={item.question} className="space-y-2">
                <h3 className="text-base font-semibold text-ink">{item.question}</h3>
                <p className={`text-sm leading-7 text-black/65 ${NUM}`}>{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="sb-card space-y-3 p-6 md:p-8" aria-labelledby="data">
          <h2 id="data" className="text-xl font-semibold text-ink">Method, limitations and how to cite</h2>
          <ul className={`list-disc space-y-2 pl-5 text-sm leading-7 text-black/70 ${NUM}`}>
            <li>Sample: active (public) spaces listed on SoloBeauté — {report.total} spaces in {report.cityCount} cities/counties. Drafts and unlisted spaces are excluded.</li>
            <li>Figures are list prices published by hosts, not transaction prices; recalculated hourly from the public listings.</li>
            <li>Median: the middle value; for an even count, the average of the two middle values, rounded. The middle half uses the nearest-rank 25th and 75th percentiles.</li>
            <li>The sample is small, so a single listing can move the numbers — especially in cities with only one or two spaces.</li>
          </ul>
          <p className={`rounded-xl bg-surface-warm px-4 py-3 text-sm leading-7 text-ink break-all ${NUM}`}>
            SoloBeauté, &ldquo;2026 Taiwan Beauty Workspace Hourly Rental Prices&rdquo; (2026 台灣美業空間時租行情), last updated {REPORT_UPDATED_LABEL_EN}, {REPORT_URL}
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="team">
          <h2 id="team" className="section-title">About SoloBeauté</h2>
          <p className={`text-base leading-8 text-black/70 ${NUM}`}>
            SoloBeauté was co-founded by an engineer and a beauty professional: <Link href="/about#jasper-tsai" className="text-brand underline underline-offset-4">Jasper Tsai</Link> (engineer) and <Link href="/about#meigo-liu" className="text-brand underline underline-offset-4">Meigo Liu</Link> (beauty professional). SoloBeauté is not affiliated with Solo Beauty, Solo Beauty Partner or Soo Beauté.
          </p>
        </section>

        <section className="sb-card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">Get the app</h2>
          <p className="text-sm leading-7 text-black/65">The app and most of this website are in Traditional Chinese.</p>
          <StoreButtons buttonClassName="btn-dark" />
        </section>
      </div>
    </main>
  )
}
