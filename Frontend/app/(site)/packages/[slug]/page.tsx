import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, Clock, MapPin, Minus, Users } from 'lucide-react'
import { apiData } from '@/lib/api'
import type { PackageDetail } from '@/lib/types'
import { durationLabel, formatPrice, titleCase } from '@/lib/utils'
import { Badge, Card, Rating } from '@/components/ui/card'
import { SaveButton } from '@/components/save-button'
import { EnquiryForm } from '@/components/enquiry-form'
import { PackageMobileCta } from '@/components/package-mobile-cta'

export const revalidate = 300

async function getPackage(slug: string): Promise<PackageDetail | null> {
  try {
    return await apiData<PackageDetail>(`/api/v1/packages/${slug}`, {
      next: { revalidate: 300, tags: [`package:${slug}`] },
    })
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const pkg = await getPackage(slug)
  if (!pkg) return { title: 'Package not found' }
  return {
    title: pkg.title,
    description: pkg.summary,
  }
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const pkg = await getPackage(slug)
  if (!pkg) notFound()

  const destination = pkg.destination
  const discount =
    pkg.originalPriceCents && pkg.originalPriceCents > pkg.priceCents
      ? Math.round((1 - pkg.priceCents / pkg.originalPriceCents) * 100)
      : null

  return (
    <div className="container-page py-12">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-ink-faint">
        <Link href="/packages" className="hover:text-ink">
          Packages
        </Link>
        <span aria-hidden>/</span>
        {destination ? (
          <>
            <Link href={`/destinations/${destination.slug}`} className="hover:text-ink">
              {destination.name}
            </Link>
            <span aria-hidden>/</span>
          </>
        ) : null}
        <span className="text-ink">{pkg.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-parchment">
            {pkg.heroImageUrl ? (
              <Image
                src={pkg.heroImageUrl}
                alt={pkg.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            ) : null}
            <div className="absolute left-5 top-5 flex gap-2">
              <Badge tone="dark">{titleCase(pkg.travelStyle)}</Badge>
              {discount ? <Badge tone="amber">Save {discount}%</Badge> : null}
            </div>
          </div>

          <header className="mt-8">
            <p className="flex items-center gap-1.5 text-sm text-ink-muted">
              <MapPin className="h-4 w-4 text-teal" />
              {destination ? (
                <Link
                  href={`/destinations/${destination.slug}`}
                  className="hover:text-ink hover:underline"
                >
                  {destination.name}, {destination.country}
                </Link>
              ) : (
                <span>{titleCase(pkg.travelStyle)} trip</span>
              )}
            </p>
            <h1 className="mt-2 text-balance font-display text-4xl font-semibold sm:text-5xl">
              {pkg.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">{pkg.summary}</p>

            <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-ink-muted">
              <Rating value={pkg.averageRating} count={pkg.reviewCount} />
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {durationLabel(pkg.durationDays, pkg.durationNights)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Max {pkg.maxGroupSize} travellers
              </span>
              {pkg.seatsLeft != null ? (
                <Badge tone={pkg.seatsLeft <= 4 ? 'amber' : 'neutral'}>
                  {pkg.seatsLeft} seats left
                </Badge>
              ) : null}
            </div>
          </header>

          {pkg.itinerary?.length ? (
            <section className="mt-12">
              <h2 className="font-display text-2xl font-semibold">Day-by-day</h2>
              <ol className="mt-5 space-y-4">
                {pkg.itinerary.map((day) => (
                  <li key={day.day} className="surface p-5">
                    <div className="flex items-baseline gap-3">
                      <span className="eyebrow text-teal">Day {day.day}</span>
                      <h3 className="font-display text-lg font-semibold">{day.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{day.description}</p>
                    {day.activities?.length ? (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {day.activities.map((activity) => (
                          <li
                            key={activity}
                            className="rounded-full bg-parchment px-3 py-1 text-[13px] text-ink-muted"
                          >
                            {activity}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <section className="mt-12 grid gap-8 sm:grid-cols-2">
            {pkg.inclusions?.length ? (
              <div>
                <h2 className="font-display text-xl font-semibold">What is included</h2>
                <ul className="mt-4 space-y-2.5">
                  {pkg.inclusions.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm text-ink">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {pkg.exclusions?.length ? (
              <div>
                <h2 className="font-display text-xl font-semibold">Not included</h2>
                <ul className="mt-4 space-y-2.5">
                  {pkg.exclusions.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm text-ink-muted">
                      <Minus className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {pkg.gallery?.length ? (
            <section className="mt-12">
              <h2 className="font-display text-2xl font-semibold">Gallery</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {pkg.gallery.slice(0, 6).map((image) => (
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

        <aside id="enquire" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                  From, per person
                </p>
                <p className="flex items-baseline gap-2">
                  <span className="font-display text-4xl font-semibold">
                    {formatPrice(pkg.priceCents, pkg.currency)}
                  </span>
                  {pkg.originalPriceCents ? (
                    <span className="text-base text-ink-faint line-through">
                      {formatPrice(pkg.originalPriceCents, pkg.currency)}
                    </span>
                  ) : null}
                </p>
              </div>
              <SaveButton entityType="package" entityId={pkg.id} name={pkg.title} />
            </div>

            {pkg.departureMonths?.length ? (
              <div className="mt-5 border-t border-sand pt-4">
                <p className="eyebrow">Departure months</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pkg.departureMonths.map((month) => (
                    <Badge key={month} tone="neutral">
                      {month.slice(0, 3).toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6">
              <EnquiryForm
                packageTitle={pkg.title}
                packageSlug={pkg.slug}
                destinationName={destination?.name ?? pkg.title}
              />
            </div>
          </Card>
        </aside>
      </div>

      {/* Spacer so the sticky mobile CTA never covers the last row of content. */}
      <div className="h-20 lg:hidden" aria-hidden />
      <PackageMobileCta priceCents={pkg.priceCents} currency={pkg.currency} />
    </div>
  )
}
