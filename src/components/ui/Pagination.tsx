import Link from 'next/link'

type PaginationProps = {
  currentPage: number
  totalPages: number
  buildHref: (page: number) => string
  previousLabel: string
  nextLabel: string
  ariaLabel: string
}

type PaginationItem =
  | { type: 'page'; page: number }
  | { type: 'ellipsis'; key: string }

function buildItems(currentPage: number, totalPages: number): PaginationItem[] {
  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1])
  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right)

  const items: PaginationItem[] = []
  let previousPage: number | null = null

  for (const page of sortedPages) {
    if (previousPage !== null) {
      const gap = page - previousPage

      if (gap === 2) {
        items.push({ type: 'page', page: previousPage + 1 })
      } else if (gap > 2) {
        items.push({ type: 'ellipsis', key: `ellipsis-${previousPage}-${page}` })
      }
    }

    items.push({ type: 'page', page })
    previousPage = page
  }

  return items
}

function buttonClassName(isActive = false, isDisabled = false) {
  const baseClassName = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-4 text-sm font-medium transition'

  if (isActive) {
    return `${baseClassName} border-brand bg-brand text-white`
  }

  if (isDisabled) {
    return `${baseClassName} cursor-not-allowed border-black/10 bg-white text-black/30`
  }

  return `${baseClassName} border-black/10 bg-white text-black/65 hover:border-brand hover:text-brand`
}

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
  previousLabel,
  nextLabel,
  ariaLabel,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const items = buildItems(currentPage, totalPages)
  const previousPage = currentPage - 1
  const nextPage = currentPage + 1
  const hasPreviousPage = previousPage >= 1
  const hasNextPage = nextPage <= totalPages

  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap items-center justify-center gap-2">
      {hasPreviousPage ? (
        <Link href={buildHref(previousPage)} className={buttonClassName()}>
          {previousLabel}
        </Link>
      ) : (
        <span aria-disabled="true" className={buttonClassName(false, true)}>
          {previousLabel}
        </span>
      )}

      {items.map((item) => {
        if (item.type === 'ellipsis') {
          return (
            <span
              key={item.key}
              aria-hidden="true"
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm text-black/40"
            >
              …
            </span>
          )
        }

        const isActive = item.page === currentPage

        return (
          <Link
            key={item.page}
            href={buildHref(item.page)}
            aria-current={isActive ? 'page' : undefined}
            className={buttonClassName(isActive)}
          >
            {item.page}
          </Link>
        )
      })}

      {hasNextPage ? (
        <Link href={buildHref(nextPage)} className={buttonClassName()}>
          {nextLabel}
        </Link>
      ) : (
        <span aria-disabled="true" className={buttonClassName(false, true)}>
          {nextLabel}
        </span>
      )}
    </nav>
  )
}
