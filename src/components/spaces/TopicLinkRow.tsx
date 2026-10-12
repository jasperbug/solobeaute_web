import Link from 'next/link'

import type { TopicLink } from '@/lib/topicPages'

const CHIP =
  'inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm text-ink transition hover:border-brand hover:text-brand [font-family:var(--font-body)] lining-nums'

/** 「依需求找空間」 chip row linking the theme / district pages (live counts). */
export function TopicLinkRow({ title, links }: { title: string; links: TopicLink[] }) {
  if (links.length === 0) return null
  return (
    <nav aria-label={title} className="space-y-2 pt-1" data-topic-links>
      <p className="text-sm text-black/55">{title}</p>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={CHIP}>{link.label}</Link>
        ))}
      </div>
    </nav>
  )
}
