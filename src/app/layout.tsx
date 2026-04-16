import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { SITE_URL } from '@/lib/constants'

import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SoloBeauté',
    template: '%s | SoloBeauté',
  },
  description: '職人的獨立舞台，從搜尋職人、品牌頁到分享預覽，讓每次美容服務都找到最適合的空間與人。',
  openGraph: {
    siteName: 'SoloBeauté',
    title: 'SoloBeauté',
    description: '職人的獨立舞台',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SoloBeauté',
    description: '職人的獨立舞台，從搜尋職人、品牌頁到分享預覽，讓每次美容服務都找到最適合的空間與人。',
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
    <html lang={locale}>
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
