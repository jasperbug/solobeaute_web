import { notFound } from 'next/navigation'

// Unknown paths render [locale]/not-found.tsx inside the localized layout.
export default function CatchAllNotFound() {
  notFound()
}
