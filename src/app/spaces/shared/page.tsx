import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'

import { TopicPage, topicMetadata } from '@/components/spaces/TopicPage'
import type { AppLocale } from '@/i18n/config'
import { fetchPublicSpaces } from '@/lib/spaces'
import { buildTopicView } from '@/lib/topicPages'

export const revalidate = 3600

async function load() {
  const locale = ((await getLocale()) === 'en' ? 'en' : 'zh-TW') as AppLocale
  return buildTopicView('shared', await fetchPublicSpaces(), locale)
}

export async function generateMetadata(): Promise<Metadata> {
  return topicMetadata(await load())
}

export default async function SharedSpacesPage() {
  return <TopicPage view={await load()} />
}
