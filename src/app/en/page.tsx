import type { Metadata } from 'next'
import Link from 'next/link'

import { JsonLd } from '@/components/spaces/JsonLd'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { SITE_URL } from '@/lib/constants'
import { ORGANIZATION_ID, PUBLISHER, REPORT_UPDATED_LABEL_EN } from '@/lib/editorial'
import { buildPriceReport, formatShare, minimumHoursRow, type RateSummary } from '@/lib/priceReport'
import { fetchPublicSpaces, formatNtd } from '@/lib/spaces'

export const revalidate = 3600

// Minimal English page (the rest of the site is zh-TW). Live numbers only.
const PAGE_PATH = '/en'
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`
const TITLE = 'SoloBeauté | Rent beauty workspaces by the hour in Taiwan (2026 price data)'
const DESCRIPTION =
  'SoloBeauté is a Taiwan-based app for renting ready-to-use beauty workspaces by the hour. 2026 hourly rental prices from the spaces listed on SoloBeauté: range, median, half-day and full-day rates, by city.'

const CITY_EN: Record<string, string> = {
  台北市: 'Taipei City',
  新北市: 'New Taipei City',
  桃園市: 'Taoyuan City',
  台中市: 'Taichung City',
  高雄市: 'Kaohsiung City',
  彰化縣: 'Changhua County',
  南投縣: 'Nantou County',
}

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: { title: TITLE, description: DESCRIPTION, siteName: 'SoloBeauté', type: 'website', locale: 'en_US', url: PAGE_URL, images: ['/og-image.png'] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og-image.png'] },
}

function range(summary: Pick<RateSummary, 'min' | 'max'>): string {
  if (summary.min === null || summary.max === null) return '—'
  return summary.min === summary.max ? formatNtd(summary.min) : `${formatNtd(summary.min)}–${summary.max.toLocaleString('en-US')}`
}

function med(summary: RateSummary): string {
  return summary.count >= 2 && summary.median !== null ? formatNtd(summary.median) : '—'
}

function monthYear(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', year: 'numeric', month: 'long' }).format(now)
}

const NUM = '[font-family:var(--font-body)] lining-nums tabular-nums'
const CELL = 'px-3 py-3 md:px-4'

export default async function EnglishPage() {
  const report = buildPriceReport(await fetchPublicSpaces())
  const asOf = monthYear()
  const two = minimumHoursRow(report, 2)
  const lash = report.professions.find((p) => p.key === 'lash')
  const nail = report.professions.find((p) => p.key === 'nail')
  const brow = report.professions.find((p) => p.key === 'brow')

  const figures: Array<[string, string]> = [
    ['Spaces listed', `${report.total}`],
    ['Cities / counties', `${report.cityCount}`],
    ['Hourly rate range', range(report.hourly)],
    ['Median hourly rate', med(report.hourly)],
    ['Half-day rate (median)', report.halfDay.count ? `${med(report.halfDay)} (${report.halfDay.count} spaces)` : '—'],
    ['Full-day rate (median)', report.fullDay.count ? `${med(report.fullDay)} (${report.fullDay.count} spaces)` : '—'],
  ]
  if (two) figures.push(['2-hour minimum booking', `${two.count} of ${report.total} (${formatShare(two.share)})`])
  if (lash) figures.push(['Suitable for eyelash extensions', `${lash.count} (${formatShare(lash.share)})`])
  if (brow) figures.push(['Suitable for brow / lip embroidery', `${brow.count} (${formatShare(brow.share)})`])
  if (nail) figures.push(['Suitable for nails', `${nail.count} (${formatShare(nail.share)})`])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${PAGE_URL}#page`,
        name: 'SoloBeauté: hourly beauty workspace rental in Taiwan',
        description: DESCRIPTION,
        url: PAGE_URL,
        inLanguage: 'en',
        isPartOf: { '@type': 'WebSite', name: 'SoloBeauté', url: SITE_URL },
        about: { '@id': ORGANIZATION_ID },
        publisher: PUBLISHER,
        relatedLink: [`${SITE_URL}/spaces/price-report`],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'English', item: PAGE_URL },
        ],
      },
    ],
  }

  return (
    <main lang="en" className="bg-[var(--color-bg)] pb-20 pt-32">
      <JsonLd data={jsonLd} />
      <div className="container max-w-3xl space-y-12">
        <nav aria-label="Breadcrumb" className="text-sm text-black/55">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-brand">SoloBeauté</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-ink">English</li>
          </ol>
        </nav>

        <header className="space-y-5">
          <p className="section-tag">English</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">SoloBeauté: hourly beauty workspace rental in Taiwan</h1>
          <div className={`space-y-3 text-base leading-8 text-black/70 ${NUM}`}>
            <p data-en-lead>
              SoloBeauté (also written Solobeaute) is a Taiwan-based app that lets independent beauty professionals — nail artists, lash artists, estheticians and brow/lip embroidery artists — rent ready-to-use workspaces by the hour from hosts who have idle rooms or chairs.
            </p>
            <p>
              As of {asOf}, {report.total} beauty workspaces are listed on SoloBeauté across {report.cityCount} cities and counties in Taiwan, with hourly rates {report.hourly.min !== null && report.hourly.max !== null ? `from ${formatNtd(report.hourly.min)} to ${formatNtd(report.hourly.max)}` : 'n/a'} and a median of {med(report.hourly)} per hour.
            </p>
          </div>
        </header>

        <section className="space-y-4" aria-labelledby="figures">
          <h2 id="figures" className="section-title">2026 price data at a glance</h2>
          <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
            <table className={`w-full text-left text-[13px] md:text-sm ${NUM}`}>
              <caption className="sr-only">Key figures</caption>
              <tbody className="divide-y divide-black/5 text-ink">
                {figures.map(([label, value]) => (
                  <tr key={label}>
                    <th scope="row" className={`${CELL} font-medium`}>{label}</th>
                    <td className={CELL}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="by-city">
          <h2 id="by-city" className="section-title">Spaces by city</h2>
          <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
            <table className={`w-full text-left text-[13px] md:text-sm ${NUM}`}>
              <caption className="sr-only">Spaces and hourly rates by city</caption>
              <thead className="bg-surface-warm text-xs text-black/55">
                <tr>
                  <th scope="col" className={`${CELL} font-medium`}>City / county</th>
                  <th scope="col" className={`${CELL} font-medium`}>Spaces</th>
                  <th scope="col" className={`${CELL} font-medium`}>Hourly range</th>
                  <th scope="col" className={`${CELL} font-medium`}>Median</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-ink">
                {report.byCity.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className={`${CELL} font-medium`}>
                      {row.href ? <Link href={row.href} className="text-brand underline-offset-4 hover:underline">{CITY_EN[row.label] ?? row.label}</Link> : (CITY_EN[row.label] ?? row.label)}
                    </th>
                    <td className={CELL}>{row.count}</td>
                    <td className={`${CELL} whitespace-nowrap`}>{range(row)}</td>
                    <td className={`${CELL} whitespace-nowrap`}>{med(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={`text-xs text-black/50 ${NUM}`}>No median is shown for cities with a single space. City pages are in Traditional Chinese.</p>
        </section>

        <section className="space-y-3" aria-labelledby="how">
          <h2 id="how" className="section-title">How it works</h2>
          <ul className={`list-disc space-y-2 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li>Beauty professionals browse spaces in the SoloBeauté app (iOS and Android), check photos, equipment, prices and minimum hours, message the host and send a booking request. The host confirms each booking.</li>
            <li>Rent is paid to the host in cash on site.</li>
            <li>Hosts list only their idle hours, set their own hourly, half-day and full-day rates, and accept or decline each request.</li>
            <li>Online booking for consumers is not open yet; clients currently contact beauty professionals through the professionals&apos; own channels.</li>
            <li>The website shows only the city and district of each space; the full location is in the app.</li>
          </ul>
        </section>

        <section className="sb-card space-y-3 p-6 md:p-8" aria-labelledby="data">
          <h2 id="data" className="text-xl font-semibold text-ink">About the data and how to cite it</h2>
          <p className={`text-sm leading-7 text-black/70 ${NUM}`}>
            Figures are list prices that hosts publish on SoloBeauté for active (public) spaces — not transaction prices. They are recalculated hourly, and the sample is small ({report.total} spaces in {report.cityCount} cities/counties), so a single listing can move the numbers. Medians use the middle value (the average of the two middle values, rounded, for an even count).
          </p>
          <p className={`rounded-xl bg-surface-warm px-4 py-3 text-sm leading-7 text-ink break-all ${NUM}`}>
            SoloBeauté, &ldquo;2026 Taiwan Beauty Workspace Hourly Rental Prices&rdquo; (2026 台灣美業空間時租行情), last updated {REPORT_UPDATED_LABEL_EN}, {SITE_URL}/spaces/price-report
          </p>
          <p className="text-sm leading-7 text-black/70">
            Full report (Traditional Chinese): <Link href="/spaces/price-report" className="text-brand underline underline-offset-4">2026 台灣美業空間時租行情</Link>
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="team">
          <h2 id="team" className="section-title">Team</h2>
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
