'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { Reveal } from '../ui/Reveal'

type FaqItemData = {
  q: string
  a: string
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`faq__item ${open ? 'faq__item--open' : ''}`}>
      <button
        type="button"
        className="faq__question"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>{question}</span>
        <svg className="faq__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="faq__answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p>{answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function FaqSection() {
  const t = useTranslations('faq')
  const items = t.raw('items') as FaqItemData[]

  return (
    <section className="faq">
      <div className="container">
        <Reveal>
          <p className="section-tag">{t('sectionTag')}</p>
          <h2 className="section-title">{t('title')}</h2>
        </Reveal>

        <div className="faq__list">
          {items.map((item, index) => (
            <Reveal key={item.q} delay={index * 0.08}>
              <FaqItem question={item.q} answer={item.a} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
