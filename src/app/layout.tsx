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
    default: 'SoloBeauté',
    template: '%s | SoloBeauté',
  },
  description:
    '給獨立美業職人找空間，也讓屋主把閒置時段變成收入。SoloBeauté 以空間共享為核心，網站同步提供找職人導流入口。',
  openGraph: {
    siteName: 'SoloBeauté',
    title: 'SoloBeauté',
    description: '給職人找空間、給屋主出租空間，也提供找職人導流入口。',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SoloBeauté',
    description:
      '給獨立美業職人找空間，也讓屋主把閒置時段變成收入。SoloBeauté 以空間共享為核心，網站同步提供找職人導流入口。',
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

  return (
    <html lang={locale} className={`${notoSansTc.variable} ${cormorantGaramond.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
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
