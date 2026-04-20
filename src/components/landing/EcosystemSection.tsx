import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { APP_STORE_URL } from '@/lib/constants'
import { HomeIcon, ScissorsIcon, UsersIcon } from '../ui/Icons'
import { Reveal } from '../ui/Reveal'

export async function EcosystemSection() {
  const t = await getTranslations('ecosystem')

  const roles = [
    { key: 'beautician', icon: <ScissorsIcon className="h-5 w-5" />, showPriority: true, href: APP_STORE_URL, external: true },
    { key: 'host', icon: <HomeIcon className="h-5 w-5" />, showPriority: false, href: APP_STORE_URL, external: true },
    { key: 'consumer', icon: <UsersIcon className="h-5 w-5" />, showPriority: true, href: '/search', external: false },
  ] as const

  return (
    <section className="eco">
      <div className="container">
        <Reveal>
          <p className="section-tag">{t('sectionTag')}</p>
          <h2 className="section-title">{t('title')}</h2>
          <p className="section-subtitle">{t('subtitle')}</p>
        </Reveal>

        <div className="eco__grid">
          {roles.map((role, index) => (
            <Reveal key={role.key} delay={index * 0.1} className="eco__item">
              <div className={`eco__card ${role.key === 'beautician' ? 'eco__card--featured' : ''}`}>
                <div className="eco__card-top">
                  <div className={`eco__icon eco__icon--${role.key}`}>
                    {role.icon}
                  </div>
                  <div className="eco__heading">
                    <p className="eco__tag">{t(`${role.key}.tag`)}</p>
                    {role.showPriority ? <span className="eco__priority">{t(`${role.key}.priority`)}</span> : null}
                  </div>
                </div>
                <h3 className="eco__role">{t(`${role.key}.title`)}</h3>
                <div className="eco__divider" />
                <p className="eco__desc">{t(`${role.key}.desc`)}</p>
                {role.external ? (
                  <a
                    href={role.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eco__cta eco__cta--link"
                  >
                    {t(`${role.key}.cta`)}
                  </a>
                ) : (
                  <Link href={role.href} className="eco__cta eco__cta--link">
                    {t(`${role.key}.cta`)}
                  </Link>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
