import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'

import { TopicPage, topicMetadata } from '@/components/spaces/TopicPage'
import type { AppLocale } from '@/i18n/config'
import { fetchPublicSpaces } from '@/lib/spaces'
import { SERVICE_SLUGS, buildTopicView, type ServiceKey } from '@/lib/topicPages'

export const revalidate = 3600
// Only /spaces/service/{nail,brow,lash} exist; anything else is a 404.
export const dynamicParams = false

export function generateStaticParams() {
  return SERVICE_SLUGS.map((service) => ({ service }))
}

type Props = { params: { service: string } }

async function load(params: Props['params']) {
  if (!SERVICE_SLUGS.includes(params.service as ServiceKey)) notFound()
  const locale = ((await getLocale()) === 'en' ? 'en' : 'zh-TW') as AppLocale
  return buildTopicView(params.service as ServiceKey, await fetchPublicSpaces(), locale)
}

export async function generateMetadata({ params }: Props & { params: { locale: string } }): Promise<Metadata> {
  setRequestLocale(params.locale)
  return topicMetadata(await load(params))
}

export default async function ServiceSpacesPage({ params }: Props & { params: { locale: string } }) {
  setRequestLocale(params.locale)
  return <TopicPage view={await load(params)} />
}
