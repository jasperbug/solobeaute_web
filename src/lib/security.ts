const SOCIAL_HOSTS: Record<string, Set<string>> = {
  instagram: new Set(['instagram.com', 'www.instagram.com']),
  facebook: new Set(['facebook.com', 'www.facebook.com', 'm.facebook.com']),
  threads: new Set(['threads.net', 'www.threads.net']),
}

const SOCIAL_BASE_URLS: Record<string, string> = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  threads: 'https://www.threads.net/@',
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function encodePathSegment(value: string) {
  return encodeURIComponent(value).replace(/\./g, '%2E')
}

export function normalizeSocialUrl(type: string, value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return null

  const rawUrl = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `${SOCIAL_BASE_URLS[type] ?? 'https://'}${trimmed.replace(/^@/, '')}`

  try {
    const url = new URL(rawUrl)
    const allowedHosts = SOCIAL_HOSTS[type]

    if (url.protocol !== 'https:' || (allowedHosts && !allowedHosts.has(url.hostname.toLowerCase()))) {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}
