import { NextResponse, type NextRequest } from 'next/server'

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  LOCALE_HEADER,
  type AppLocale,
  hasEnglishVersion,
  isSupportedLocale,
  resolveLocaleFromHeader,
  localizePath,
  stripLocalePrefix,
} from './i18n/config'

// /en/{path}  → rewrite to /{path} with LOCALE_HEADER = en (English page, own URL)
// /{path}     → zh-TW, LOCALE_HEADER = zh-TW (unless the visitor's locale
//               cookie is en — set by the language switch or a visit to /en —
//               → 307 to /en/{path})
// Routes without an English version: cookie, then Accept-Language (as before).
// Every page is finally rewritten to the internal /{locale}/… route
// (src/app/[locale]) so the locale is a route param and pages can be cached.
// No Accept-Language redirects: crawlers must always get the URL they asked for.
function isDocumentNavigation(request: NextRequest): boolean {
  const headers = request.headers
  const purpose = headers.get('sec-purpose') ?? headers.get('purpose') ?? ''
  if (purpose.includes('prefetch') || headers.has('next-router-prefetch') || headers.has('rsc')) return false
  const dest = headers.get('sec-fetch-dest')
  if (dest) return dest === 'document'
  return (headers.get('accept') ?? '').includes('text/html')
}

/** Internal route for `path` in `locale`: /faq → /zh-TW/faq, / → /en. */
function internalPath(path: string, locale: AppLocale): string {
  return `/${locale}${path === '/' ? '' : path}`
}

function rewriteTo(request: NextRequest, path: string, locale: AppLocale, requestHeaders: Headers) {
  const url = request.nextUrl.clone()
  url.pathname = internalPath(path, locale)
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // The internal zh-TW prefix is not a public URL.
  const internalZh = `/${DEFAULT_LOCALE}`
  if (pathname === internalZh || pathname.startsWith(`${internalZh}/`)) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(internalZh.length) || '/'
    return NextResponse.redirect(url, 308)
  }
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
    const response = rewriteTo(request, path, 'en', requestHeaders)
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
    return rewriteTo(request, pathname, 'zh-TW', requestHeaders)
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value
  const fallbackLocale = isSupportedLocale(cookieLocale)
    ? cookieLocale
    : resolveLocaleFromHeader(request.headers.get('accept-language'))
  return rewriteTo(request, pathname, fallbackLocale, requestHeaders)
}

export const config = {
  // Pages only: skip Next internals, API routes, the MCP endpoint (/mcp) and
  // files with an extension (llms.txt, sitemap.xml, robots.txt,
  // /.well-known/assetlinks.json, images).
  matcher: ['/((?!_next/|api/|mcp$|mcp/|.*\\..*).*)'],
}
