import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          <div className="footer__brand">
            <Image src="/images/brand/logo.png" alt="" className="footer__logo" width={26} height={26} />
            <div>
              <span className="footer__name">SoloBeauté</span>
              <span className="footer__slogan">{t('footer.slogan')}</span>
            </div>
          </div>
          <div className="footer__links">
            <Link href="/privacy">{t('footer.legal')}</Link>
            <Link href="/terms">{t('footer.terms')}</Link>
            <Link href="/support">{t('footer.contact')}</Link>
          </div>
        </div>
        <p className="footer__copy">{t('footer.rights')}</p>
      </div>
    </footer>
  )
}
