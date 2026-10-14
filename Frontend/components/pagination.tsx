import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buildQuery } from '@/lib/api'
import { cn } from '@/lib/utils'

export function Pagination({
  page,
  totalPages,
  basePath,
  className,
  searchParams,
}: {
  page: number
  totalPages?: number
  basePath: string
  className?: string
  searchParams?: Record<string, string | number | undefined>
}) {
  if (!totalPages || totalPages <= 1) return null

  function href(target: number): string {
    const query = buildQuery({ ...(searchParams ?? {}), page: target })
    return `${basePath}${query}`
  }

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-2', className)}>
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          rel="prev"
          className="inline-flex h-10 items-center gap-1 rounded-full border border-sand bg-white px-4 text-sm font-medium text-ink hover:border-ink-faint"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Link>
      ) : null}

      <span className="px-3 text-sm text-ink-muted">
        Page <span className="font-semibold text-ink">{page}</span> of {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          rel="next"
          className="inline-flex h-10 items-center gap-1 rounded-full border border-sand bg-white px-4 text-sm font-medium text-ink hover:border-ink-faint"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  )
}
