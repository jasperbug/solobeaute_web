import type { Metadata } from 'next'

import { unprefixedPageUrls } from '@/lib/siteMetadata'

// /login is a client page, so its canonical / og:url live here.
export const metadata: Metadata = unprefixedPageUrls('/login')

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
