import { getTranslations } from 'next-intl/server'

import { HomeIcon, ScissorsIcon, UsersIcon } from '../ui/Icons'
import { Reveal } from '../ui/Reveal'

export async function EcosystemSection() {
  const t = await getTranslations('ecosystem')

  const roles = [
    { key: 'host', icon: <HomeIcon className="h-5 w-5" /> },
    { key: 'beautician', icon: <ScissorsIcon className="h-5 w-5" /> },
    { key: 'consumer', icon: <UsersIcon className="h-5 w-5" /> },
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
            <Reveal key={role.key} delay={index * 0.1}>
              <div className="eco__card">
                <div className="eco__card-top">
                  <div className={`eco__icon eco__icon--${role.key}`}>
                    {role.icon}
                  </div>
                  <div>
                    <h3 className="eco__role">{t(`${role.key}.role`)}</h3>
                    {role.key === 'consumer' ? <span className="eco__badge">{t('consumer.badge')}</span> : null}
                  </div>
                </div>
                <p className="eco__pain">{t(`${role.key}.pain`)}</p>
                <div className="eco__divider" />
                <p className="eco__solution">{t(`${role.key}.solution`)}</p>
                <p className="eco__desc">{t(`${role.key}.desc`)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
