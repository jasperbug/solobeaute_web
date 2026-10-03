import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { Reveal } from '../ui/Reveal'

export type FaqItemData = {
  q: string
  a: string
}

// Native <details>/<summary> keeps every answer in the server-rendered HTML
// (crawlers and AI agents read raw HTML), works without JavaScript, and keeps
// the visible text identical to the FAQPage JSON-LD built in src/app/page.tsx
// from the same `faq.items` messages. Do not switch back to conditionally
// rendering answers on the client.
function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="faq__item">
      <summary className="faq__question">
        <span>{question}</span>
        <svg className="faq__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <div className="faq__answer">
        <p>{answer}</p>
      </div>
    </details>
  )
}

export function FaqSection() {
  const t = useTranslations('faq')
  const items = t.raw('items') as FaqItemData[]

  return (
    <section className="faq" id="faq">
      <div className="container">
        <div className="faq__intro">
          <Reveal>
            <p className="section-tag">{t('sectionTag')}</p>
            <h2 className="section-title">{t('title')}</h2>
          </Reveal>
        </div>

        <div className="faq__list">
          {items.map((item, index) => (
            <Reveal key={item.q} delay={Math.min(index, 6) * 0.06}>
              <FaqItem question={item.q} answer={item.a} />
            </Reveal>
          ))}
        </div>

        <p className="faq__more">
          <Link href="/faq">{t('more')} →</Link>
        </p>
      </div>
    </section>
  )
}
