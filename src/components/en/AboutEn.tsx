import Link from 'next/link'

import { Breadcrumbs, LinkChips, NUM, Prose, Section, TOPIC_LINKS_EN } from '@/components/content/ContentBlocks'
import { JsonLd } from '@/components/spaces/JsonLd'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { localizePath } from '@/i18n/config'
import { BRAND_FACT_EN } from '@/lib/brandFacts'
import { INSTAGRAM_URL, SITE_URL, THREADS_URL } from '@/lib/constants'
import { AUTHORS, ORGANIZATION_ID, personId, personSchema } from '@/lib/editorial'
import { monthYearEn } from '@/lib/en'
import { localeUrl } from '@/lib/i18nSeo'
import type { PriceReport } from '@/lib/priceReport'
import { formatNtd } from '@/lib/spaces'

// English version of /about (served at /en/about).

const PAGE_PATH = '/about'
const PAGE_URL = localeUrl(PAGE_PATH, 'en')
const en = (path: string) => localizePath(path, 'en')

export const ABOUT_TITLE_EN = 'About SoloBeauté | Co-founded by an Engineer and a Beauty Professional'
export const ABOUT_DESCRIPTION_EN =
  'SoloBeauté is a Taiwan-based app for renting beauty workspaces by the hour, co-founded by engineer Jasper Tsai and beauty professional Meigo Liu. Beauty professionals rent workspaces that hosts have already set up.'

// Same meaning as the homepage "About" section (en.json about.*).
const BIOS: Record<string, string> = {
  'jasper-tsai': 'Builds the product, the systems and the website piece by piece, with a simple goal: less friction for the beauty industry, and more tools that let people get to work.',
  'meigo-liu': 'Has worked on the front line of Taiwan’s beauty industry for years, understands the daily rhythm of beauty professionals, and knows which processes truly help and which only add work.',
}

export function AboutEn({ report }: { report: PriceReport | null }) {
  const dateLabel = monthYearEn()
  const founders = ['jasper-tsai', 'meigo-liu']
    .map((slug) => AUTHORS.find((author) => author.slug === slug))
    .filter((author): author is (typeof AUTHORS)[number] => Boolean(author))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': `${PAGE_URL}#page`,
        name: 'About SoloBeauté',
        url: PAGE_URL,
        inLanguage: 'en',
        description: ABOUT_DESCRIPTION_EN,
        isPartOf: { '@type': 'WebSite', name: 'SoloBeauté', url: SITE_URL },
        mainEntity: { '@id': ORGANIZATION_ID },
      },
      {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: 'SoloBeauté',
        alternateName: ['Solobeaute', 'SoloBeaute'],
        url: SITE_URL,
        logo: `${SITE_URL}/images/brand/logo.png`,
        description: BRAND_FACT_EN,
        founder: founders.map((author) => ({ '@id': personId(author) })),
        sameAs: [INSTAGRAM_URL, THREADS_URL],
      },
      ...founders.map((author) => ({ ...personSchema(author, 'en'), description: BIOS[author.slug] })),
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SoloBeauté', item: localeUrl('/', 'en') },
          { '@type': 'ListItem', position: 2, name: 'About us', item: PAGE_URL },
        ],
      },
    ],
  }

  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <JsonLd data={jsonLd} />
      <div className="container max-w-3xl space-y-12">
        <Breadcrumbs label="Breadcrumb" items={[{ label: 'Home', href: en('/') }, { label: 'About us' }]} />

        <header className="space-y-5">
          <p className="section-tag">About us</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">About SoloBeauté</h1>
          <Prose>
            <p data-about-lead>
              SoloBeauté is a Taiwan-based app for renting beauty workspaces by the hour: nail, lash, facial, brow and other beauty professionals can rent workspaces that hosts have already set up, and hosts with an idle treatment room or station can rent out the hours it would otherwise sit empty.
            </p>
            <p data-brand-fact>{BRAND_FACT_EN}</p>
            <p>SoloBeauté was co-founded by an engineer and a beauty professional. One knows technology, the other knows the day-to-day reality of Taiwan&apos;s beauty industry, and together we are building a tool that genuinely helps pros start taking clients and hosts start renting out their space.</p>
          </Prose>
        </header>

        <Section id="founders" title="Founding team">
          <div className="grid gap-5 md:grid-cols-2">
            {founders.map((author) => (
              <article key={author.slug} id={author.slug} className="sb-card scroll-mt-28 space-y-2 p-6">
                <h3 className="text-lg font-semibold text-ink">{author.name}</h3>
                <p className="text-sm text-brand">{author.jobTitleEn} · Co-founder of SoloBeauté</p>
                <p className="text-sm leading-7 text-black/65">{BIOS[author.slug]}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section id="what-we-do" title="What we do">
          <ul className={`list-disc space-y-2 pl-5 text-base leading-8 text-black/70 ${NUM}`}>
            <li><strong className="text-ink">Beauty professionals:</strong> find spaces in the app, compare prices and equipment, message hosts directly and send booking requests; rent is paid to the host on site. Pros can also set up their own brand page.</li>
            <li><strong className="text-ink">Space hosts:</strong> list idle hours, set your own prices and rules, and decide whether to accept or decline every booking. See the <Link href={en('/hosts')} className="text-brand underline underline-offset-4">host guide</Link>.</li>
            <li><strong className="text-ink">Clients:</strong> online booking isn&apos;t open yet; for now, clients can view pros&apos; brand pages on the website and contact them through the pros&apos; own channels.</li>
          </ul>
        </Section>

        {report && report.total > 0 && report.hourly.median !== null ? (
          <Section id="numbers" title="Where we are today">
            <p className={`text-base leading-8 text-black/70 ${NUM}`}>
              As of {dateLabel}, SoloBeauté lists {report.total} beauty workspaces across {report.cityCount} cities and counties, with a median hourly rate of {formatNtd(report.hourly.median)}. For the full figures, see the <Link href={en('/spaces/price-report')} className="text-brand underline underline-offset-4">2026 Taiwan beauty workspace hourly rental prices</Link>.
            </p>
          </Section>
        ) : null}

        <Section id="name" title="Our name">
          <p className={`text-base leading-8 text-black/70 ${NUM}`}>
            The official name is &ldquo;SoloBeauté&rdquo; (with an accent on the final é); on the App Store it is written &ldquo;Solobeaute&rdquo;. Both refer to the same service. SoloBeauté is not related to overseas services such as Solo Beauty or Soo Beauté.
          </p>
        </Section>

        <Section id="contact" title="Contact us">
          <p className={`text-base leading-8 text-black/70 ${NUM}`}>
            For questions and partnerships, visit the <Link href="/support" className="text-brand underline underline-offset-4">support centre</Link>, or find us on <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer me" className="text-brand underline underline-offset-4">Instagram</a> and <a href={THREADS_URL} target="_blank" rel="noopener noreferrer me" className="text-brand underline underline-offset-4">Threads</a> (@_solobeaute_).
          </p>
          <StoreButtons buttonClassName="btn-dark" />
        </Section>

        <LinkChips id="more" title="Read next" links={TOPIC_LINKS_EN.filter((link) => link.href !== en(PAGE_PATH))} />
      </div>
    </main>
  )
}
