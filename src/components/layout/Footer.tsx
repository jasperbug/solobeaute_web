import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/constants'

export function Footer() {
  const t = useTranslations('footer')

  const productLinks = [
    { href: '/search', label: t('productFindPros'), external: false },
    { href: APP_STORE_URL, label: t('productDownloadIos'), external: true },
    { href: PLAY_STORE_URL, label: t('productDownloadAndroid'), external: true },
  ]

  const aboutLinks = [
    { href: '/#about', label: t('aboutUs') },
    { href: '/#faq', label: t('faq') },
  ]

  const legalLinks = [
    { href: '/privacy', label: t('privacy') },
    { href: '/terms', label: t('terms') },
    { href: '/support', label: t('support') },
    { href: '/delete-account', label: t('deleteAccount') },
  ]

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Image src="/images/brand/logo.png" alt="" className="footer__logo" width={26} height={26} />
            <div>
              <span className="footer__name">SoloBeauté</span>
              <span className="footer__slogan">{t('slogan')}</span>
            </div>
            <p className="footer__desc">{t('description')}</p>
          </div>

          <div className="footer__col">
            <p className="footer__heading">{t('productTitle')}</p>
            <div className="footer__links footer__links--stack">
              {productLinks.map((item) => (
                item.external ? (
                  <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">{item.label}</a>
                ) : (
                  <Link key={item.href} href={item.href}>{item.label}</Link>
                )
              ))}
            </div>
          </div>

          <div className="footer__col">
            <p className="footer__heading">{t('aboutTitle')}</p>
            <div className="footer__links footer__links--stack">
              {aboutLinks.map((item) => (
                <Link key={item.href} href={item.href}>{item.label}</Link>
              ))}
            </div>
          </div>

          <div className="footer__col">
            <p className="footer__heading">{t('legalTitle')}</p>
            <div className="footer__links footer__links--stack">
              {legalLinks.map((item) => (
                <Link key={item.href} href={item.href}>{item.label}</Link>
              ))}
            </div>
          </div>
        </div>
        <div className="footer__meta">
          <p className="footer__copy">{t('rights')}</p>
          <p className="footer__made-in">{t('madeIn')}</p>
        </div>
      </div>
    </footer>
  )
}
