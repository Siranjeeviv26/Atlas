'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Destination search. A plain GET form would also work, but this keeps the
 * URL update client-side so the navigation feels instant.
 */
export function DestinationSearch({
  className,
  tone = 'light',
  autoFocus = false,
  placeholder = 'Try Iceland, Kyoto, Patagonia…',
}: {
  className?: string
  tone?: 'light' | 'dark'
  autoFocus?: boolean
  placeholder?: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const q = query.trim()
    router.push(q ? `/destinations?q=${encodeURIComponent(q)}` : '/destinations')
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className={cn('flex w-full items-center gap-2', className)}
    >
      <div
        className={cn(
          'relative flex h-12 flex-1 items-center rounded-full border px-5',
          tone === 'dark'
            ? 'border-white/25 bg-white/10 backdrop-blur-md'
            : 'border-sand bg-white',
        )}
      >
        <Search
          aria-hidden
          className={cn('absolute left-4 h-4 w-4', tone === 'dark' ? 'text-white/60' : 'text-ink-faint')}
        />
        <label htmlFor="destination-search" className="sr-only">
          Search destinations
        </label>
        <input
          id="destination-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            'w-full bg-transparent pl-6 text-[15px] outline-none placeholder:',
            tone === 'dark'
              ? 'text-white placeholder:text-white/50'
              : 'text-ink placeholder:text-ink-faint',
          )}
        />
      </div>
      <button
        type="submit"
        aria-label="Search"
        className={cn(
          'inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-all active:scale-[0.98] sm:px-6',
          tone === 'dark'
            ? 'bg-white text-midnight hover:bg-white/90'
            : 'bg-teal text-white hover:bg-teal-dark',
        )}
      >
        <Search className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  )
}
