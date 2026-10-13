import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'

import { TopicPage, topicMetadata } from '@/components/spaces/TopicPage'
import type { AppLocale } from '@/i18n/config'
import { fetchPublicSpaces } from '@/lib/spaces'
import { DISTRICT_PAGES, buildDistrictView, getDistrictPage } from '@/lib/topicPages'

export const revalidate = 3600
// Only districts listed in DISTRICT_PAGES exist; anything else is a 404.
export const dynamicParams = false

export function generateStaticParams() {
  return DISTRICT_PAGES.map((d) => ({ city: d.citySlug, district: d.slug }))
}

type Props = { params: { city: string; district: string } }

async function load(params: Props['params']) {
  const def = getDistrictPage(params.city, params.district)
  if (!def) notFound()
  const locale = ((await getLocale()) === 'en' ? 'en' : 'zh-TW') as AppLocale
  return buildDistrictView(def, await fetchPublicSpaces(), locale)
}

export async function generateMetadata({ params }: Props & { params: { locale: string } }): Promise<Metadata> {
  setRequestLocale(params.locale)
  return topicMetadata(await load(params))
}

export default async function DistrictSpacesPage({ params }: Props & { params: { locale: string } }) {
  setRequestLocale(params.locale)
  return <TopicPage view={await load(params)} />
}
