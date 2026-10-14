import type { Metadata } from 'next'
import { Search } from 'lucide-react'
import { api, apiData, buildQuery } from '@/lib/api'
import type {
  DestinationListItem,
  PackageFacets,
  PackageListItem,
  PaginationMeta,
} from '@/lib/types'
import { PackageCard } from '@/components/trip-cards'
import { Pagination } from '@/components/pagination'
import { EmptyState } from '@/components/empty-state'
import { PackageFilters } from '@/components/package-filters'

export const metadata: Metadata = {
  title: 'Packages',
  description: 'Small-group journeys and independent itineraries, priced clearly.',
}

export const revalidate = 300

interface SearchParams {
  page?: string
  q?: string
  destination?: string
  style?: string
  minPrice?: string
  maxPrice?: string
  maxDuration?: string
  sort?: string
}

async function getPackages(params: SearchParams) {
  const query = buildQuery({
    page: params.page ?? '1',
    limit: '12',
    q: params.q,
    destination: params.destination,
    style: params.style,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    maxDuration: params.maxDuration,
    sort: params.sort,
  })

  const [list, facets, destinations] = await Promise.allSettled([
    api<PackageListItem[] | { items: PackageListItem[]; facets?: PackageFacets }>(
      `/api/v1/packages${query}`,
      { next: { revalidate: 300 } },
    ),
    apiData<PackageFacets>('/api/v1/packages/facets', { next: { revalidate: 300 } }),
    apiData<DestinationListItem[] | { items: DestinationListItem[] }>(
      '/api/v1/destinations?limit=100&sort=name',
      { next: { revalidate: 300 } },
    ),
  ])

  const envelope = list.status === 'fulfilled' ? list.value : null
  const payload = envelope?.success ? envelope.data : []
  const items = Array.isArray(payload) ? payload : payload.items

  const destinationPayload =
    destinations.status === 'fulfilled' ? destinations.value : []
  const destinationItems = Array.isArray(destinationPayload)
    ? destinationPayload
    : destinationPayload.items

  return {
    items: items ?? [],
    meta: envelope?.success ? (envelope.meta as PaginationMeta | undefined) : undefined,
    facets: facets.status === 'fulfilled' ? facets.value : null,
    destinations: destinationItems ?? [],
  }
}

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { items, meta, facets, destinations } = await getPackages(params)
  const styles = (facets?.styles ?? []).map((entry) => entry.style)

  return (
    <div className="container-page py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">Ready when you are</p>
        <h1 className="mt-2 text-balance font-display text-4xl font-semibold sm:text-5xl">
          Packages
        </h1>
        <p className="mt-4 text-ink-muted">
          Fixed departures and private departures, with inclusions spelled out — no surprise
          “optional extras” at checkout.
        </p>
      </header>

      <form
        method="get"
        action="/packages"
        className="surface mt-10 flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
      >
        <div className="flex-1">
          <label htmlFor="package-q" className="sr-only">
            Search packages
          </label>
          <input
            id="package-q"
            type="search"
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Search packages…"
            className="h-11 w-full rounded-xl border border-sand bg-white px-4 text-[15px] text-ink placeholder:text-ink-faint focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
          />
        </div>

        <div className="sm:w-64">
          <label htmlFor="package-destination" className="sr-only">
            Destination
          </label>
          <select
            id="package-destination"
            name="destination"
            defaultValue={params.destination ?? ''}
            className="h-11 w-full rounded-xl border border-sand bg-white px-3 text-sm text-ink focus:border-teal focus:outline-none"
          >
            <option value="">Any destination</option>
            {destinations.map((destination) => (
              <option key={destination.id} value={destination.slug}>
                {destination.name}, {destination.country}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-teal px-5 text-sm font-medium text-white transition-colors hover:bg-teal-dark"
        >
          <Search className="h-4 w-4" aria-hidden />
          Apply
        </button>
      </form>

      <PackageFilters styles={styles} active={params} />

      {items.length ? (
        <>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((pkg, index) => (
              <PackageCard key={pkg.id} package={pkg} priority={index < 3} />
            ))}
          </div>
          <Pagination
            className="mt-12"
            basePath="/packages"
            page={meta?.page ?? Number(params.page ?? '1')}
            totalPages={meta?.totalPages}
            searchParams={{
              q: params.q,
              destination: params.destination,
              style: params.style,
              minPrice: params.minPrice,
              maxPrice: params.maxPrice,
              maxDuration: params.maxDuration,
              sort: params.sort,
            }}
          />
        </>
      ) : (
        <EmptyState
          className="mt-16"
          title="No packages match those filters"
          description="Try a different style, destination or price range."
          action={{ href: '/packages', label: 'Clear filters' }}
        />
      )}
    </div>
  )
}
