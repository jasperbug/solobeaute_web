import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs, DataTable, FaqBlock, LinkChips, NUM, Prose, Section, faqPageSchema } from '@/components/content/ContentBlocks'
import { JsonLd } from '@/components/spaces/JsonLd'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { localizePath } from '@/i18n/config'
import { SITE_URL } from '@/lib/constants'
import { cityNameEn, districtEn, equipmentEn } from '@/lib/en'
import { localeAlternates, localeUrl, ogLocale } from '@/lib/i18nSeo'
import { formatNtd } from '@/lib/spaces'
import type { PublicSpace } from '@/lib/types'
import type { Cell, TopicView } from '@/lib/topicPages'

const CHIP =
  'inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition hover:border-brand hover:text-brand [font-family:var(--font-body)] lining-nums'

export function topicMetadata(view: TopicView): Metadata {
  return {
    title: view.title,
    description: view.description,
    alternates: localeAlternates(view.path, view.locale),
    ...(view.indexable ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      type: 'website',
      url: localeUrl(view.path, view.locale),
      title: view.ogTitle,
      description: view.description,
      siteName: 'SoloBeauté',
      ...ogLocale(view.locale),
      images: ['/og-image.png'],
    },
    twitter: { card: 'summary_large_image', title: view.ogTitle, description: view.description, images: ['/og-image.png'] },
  }
}

function topicJsonLd(view: TopicView) {
  const lang = view.locale === 'en' ? 'en' : 'zh-TW'
  const url = localeUrl(view.path, view.locale)
  const spaces = view.lists.flatMap((list) => list.spaces)
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'CollectionPage',
      '@id': `${url}#page`,
      url,
      name: view.h1,
      description: view.description,
      inLanguage: lang,
      isPartOf: { '@type': 'WebSite', name: 'SoloBeauté', url: SITE_URL },
      breadcrumb: { '@id': `${url}#breadcrumb` },
      mainEntity: { '@id': `${url}#list` },
      ...(view.about ? { about: view.about } : {}),
    },
    {
      '@type': 'ItemList',
      '@id': `${url}#list`,
      name: view.itemListName,
      numberOfItems: spaces.length,
      itemListElement: spaces.map((space, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: spacePlace(space, view.locale),
      })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: view.breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.label,
        item: localeUrl(crumb.path ?? view.path, view.locale),
      })),
    },
  ]
  if (view.faq.length) graph.push(faqPageSchema(`${url}#faq`, view.faq, lang))
  return { '@context': 'https://schema.org', '@graph': graph }
}

// Each listed space as a schema.org Place. Only whitelisted public fields:
// city / district (never the street address or coordinates), the host's
// equipment list, and the hourly rate / minimum hours when the host set them.
function spacePlace(space: PublicSpace, locale: TopicView['locale']) {
  const props: Record<string, unknown>[] = []
  if (space.hourlyRate) {
    props.push({ '@type': 'PropertyValue', name: locale === 'en' ? 'Hourly rate' : '時租', value: space.hourlyRate, unitCode: 'HUR', unitText: 'TWD' })
  }
  if (space.minimumHours) {
    props.push({ '@type': 'PropertyValue', name: locale === 'en' ? 'Minimum booking' : '最低時數', value: space.minimumHours, unitCode: 'HUR' })
  }
  return {
    '@type': 'Place',
    '@id': `${localeUrl(`/spaces/${space.id}`, locale)}#space`,
    name: space.title,
    url: localeUrl(`/spaces/${space.id}`, locale),
    ...(space.city || space.district
      ? {
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'TW',
            ...(space.city ? { addressRegion: locale === 'en' ? cityNameEn(space.city) : space.city } : {}),
            ...(space.district ? { addressLocality: locale === 'en' ? districtEn(space.district, space.city) : space.district } : {}),
          },
        }
      : {}),
    ...(space.equipment.length
      ? {
          amenityFeature: space.equipment.map((item) => ({
            '@type': 'LocationFeatureSpecification',
            name: locale === 'en' ? equipmentEn(item) : item,
            value: true,
          })),
        }
      : {}),
    ...(props.length ? { additionalProperty: props } : {}),
  }
}

