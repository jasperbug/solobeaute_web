import Link from 'next/link'
import { useLocale } from 'next-intl'

import { legalContent } from '@/lib/legal-content'

type LegalType = 'support' | 'privacy' | 'terms'

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
} as const

export function LegalPageTemplate({ type }: { type: LegalType }) {
  const locale = useLocale()
  const resolvedLocale = locale.startsWith('zh') ? 'zh' : 'en'
  const localeContent = legalContent[resolvedLocale]
  const content = localeContent[type]
  const labels = uiCopy[resolvedLocale]

  return (
    <section className="legal-page">
      <div className="legal-page__hero">
        <div className="container legal-page__hero-inner">
          <p className="section-tag">{content.eyebrow}</p>
          <h1 className="legal-page__title">{content.title}</h1>
          <p className="legal-page__intro">{content.intro}</p>
          <div className="legal-page__links">
            <span>{content.updatedAt}</span>
            <Link href="/support">{labels.support}</Link>
            <Link href="/privacy">{labels.privacy}</Link>
            <Link href="/terms">{labels.terms}</Link>
          </div>
        </div>
      </div>

      <div className="legal-page__body">
        <div className="container legal-page__stack">
          {'metadata' in content ? (
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
          ) : null}

          <section className="legal-content">
            {content.sections.map((section) => (
              <article key={section.title} className="legal-card">
                <h2>{section.title}</h2>
                {'paragraphs' in section && section.paragraphs
                  ? section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                  : null}
                {'points' in section && section.points ? (
                  <ul>
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </section>

          {'faqs' in content && content.faqs ? (
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
          ) : null}
        </div>
      </div>
    </section>
  )
}
