import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { APP_STORE_URL, INSTAGRAM_URL, PLAY_STORE_URL, THREADS_URL } from '@/lib/constants'

export function Footer() {
  const t = useTranslations('footer')

  const productLinks = [
    { href: '/spaces', label: t('productFindSpaces'), external: false },
    { href: '/search', label: t('productFindPros'), external: false },
    { href: '/spaces/price-report', label: t('productPriceReport'), external: false },
    { href: '/guides/lash-artist-studio', label: t('productLashGuide'), external: false },
    { href: '/guides/hourly-vs-monthly-rent', label: t('productHourlyVsMonthly'), external: false },
    { href: '/hosts', label: t('productHosts'), external: false },
    { href: APP_STORE_URL, label: t('productDownloadIos'), external: true },
    { href: PLAY_STORE_URL, label: t('productDownloadAndroid'), external: true },
  ]

  const aboutLinks = [
    { href: '/about', label: t('aboutUs') },
    { href: '/faq', label: t('faq') },
    { href: '/en', label: t('english') },
  ]

  const socialLinks = [
    { href: INSTAGRAM_URL, label: t('instagram'), ariaLabel: t('instagramAria') },
    { href: THREADS_URL, label: t('threads'), ariaLabel: t('threadsAria') },
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
            <nav className="footer__links" aria-label={t('socialLabel')}>
              {socialLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer me"
                  aria-label={item.ariaLabel}
                >
                  {item.label}
                </a>
              ))}
            </nav>
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
