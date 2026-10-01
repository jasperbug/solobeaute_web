type JsonLdProps = {
  data: unknown
}

// Server-only <script type="application/ld+json">. `<` is escaped so
// user-supplied text (space titles/descriptions) can't close the tag.
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
