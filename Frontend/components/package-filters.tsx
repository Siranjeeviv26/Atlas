'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { cn, titleCase } from '@/lib/utils'

interface ActiveParams {
  page?: string
  style?: string
  minPrice?: string
  maxPrice?: string
  maxDuration?: string
  sort?: string
}

const SORTS = [
  { value: undefined, label: 'Recommended' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
  { value: 'rating', label: 'Top rated' },
  { value: 'duration_asc', label: 'Shortest' },
] as const

const DURATIONS = [
  { value: undefined, label: 'Any length' },
  { value: '7', label: '≤ 1 week' },
  { value: '10', label: '≤ 10 days' },
  { value: '14', label: '≤ 2 weeks' },
] as const

export function PackageFilters({
  styles,
  active,
}: {
  styles: string[]
  active: ActiveParams
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const apply = useCallback(
    (patch: Partial<ActiveParams>) => {
      const merged: ActiveParams = { ...active, page: '1', ...patch }
      const search = new URLSearchParams()
      for (const [key, value] of Object.entries(merged)) {
        if (value === undefined || value === '' || value === null) continue
        search.set(key, String(value))
      }
      const query = search.toString()
      startTransition(() => {
        router.push(query ? `/packages?${query}` : '/packages', { scroll: false })
      })
    },
    [active, router],
  )

  return (
    <div
      className={cn(
        'mt-10 rounded-2xl border border-sand bg-white p-5',
        isPending && 'opacity-70',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-ink">
          <SlidersHorizontal className="h-4 w-4 text-teal" />
          Filter & sort
        </p>
        {active.style || active.maxPrice || active.maxDuration || active.sort ? (
          <button
            type="button"
            onClick={() => apply({ style: undefined, maxPrice: undefined, maxDuration: undefined, sort: undefined })}
            className="text-[13px] font-medium text-teal-dark underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {styles.length ? (
        <div className="mt-4">
          <p className="eyebrow">Travel style</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip active={!active.style} onClick={() => apply({ style: undefined })}>
              All styles
            </Chip>
            {styles.map((style) => (
              <Chip
                key={style}
                active={active.style === style}
                onClick={() => apply({ style: active.style === style ? undefined : style })}
              >
                {titleCase(style)}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <p className="eyebrow">Max price (per person)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { value: undefined, label: 'Any' },
              { value: '150000', label: '≤ $1,500' },
              { value: '300000', label: '≤ $3,000' },
              { value: '500000', label: '≤ $5,000' },
            ].map((item) => (
              <Chip
                key={item.label}
                active={active.maxPrice === item.value}
                onClick={() => apply({ maxPrice: item.value })}
              >
                {item.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow">Length</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DURATIONS.map((item) => (
              <Chip
                key={item.label}
                active={active.maxDuration === item.value}
                onClick={() => apply({ maxDuration: item.value })}
              >
                {item.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-sand pt-4">
        <p className="eyebrow">Sort by</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SORTS.map((item) => (
            <Chip
              key={item.label}
              active={active.sort === item.value}
              onClick={() => apply({ sort: item.value })}
            >
              {item.label}
            </Chip>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {isPending ? 'Updating results' : 'Results updated'}
      </p>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
        active
          ? 'border-teal bg-teal/10 text-teal-dark'
          : 'border-sand bg-white text-ink-muted hover:border-ink-faint hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