function SpaceDetailsTable({ spaces, locale, title }: { spaces: PublicSpace[]; locale: TopicView['locale']; title: string }) {
  const isEn = locale === 'en'
  const href = (id: string) => (isEn ? localizePath(`/spaces/${id}`, 'en') : `/spaces/${id}`)
  const head = isEn
    ? ['Space', 'District', 'Transit / landmark (host’s words)', 'Equipment', 'Hourly rate', 'Minimum']
    : ['空間', '行政區', '交通・地標（屋主描述）', '設備', '時租', '最低時數']
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
      <table className={`w-full min-w-[720px] text-left text-sm ${NUM}`}>
        <caption className="sr-only">{title}</caption>
        <thead className="bg-black/[0.03] text-xs text-black/60">
          <tr>{head.map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-black/5 align-top">
          {spaces.map((space) => {
            const where = isEn
              ? (space.district ? districtEn(space.district, space.city) : cityNameEn(space.city)) || '—'
              : `${space.city ?? ''}${space.district ?? ''}` || '—'
            return (
              <tr key={space.id}>
                <th scope="row" className="px-4 py-3 font-medium text-ink">
                  <Link href={href(space.id)} lang={isEn ? 'zh-Hant' : undefined} className="text-brand underline-offset-4 hover:underline">{space.title}</Link>
                </th>
                <td className="whitespace-nowrap px-4 py-3 text-black/70">{where}</td>
                <td className="px-4 py-3 text-black/70" lang={isEn && space.transitNote ? 'zh-Hant' : undefined}>{space.transitNote ?? '—'}</td>
                <td className="px-4 py-3 text-black/70">
                  {space.equipment.length ? (isEn ? space.equipment.map(equipmentEn).join(', ') : space.equipment.join('、')) : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink">
                  {space.hourlyRate ? `${formatNtd(space.hourlyRate)}${isEn ? ' / h' : '／小時'}` : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-black/70">
                  {space.minimumHours ? (isEn ? `${space.minimumHours} h` : `${space.minimumHours} 小時`) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CellView({ cell }: { cell: Cell }) {
  if (typeof cell === 'string') return <>{cell}</>
  return <Link href={cell.href} className="text-brand underline-offset-4 hover:underline">{cell.text}</Link>
}

export function TopicPage({ view }: { view: TopicView }) {
  const isEn = view.locale === 'en'
  const L = (path: string) => (isEn ? localizePath(path, 'en') : path)
  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32" data-topic-page={view.path}>
      <JsonLd data={topicJsonLd(view)} />
      <div className="container space-y-10">
        <Breadcrumbs
          label={isEn ? 'Breadcrumb' : '麵包屑'}
          items={view.breadcrumbs.map((crumb) => ({ label: crumb.label, href: crumb.path ? L(crumb.path) : undefined }))}
        />

        <header className="space-y-4">
          <p className="section-tag">{view.tag}</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">{view.h1}</h1>
          <p className={`max-w-3xl text-base leading-8 text-black/70 ${NUM}`}>{view.lead}</p>
          {view.intro.map((paragraph) => (
            <p key={paragraph} className={`max-w-3xl text-sm leading-7 text-black/60 ${NUM}`}>{paragraph}</p>
          ))}
          <dl className="grid max-w-3xl grid-cols-2 gap-3 pt-2 md:grid-cols-4">
            {view.facts.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                <dt className="text-xs text-black/55">{fact.label}</dt>
                <dd className={`mt-1 text-lg font-semibold text-ink ${NUM}`}>{fact.value}</dd>
              </div>
            ))}
          </dl>
          <p className={`text-xs text-black/50 ${NUM}`}>{view.dateNote}</p>
          {view.noindexNote ? (
            <p className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/65">
              {view.noindexNote}{' '}
              <Link href={L('/spaces')} className="text-brand underline-offset-4 hover:underline">{isEn ? 'All beauty workspaces →' : '全部美業空間 →'}</Link>
            </p>
          ) : null}
        </header>

        {view.blocks.map((block) => (
          <Section key={block.id} id={block.id} title={block.title} note={block.note}>
            {block.paragraphs?.length ? (
              <Prose>
                {block.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </Prose>
            ) : null}
            {block.table ? (
              <DataTable
                caption={block.table.caption}
                head={block.table.head}
                rows={block.table.rows.map((row) => row.map((cell, index) => <CellView key={index} cell={cell} />))}
              />
            ) : null}
            {block.chips?.length ? (
              <nav aria-label={block.title} className="flex flex-wrap gap-2">
                {block.chips.map((chip) => (
                  <Link key={chip.href} href={chip.href} className={CHIP}>{chip.label}</Link>
                ))}
              </nav>
            ) : null}
            {block.links?.length ? (
              <div className="flex flex-col gap-2 text-sm">
                {block.links.map((link) => (
                  <Link key={link.href} href={link.href} className="text-brand underline-offset-4 hover:underline">{link.label}</Link>
                ))}
              </div>
            ) : null}
          </Section>
        ))}

        {view.lists.map((list) => (
          <section key={list.id} id={list.id} className="scroll-mt-28 space-y-5" aria-labelledby={`${list.id}-title`}>
            <div className="space-y-1">
              <h2 id={`${list.id}-title`} className="section-title">{list.title}</h2>
              {list.note ? <p className="text-sm text-black/55">{list.note}</p> : null}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.spaces.map((space) => (
                <SpaceCard key={space.id} space={space} locale={view.locale} />
              ))}
            </div>
            <div className="space-y-2" id={`${list.id}-details`}>
              <h3 className="text-base font-semibold text-ink">{isEn ? 'Each space at a glance' : '每間空間的位置、設備和時租'}</h3>
              <p className="text-xs text-black/55">
                {isEn
                  ? 'From what each host lists. The website shows the district only; the transit note is quoted from the host’s description (in Chinese), and “—” means the host has not said.'
                  : '依屋主在空間頁填寫的資料。網站只顯示到區；交通・地標直接引用屋主的空間描述，「—」代表屋主沒有寫。'}
              </p>
              <SpaceDetailsTable spaces={list.spaces} locale={view.locale} title={isEn ? `${list.title}: details` : `${list.title}：位置、設備和時租`} />
            </div>
          </section>
        ))}

        {view.faq.length ? <FaqBlock id="faq" title={view.faqTitle} items={view.faq} /> : null}

        <LinkChips id="more" title={view.related.title} links={view.related.links} />

        <section className="sb-card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">{view.cta.title}</h2>
          <p className="text-sm leading-7 text-black/65">{view.cta.text}</p>
          <StoreButtons buttonClassName="btn-dark" />
        </section>
      </div>
    </main>
  )
}
