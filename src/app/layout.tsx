// The real root layout (<html>, fonts, providers) is src/app/[locale]/layout.tsx.
// src/middleware.ts rewrites every page URL to /{locale}/…, so the locale is a
// route param and pages can be statically rendered (ISR) instead of reading
// cookies / headers on every request.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
