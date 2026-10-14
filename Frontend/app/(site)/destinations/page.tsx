import type { Metadata } from 'next'
import { Search } from 'lucide-react'
import { api, apiData, buildQuery } from '@/lib/api'
import type { DestinationFilters, DestinationListItem, PaginationMeta } from '@/lib/types'
import { DestinationCard } from '@/components/trip-cards'
import { Pagination } from '@/components/pagination'
import { EmptyState } from '@/components/empty-state'

export const metadata: Metadata = {
  title: 'Destinations',
  description: 'Browse every Atlas destination by continent, category and travel style.',
}

export const revalidate = 300

interface SearchParams {
  page?: string
  category?: string
  continent?: string
  country?: string
  budget?: string
  q?: string
  sort?: string
}

async function getDestinations(params: SearchParams) {
  const query = buildQuery({
    page: params.page ?? '1',
    limit: '12',
    category: params.category,
    continent: params.continent,
    country: params.country,
    budget: params.budget,
    q: params.q,
    sort: params.sort,
  })
  const [list, filters] = await Promise.allSettled([
    api<{ items: DestinationListItem[] } | DestinationListItem[]>(
      `/api/v1/destinations${query}`,
      { next: { revalidate: 300 } },
    ),
    apiData<DestinationFilters>('/api/v1/destinations/filters', { next: { revalidate: 300 } }),
  ])

  const envelope = list.status === 'fulfilled' ? list.value : null
  const payload = envelope?.success ? envelope.data : []
  const items = Array.isArray(payload) ? payload : payload.items

  return {
    items: items ?? [],
    meta: envelope?.success ? (envelope.meta as PaginationMeta | undefined) : undefined,
    filters: filters.status === 'fulfilled' ? filters.value : null,
  }
}

export default async function DestinationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { items, meta, filters } = await getDestinations(params)

  return (
    <div className="container-page py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">The atlas</p>
        <h1 className="mt-2 text-balance font-display text-4xl font-semibold sm:text-5xl">
          Destinations
        </h1>
        <p className="mt-4 text-ink-muted">
          Every place we run trips to, with honest notes on season, budget and how long you actually
          need.
        </p>
      </header>

      <FilterBar filters={filters} active={params} />

      {items.length ? (
        <>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((destination, index) => (
              <DestinationCard
                key={destination.id}
                destination={destination}
                priority={index < 3}
              />
            ))}
          </div>
          <Pagination
            className="mt-12"
            basePath="/destinations"
            page={meta?.page ?? Number(params.page ?? '1')}
            totalPages={meta?.totalPages}
            searchParams={{
              category: params.category,
              continent: params.continent,
              country: params.country,
              budget: params.budget,
              q: params.q,
              sort: params.sort,
            }}
          />
        </>
      ) : (
        <EmptyState
          className="mt-16"
          title="No destinations match those filters"
          description="Try removing a filter, or browse everything."
        />
      )}
    </div>
  )
}

function FilterBar({
  filters,
  active,
}: {
  filters: DestinationFilters | null
  active: SearchParams
}) {
  if (!filters) return null

  function href(next: Partial<SearchParams>): string {
    const merged: SearchParams = { ...active, page: '1', ...next }
    return `/destinations${buildQuery(merged as Record<string, string | undefined>)}`
  }

  const categories = filters.categories ?? []
  const continents = filters.continents ?? []
  const countries = filters.countries ?? []

  return (
    <div className="mt-10 space-y-4">
      <form
        method="get"
        action="/destinations"
        className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
      >
        {/* Preserve filters the selects/pills do not own. */}
        {active.category ? <input type="hidden" name="category" value={active.category} /> : null}
        {active.continent ? <input type="hidden" name="continent" value={active.continent} /> : null}

        <div className="flex-1">
          <label htmlFor="destination-q" className="sr-only">
            Search destinations
          </label>
          <input
            id="destination-q"
            type="search"
            name="q"
            defaultValue={active.q ?? ''}
            placeholder="Search by name, country or tag…"
            className="h-11 w-full rounded-xl border border-sand bg-white px-4 text-[15px] text-ink placeholder:text-ink-faint focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:w-72">
          <div>
            <label htmlFor="destination-country" className="sr-only">
              Country
            </label>
            <select
              id="destination-country"
              name="country"
              defaultValue={active.country ?? ''}
              className="h-11 w-full rounded-xl border border-sand bg-white px-3 text-sm text-ink focus:border-teal focus:outline-none"
            >
              <option value="">Any country</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="destination-budget" className="sr-only">
              Budget
            </label>
            <select
              id="destination-budget"
              name="budget"
              defaultValue={active.budget ?? ''}
              className="h-11 w-full rounded-xl border border-sand bg-white px-3 text-sm text-ink focus:border-teal focus:outline-none"
            >
              <option value="">Any budget</option>
              <option value="budget">Budget</option>
              <option value="mid">Mid-range</option>
              <option value="premium">Premium</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-teal px-5 text-sm font-medium text-white transition-colors hover:bg-teal-dark"
        >
          <Search className="h-4 w-4" aria-hidden />
          Apply
        </button>
      </form>

      {categories.length ? (
        <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
          <FilterPill href={href({ category: undefined })} active={!active.category}>
            All
          </FilterPill>
          {categories.map((category) => (
            <FilterPill
              key={category}
              href={href({ category })}
              active={active.category === category}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </FilterPill>
          ))}
        </nav>
      ) : null}

      {continents.length ? (
        <nav aria-label="Filter by continent" className="flex flex-wrap gap-2">
          {continents.map((continent) => (
            <FilterPill
              key={continent}
              href={href({ continent: active.continent === continent ? undefined : continent })}
              active={active.continent === continent}
              subtle
            >
              {continent}
            </FilterPill>
          ))}
        </nav>
      ) : null}
    </div>
  )
}

function FilterPill({
  href,
  active,
  subtle,
  children,
}: {
  href: string
  active?: boolean
  subtle?: boolean
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className={
        subtle
          ? `rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              active
                ? 'border-teal bg-teal/10 text-teal-dark'
                : 'border-sand bg-white text-ink-muted hover:border-ink-faint'
            }`
          : `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-midnight text-warm-white'
                : 'bg-white text-ink-muted hover:bg-parchment'
            }`
      }
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </a>
  )
}
