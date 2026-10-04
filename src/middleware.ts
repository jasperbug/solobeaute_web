import { NextResponse, type NextRequest } from 'next/server'

import {
  LOCALE_COOKIE_NAME,
  LOCALE_HEADER,
  hasEnglishVersion,
  localizePath,
  stripLocalePrefix,
} from './i18n/config'

// /en/{path}  → rewrite to /{path} with LOCALE_HEADER = en (English page, own URL)
// /{path}     → zh-TW, LOCALE_HEADER = zh-TW (unless the visitor's locale
//               cookie is en — set by the language switch or a visit to /en —
//               → 307 to /en/{path})
// Routes without an English version are left alone (cookie behaviour as before).
// No Accept-Language redirects: crawlers must always get the URL they asked for.
function isDocumentNavigation(request: NextRequest): boolean {
  const headers = request.headers
  const purpose = headers.get('sec-purpose') ?? headers.get('purpose') ?? ''
  if (purpose.includes('prefetch') || headers.has('next-router-prefetch') || headers.has('rsc')) return false
  const dest = headers.get('sec-fetch-dest')
  if (dest) return dest === 'document'
  return (headers.get('accept') ?? '').includes('text/html')
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete(LOCALE_HEADER)

  const { locale, path } = stripLocalePrefix(pathname)

  if (locale === 'en') {
    if (!hasEnglishVersion(path)) {
      const url = request.nextUrl.clone()
      url.pathname = path
      return NextResponse.redirect(url, 307)
    }
    requestHeaders.set(LOCALE_HEADER, 'en')
    const url = request.nextUrl.clone()
    url.pathname = path
    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    // Remember the choice (same as next-intl's locale cookie) so pages without
    // an English URL (/search, /support…) also render in English. Only for real
    // document loads: router prefetches / RSC fetches (whose Next.js headers are
    // stripped before middleware on Vercel) must never change the language just
    // because a link to /en was rendered.
    if (isDocumentNavigation(request) && request.cookies.get(LOCALE_COOKIE_NAME)?.value !== 'en') {
      response.cookies.set(LOCALE_COOKIE_NAME, 'en', { path: '/', maxAge: 31536000, sameSite: 'lax' })
    }
    return response
  }

  if (hasEnglishVersion(pathname)) {
    if (request.cookies.get(LOCALE_COOKIE_NAME)?.value === 'en') {
      const url = request.nextUrl.clone()
      url.pathname = localizePath(pathname, 'en')
      url.search = search
      return NextResponse.redirect(url, 307)
    }
    requestHeaders.set(LOCALE_HEADER, 'zh-TW')
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  // Pages only: skip Next internals, API routes and files with an extension
  // (llms.txt, sitemap.xml, robots.txt, /.well-known/assetlinks.json, images).
  matcher: ['/((?!_next/|api/|.*\\..*).*)'],
}
