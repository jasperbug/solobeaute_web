import type { Metadata } from 'next'

/** Site-wide Open Graph defaults (used by src/app/[locale]/layout.tsx). */
export const SITE_OPEN_GRAPH: NonNullable<Metadata['openGraph']> = {
  siteName: 'SoloBeauté',
  title: 'SoloBeauté｜美業空間按小時租',
  description:
    '打開 App 看空間、看價錢、看 3D 實景，直接跟屋主約時間。時租 NT$100–350，台北到高雄 7 縣市都有。',
  locale: 'zh_TW',
  type: 'website',
  // Relative, so each route resolves its own og:url against metadataBase.
  url: './',
  images: ['/og-image.png'],
}

/**
 * Explicit canonical + og:url for pages that only exist at one unprefixed URL.
 * The layout's relative './' would resolve against the internal /{locale}/…
 * route that src/middleware.ts rewrites to, so these pages set it themselves.
 */
export function unprefixedPageUrls(path: string): Pick<Metadata, 'alternates' | 'openGraph'> {
  return {
    alternates: { canonical: path },
    openGraph: { ...SITE_OPEN_GRAPH, url: path },
  }
}
