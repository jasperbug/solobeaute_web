import { getTranslations } from 'next-intl/server'

import { Reveal } from '../ui/Reveal'

export async function AboutSection() {
  const t = await getTranslations('about')
  const founders = [
    {
      key: 'founder1',
      initial: 'J',
      className: 'about__avatar about__avatar--jasper',
    },
    {
      key: 'founder2',
      initial: 'M',
      className: 'about__avatar about__avatar--meigo',
    },
  ] as const

  return (
    <section className="about" id="about">
      <div className="container">
        <div className="about__inner">
          <Reveal>
            <p className="section-tag">{t('sectionTag')}</p>
            <h2 className="about__title">{t('title')}</h2>
            <p className="about__desc">{t('desc')}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="about__founders">
              {founders.map((founder) => (
                <div className="about__founder" key={founder.key}>
                  <div className={founder.className}>
                    <span className="relative z-10">{founder.initial}</span>
                  </div>
                  <h3 className="about__name">{t(`${founder.key}.name`)}</h3>
                  <p className="about__role">{t(`${founder.key}.role`)}</p>
                  <p className="about__bio">{t(`${founder.key}.desc`)}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
