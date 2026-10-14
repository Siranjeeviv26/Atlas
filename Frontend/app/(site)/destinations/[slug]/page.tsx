import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { CalendarDays, Globe2, Languages, MapPin, Wallet } from 'lucide-react'
import { apiData } from '@/lib/api'
import type { DestinationDetail } from '@/lib/types'
import { titleCase } from '@/lib/utils'
import { Badge, Card, Rating } from '@/components/ui/card'
import { SaveButton } from '@/components/save-button'
import { PackageCard } from '@/components/trip-cards'
import { EmptyState } from '@/components/empty-state'

export const revalidate = 300

async function getDestination(slug: string): Promise<DestinationDetail | null> {
  try {
    return await apiData<DestinationDetail>(`/api/v1/destinations/${slug}`, {
      next: { revalidate: 300, tags: [`destination:${slug}`] },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return null
    }
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const destination = await getDestination(slug)
  if (!destination) return { title: 'Destination not found' }
  return {
    title: `${destination.name}, ${destination.country}`,
    description: destination.summary,
  }
}

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const destination = await getDestination(slug)
  if (!destination) notFound()

  const facts = [
    {
      icon: Wallet,
      label: 'Currency',
      value: destination.currency?.toUpperCase() ?? '—',
    },
    { icon: Languages, label: 'Language', value: destination.language ?? '—' },
    {
      icon: Globe2,
      label: 'Region',
      value: destination.region ?? destination.continent,
    },
    {
      icon: CalendarDays,
      label: 'Best months',
      value: destination.bestMonths?.length
        ? destination.bestMonths.map((m) => m.slice(0, 3).toUpperCase()).join(', ')
        : 'Year-round',
    },
  ]

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {destination.heroImageUrl ? (
            <Image
              src={destination.heroImageUrl}
              alt={destination.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-midnight" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/50 to-midnight/20" />
        </div>

        <div className="container-page flex min-h-[58vh] flex-col justify-end pb-14 pt-28">
          <div className="max-w-3xl">
            <p className="flex items-center gap-1.5 text-sm font-medium text-white/75">
              <MapPin className="h-4 w-4" />
              {destination.country} · {destination.continent}
            </p>
            <h1 className="mt-3 text-balance font-display text-5xl font-semibold text-white sm:text-6xl">
              {destination.name}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Badge tone="outline" className="border-white/25 bg-white/10 text-white backdrop-blur">
                {titleCase(destination.category)}
              </Badge>
              <Rating
                value={destination.averageRating}
                count={destination.reviewCount}
                className="text-white"
              />
              <SaveButton
                entityType="destination"
                entityId={destination.id}
                name={destination.name}
                className="border-white/25 bg-white/10 text-white backdrop-blur"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="text-lg leading-relaxed text-ink">{destination.description}</p>

          {destination.highlights?.length ? (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold">Highlights</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {destination.highlights.map((highlight) => (
                  <li key={highlight} className="surface flex gap-3 p-4 text-sm text-ink">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {destination.gallery?.length ? (
            <section className="mt-12">
              <h2 className="font-display text-2xl font-semibold">Gallery</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {destination.gallery.slice(0, 6).map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-parchment"
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold">Good to know</h2>
            <dl className="mt-4 space-y-4">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-start gap-3">
                  <fact.icon className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  <div>
                    <dt className="text-[12px] uppercase tracking-[0.12em] text-ink-faint">
                      {fact.label}
                    </dt>
                    <dd className="text-sm font-medium text-ink">{fact.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            {destination.tags?.length ? (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-sand pt-5">
                {destination.tags.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </Card>
        </aside>
      </div>

      <section className="container-page pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold">
            Packages in {destination.name}
          </h2>
          <p className="text-sm text-ink-muted">
            {destination.packages?.length ?? 0} available
          </p>
        </div>

        {destination.packages?.length ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destination.packages.map((pkg, index) => (
              <PackageCard key={pkg.id} package={pkg} priority={index < 3} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-8"
            title="No packages here yet"
            description="Browse all packages, or send us an enquiry and we will build one."
            action={{ href: '/packages', label: 'Browse packages' }}
          />
        )}
      </section>
    </>
  )
}
