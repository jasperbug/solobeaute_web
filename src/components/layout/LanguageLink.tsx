'use client'

import { usePathname } from 'next/navigation'

import { LOCALE_COOKIE_NAME, hasEnglishVersion, localizePath, stripLocalePrefix, type AppLocale } from '@/i18n/config'

// Footer link to the same page in the other language (or that language's
// homepage when the page has no English version). Plain <a> + cookie, so the
// root layout re-renders in the new language and the middleware never bounces
// the visitor back to the language they just left.
export function LanguageLink({ target, label, className }: { target: AppLocale; label: string; className?: string }) {
  const { path } = stripLocalePrefix(usePathname() ?? '/')
  const href = localizePath(hasEnglishVersion(path) ? path : '/', target)

  return (
    <a
      href={href}
      hrefLang={target}
      lang={target}
      className={className}
      onClick={() => {
        const secure = window.location.protocol === 'https:' ? '; secure' : ''
        document.cookie = `${LOCALE_COOKIE_NAME}=${target}; path=/; max-age=31536000; samesite=lax${secure}`
      }}
    >
      {label}
    </a>
  )
}
