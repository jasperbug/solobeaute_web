'use client'

import type { PropsWithChildren } from 'react'
import { useEffect, useRef } from 'react'

type RevealProps = PropsWithChildren<{
  className?: string
  delay?: number
  /**
   * Above-the-fold content (hero): slide in with CSS on first paint and never
   * start transparent, so it can be the LCP element without waiting for JS.
   */
  instant?: boolean
}>

// Fade/slide-in on scroll with CSS + IntersectionObserver (globals.css
// `.sb-reveal`). Replaces framer-motion, which kept the hero text at opacity 0
// until its JS had loaded and pushed mobile LCP to ~8 s.
export function Reveal({ children, className = '', delay = 0, instant = false }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (instant) return
    const node = ref.current
    if (!node) return
    // Toggle the class on the DOM node directly: no re-render needed.
    const show = () => node.classList.add('is-visible')
    if (typeof IntersectionObserver === 'undefined') {
      show()
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          show()
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [instant])

  const stateClass = instant ? 'sb-reveal--instant' : 'sb-reveal'

  return (
    <div
      ref={ref}
      className={`${stateClass} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}s`, animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  )
}
