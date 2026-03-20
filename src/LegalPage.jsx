import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { legalContent } from './legalContent'
import SiteChrome from './SiteChrome'
import './LegalPage.css'

function resolveLocale(language) {
  return language.startsWith('zh') ? 'zh' : 'en'
}

const uiCopy = {
  zh: {
    support: '客服支援',
    privacy: '隱私政策',
    terms: '服務條款',
    faq: '常見問題',
  },
  en: {
    support: 'Support',
    privacy: 'Privacy',
    terms: 'Terms',
    faq: 'FAQ',
  },
}

export default function LegalPage({ type }) {
  const { i18n } = useTranslation()
  const locale = resolveLocale(i18n.language)
  const content = legalContent[locale][type]
  const labels = uiCopy[locale]

  return (
    <SiteChrome>
      <section className="legal-page">
        <div className="legal-page__hero">
          <div className="container legal-page__hero-inner">
            <p className="section-tag">{content.eyebrow}</p>
            <h1 className="legal-page__title">{content.title}</h1>
            <p className="legal-page__intro">{content.intro}</p>
            <div className="legal-page__links">
              <span>{content.updatedAt}</span>
              <Link to="/support">{labels.support}</Link>
              <Link to="/privacy">{labels.privacy}</Link>
              <Link to="/terms">{labels.terms}</Link>
            </div>
          </div>
        </div>

        <div className="legal-page__body">
          <div className="container legal-page__stack">
            {'metadata' in content && (
              <section className="legal-card legal-card--meta">
                <div className="legal-card__grid">
                  {content.metadata.map((item) => (
                    <div key={item.label} className="legal-contact">
                      <span className="legal-contact__label">{item.label}</span>
                      {item.href ? (
                        <a href={item.href} className="legal-contact__value">
                          {item.value}
                        </a>
                      ) : (
                        <span className="legal-contact__value">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="legal-content">
              {content.sections.map((section) => (
                <article key={section.title} className="legal-card">
                  <h2>{section.title}</h2>
                  {'paragraphs' in section &&
                    section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  {'points' in section && (
                    <ul>
                      {section.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </section>

            {'faqs' in content && (
              <section className="legal-faq">
                <div className="legal-faq__header">
                  <p className="section-tag">{labels.support}</p>
                  <h2>{labels.faq}</h2>
                </div>
                <div className="legal-faq__list">
                  {content.faqs.map((item) => (
                    <article key={item.q} className="legal-card">
                      <h3>{item.q}</h3>
                      <p>{item.a}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </SiteChrome>
  )
}
