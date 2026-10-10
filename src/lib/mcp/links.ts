import { hasEnglishVersion } from '@/i18n/config'

import { SITE_URL } from '../constants'
import { buildShareUrl } from '../format'
import { localeUrl } from '../i18nSeo'
import type { McpLocale } from './copy'

// Every MCP result links back to SoloBeauté: `canonical` is the page URL
// (no tracking parameters), `share` is the App hand-off link (/share/...)
// tagged utm_source=<client>&utm_medium=ai_agent&utm_campaign=mcp.

export type Links = { canonical: string; share: string }

const UTM_MEDIUM = 'ai_agent'
const UTM_CAMPAIGN = 'mcp'
const DEFAULT_SOURCE = 'mcp_client'

/** "Claude Desktop" → "claude_desktop"; anything unusable → "mcp_client". */
export function utmSource(clientName: string | null | undefined): string {
  const cleaned = (clientName ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  return cleaned || DEFAULT_SOURCE
}

export function withUtm(url: string, source: string): string {
  const parsed = new URL(url)
  parsed.searchParams.set('utm_source', source)
  parsed.searchParams.set('utm_medium', UTM_MEDIUM)
  parsed.searchParams.set('utm_campaign', UTM_CAMPAIGN)
  return parsed.toString()
}

/** Canonical URL of a site path in `locale` (falls back to zh when there is no /en page). */
export function pageUrl(path: string, locale: McpLocale): string {
  return localeUrl(path, locale === 'en' && hasEnglishVersion(path) ? 'en' : 'zh-TW')
}

export function spaceLinks(id: string, locale: McpLocale, source: string): Links {
  return {
    canonical: pageUrl(`/spaces/${id}`, locale),
    share: withUtm(buildShareUrl('space', id), source),
  }
}

/** Beautician pages have no /en version; `ref` is slug ?? profile id (from the public list only). */
export function beauticianLinks(ref: string, profileId: string, source: string): Links {
  return {
    canonical: `${SITE_URL}/beautician/${encodeURIComponent(ref)}`,
    share: withUtm(buildShareUrl('beautician', profileId), source),
  }
}

/** For results that are not about one space / beautician (regions, prices, brand facts). */
export function pageLinks(path: string, locale: McpLocale, source: string): Links {
  const canonical = pageUrl(path, locale)
  return { canonical, share: withUtm(canonical, source) }
}
