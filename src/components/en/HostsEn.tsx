import Link from 'next/link'

import {
  Breadcrumbs,
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
import { ORGANIZATION_ID } from '@/lib/editorial'
import { monthYearEn, spaceTypeLabelEn } from '@/lib/en'
import { localeUrl } from '@/lib/i18nSeo'
import { formatShare, type PriceReport, type RateSummary } from '@/lib/priceReport'
import { formatNtd } from '@/lib/spaces'

// English version of /hosts (served at /en/hosts).

const PAGE_PATH = '/hosts'
const PAGE_URL = localeUrl(PAGE_PATH, 'en')
const en = (path: string) => localizePath(path, 'en')

export const HOSTS_TITLE_EN = 'Rent Out Your Idle Beauty Room by the Hour | Host Guide and Pricing'
export const HOSTS_DESCRIPTION_EN =
  'Have an idle treatment room, lash bed or nail station? List it in the SoloBeauté app and rent it to beauty professionals by the hour. List only the hours you aren’t using, accept or decline every booking, and see how other hosts price their spaces.'

function range(summary: Pick<RateSummary, 'min' | 'max'>): string {
  if (summary.min === null || summary.max === null) return '—'
  return summary.min === summary.max ? formatNtd(summary.min) : `${formatNtd(summary.min)}–${summary.max.toLocaleString('en-US')}`
}

function med(summary: RateSummary): string {
  return summary.count >= 2 && summary.median !== null ? formatNtd(summary.median) : '—'
}

const FAQ: QA[] = [
  {
    question: 'How do I rent out my space to beauty professionals?',
    answer: 'Download the SoloBeauté app, sign up as a host, and list your space with photos, available hours and an hourly rate. If photography isn’t your thing, our team can help with photos and setting up the listing; the whole process takes about 30 minutes.',
  },
  {
    question: 'Can I rent out my space for just some of the hours?',
    answer: 'Yes. List only the hours your space would otherwise sit empty and keep running your business the rest of the time. You can accept or decline every booking and set your own house rules.',
  },
  {
    question: 'What information do I need to list a space?',
    answer: 'In the app you mainly fill in: photos of the space (ideally the entrance, the interior and the equipment), the address, the space type (open space, curtained partition or private room), an equipment list, the services the space is suited to and those it doesn’t allow, the hourly rate (with optional half-day and full-day rates), the minimum booking time, and whether there is a camera in the space. Space pages on the website show only the city and district.',
  },
  {
    question: 'How do I get paid?',
    answer: 'At the moment, the pro pays the rent in cash, directly to you on site. You can agree with the pro in the app whether they pay before or after their session.',
  },
]

function pricingLead(report: PriceReport, dateLabel: string): string {
  return `As of ${dateLabel}, hosts of the ${report.total} spaces listed on SoloBeauté charge ${range(report.hourly)} per hour, with a median of ${med(report.hourly)}; ${report.halfDay.count} also set a half-day rate and ${report.fullDay.count} a full-day rate.`
}

export function HostsEn({ report }: { report: PriceReport }) {
  const dateLabel = monthYearEn()
  const two = report.minimumHours.find((row) => row.label === '2 小時')
  const priceReportLabel = '2026 Taiwan beauty workspace hourly rental prices'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${PAGE_URL}#page`,
        name: 'Rent out your idle beauty room to beauty professionals',
        description: HOSTS_DESCRIPTION_EN,
        url: PAGE_URL,
        inLanguage: 'en',
        isPartOf: { '@type': 'WebSite', name: 'SoloBeauté', url: SITE_URL },
        publisher: { '@id': ORGANIZATION_ID },
        audience: { '@type': 'Audience', audienceType: 'Beauty space hosts' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: localeUrl('/', 'en') },
          { '@type': 'ListItem', position: 2, name: 'For space hosts', item: PAGE_URL },
        ],
      },
      faqPageSchema(`${PAGE_URL}#faq`, FAQ, 'en'),
    ],
  }

  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <JsonLd data={jsonLd} />
      <div className="container max-w-4xl space-y-12">
        <Breadcrumbs label="Breadcrumb" items={[{ label: 'Home', href: en('/') }, { label: 'For space hosts' }]} />

        <header className="space-y-5">
          <p className="section-tag">Space hosts</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">Rent out your idle beauty room to beauty professionals</h1>
          <Prose>
            <p data-hosts-lead>
              If you have an idle treatment room, lash bed or nail station, you can list it in the SoloBeauté app and rent it by the hour to nail, lash, facial, brow and other beauty professionals. List only the hours that would otherwise sit empty and keep running your business the rest of the time; you decide whether to accept or decline every booking.
            </p>
            <p>{pricingLead(report, dateLabel)}</p>
          </Prose>
          <StoreButtons buttonClassName="btn-dark" />
        </header>

        <Section id="steps" title="How listing works">
          <ol className={`list-decimal space-y-3 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li>Download the SoloBeauté app and sign up as a host.</li>
            <li>Prepare photos of the space (entrance, interior, equipment), the hours you can rent out and your hourly rate. If photography isn&apos;t your thing, the team can help with photos and setting up the listing, which takes about 30 minutes.</li>
            <li>Fill in the space type, equipment list, the services it suits and doesn&apos;t allow, the minimum booking time, and whether there is a camera in the space.</li>
            <li>Beauty professionals find your space in the app, message you and send a booking request; the booking is confirmed only once you accept it.</li>
            <li>On the day, the pro arrives as agreed and pays you the rent in cash on site.</li>
          </ol>
        </Section>

        <Section id="you-decide" title="What you decide as a host">
          <ul className={`list-disc space-y-2 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li>Price: an hourly rate, plus optional half-day and full-day rates.</li>
            <li>Minimum booking time{two ? ` (currently ${two.count} of ${report.total} spaces, ${formatShare(two.share)}, set 2 hours)` : ''}.</li>
            <li>The dates and time slots you rent out.</li>
            <li>The services your space suits and doesn&apos;t allow, and your house rules.</li>
            <li>Whether to accept or decline each booking.</li>
          </ul>
        </Section>

        <Section id="pricing" title="How other hosts set their prices" note={`Calculated from the public prices of the ${report.total} spaces listed on SoloBeauté (data as of ${dateLabel}); use it as a pricing reference.`}>
          <DataTable
            caption="Hourly list prices by space type"
            head={['Space type', 'Spaces', 'Hourly range', 'Median']}
            rows={report.byType.map((row) => [spaceTypeLabelEn(row.label), `${row.count}`, range(row), med(row)])}
          />
          <DataTable
            caption="Hourly, half-day and full-day rates"
            head={['Plan', 'Spaces offering it', 'Range', 'Median']}
            rows={[
              ['Hourly', `${report.hourly.count}`, range(report.hourly), med(report.hourly)],
              ['Half day', `${report.halfDay.count}`, range(report.halfDay), med(report.halfDay)],
              ['Full day', `${report.fullDay.count}`, range(report.fullDay), med(report.fullDay)],
            ]}
          />
          <p className={`text-sm leading-7 text-black/60 ${NUM}`}>
            For full figures by city, equipment and suitable services, see the <Link href={en('/spaces/price-report')} className="text-brand underline underline-offset-4">{priceReportLabel}</Link>.
          </p>
        </Section>

        <Section id="privacy" title="Host privacy">
          <p className={`text-base leading-8 text-black/70 ${NUM}`}>
            Space pages on the website show only the city and district, never the street address or the host&apos;s details; the full location is in the SoloBeauté app.
          </p>
        </Section>

        <FaqBlock id="faq" title="Host FAQ" items={FAQ} />

        <LinkChips id="more" title="Read next" links={TOPIC_LINKS_EN.filter((link) => link.href !== en(PAGE_PATH))} />
      </div>
    </main>
  )
}
