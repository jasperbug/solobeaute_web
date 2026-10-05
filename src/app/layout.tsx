import type { Metadata } from 'next'
import { Cormorant_Garamond, Noto_Sans_TC } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { SITE_URL } from '@/lib/constants'

import './globals.css'

const notoSansTc = Noto_Sans_TC({
  weight: ['300', '400', '500', '600', '700'],
  preload: false,
  display: 'swap',
  variable: '--font-sans-tc',
})

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display-serif',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SoloBeauté｜美業空間時租・美容工作室按小時租',
    template: '%s | SoloBeauté',
  },
  description:
    '美甲、美睫、美容職人按小時租現成工作空間，時租 NT$100–350，台北、新北、桃園、台中、高雄、彰化、南投都有。現場付現。',
  openGraph: {
    siteName: 'SoloBeauté',
    title: 'SoloBeauté｜美業空間按小時租',
    description:
      '打開 App 看空間、看價錢、看 3D 實景，直接跟屋主約時間。時租 NT$100–350，台北到高雄 7 縣市都有。',
    locale: 'zh_TW',
    type: 'website',
    // Relative, so each route resolves its own og:url against metadataBase.
    url: './',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SoloBeauté｜美業空間按小時租',
    description:
      '打開 App 看空間、看價錢、看 3D 實景，直接跟屋主約時間。時租 NT$100–350，台北到高雄 7 縣市都有。',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: './',
  },
  icons: {
    icon: '/images/brand/logo.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()
  // faq.items holds {placeholder} templates that only server components fill
  // with live data (src/lib/faqStats.ts); don't ship the raw templates to the
  // client bundle / RSC payload.
  const faqMessages = (messages.faq ?? {}) as Record<string, unknown>
  const { items: _faqItems, ...faqClient } = faqMessages
  void _faqItems
  const clientMessages = { ...messages, faq: faqClient }

  return (
    <html lang={locale} className={`${notoSansTc.variable} ${cormorantGaramond.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={clientMessages as typeof messages}>
          <div className="app">
            <Header />
            {children}
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
