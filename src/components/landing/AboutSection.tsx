import { getTranslations } from 'next-intl/server'

import { Reveal } from '../ui/Reveal'

export async function AboutSection() {
  const t = await getTranslations('about')

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
              <div className="about__founder">
                <div className="about__avatar about__avatar--meigo">M</div>
                <div>
                  <p className="about__name">{t('founder1')}</p>
                  <p className="about__bio">{t('founder1Desc')}</p>
                </div>
              </div>
              <div className="about__founder">
                <div className="about__avatar">J</div>
                <div>
                  <p className="about__name">{t('founder2')}</p>
                  <p className="about__bio">{t('founder2Desc')}</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
