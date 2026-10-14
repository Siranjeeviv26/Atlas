import Image from 'next/image'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import type { DestinationListItem, PackageListItem } from '@/lib/types'
import { cn, durationLabel, formatPrice, titleCase } from '@/lib/utils'
import { Badge, Card, Rating } from '@/components/ui/card'
import { SaveButton } from '@/components/save-button'

export function DestinationCard({
  destination,
  priority = false,
  className,
}: {
  destination: DestinationListItem
  priority?: boolean
  className?: string
}) {
  return (
    <Card className={cn('group relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]', className)}>
      <Link href={`/destinations/${destination.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-parchment">
          {destination.heroImageUrl ? (
            <Image
              src={destination.heroImageUrl}
              alt={destination.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 via-midnight/10 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <Badge tone="outline" className="bg-white/85">
              {titleCase(destination.category)}
            </Badge>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-white/85">
                <MapPin className="h-3.5 w-3.5" />
                {destination.country}
              </p>
              <h3 className="font-display text-2xl font-semibold text-white">{destination.name}</h3>
            </div>
            <Rating
              value={destination.averageRating}
              count={destination.reviewCount}
              className="rounded-full bg-white/90 px-2.5 py-1 backdrop-blur"
            />
          </div>
        </div>
      </Link>

      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">
            {destination.summary}
          </p>
          {destination.packageCount !== undefined ? (
            <p className="mt-2 text-[13px] font-medium text-ink-faint">
              {destination.packageCount}{' '}
              {destination.packageCount === 1 ? 'package' : 'packages'} available
            </p>
          ) : null}
        </div>
        <SaveButton entityType="destination" entityId={destination.id} name={destination.name} />
      </div>
    </Card>
  )
}

export function PackageCard({
  package: pkg,
  priority = false,
  className,
}: {
  package: PackageListItem
  priority?: boolean
  className?: string
}) {
  const discount =
    pkg.originalPriceCents && pkg.originalPriceCents > pkg.priceCents
      ? Math.round((1 - pkg.priceCents / pkg.originalPriceCents) * 100)
      : null

  return (
    <Card className={cn('group relative flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]', className)}>
      <Link href={`/packages/${pkg.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[16/11] overflow-hidden bg-parchment">
          {pkg.heroImageUrl ? (
            <Image
              src={pkg.heroImageUrl}
              alt={pkg.title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
            />
          ) : null}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <Badge tone="dark">{titleCase(pkg.travelStyle)}</Badge>
            {discount ? <Badge tone="amber">−{discount}%</Badge> : null}
          </div>
          {pkg.seatsLeft != null && pkg.seatsLeft <= 4 ? (
            <div className="absolute right-4 top-4">
              <Badge tone="amber">{pkg.seatsLeft} seats left</Badge>
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-5">
          {pkg.destination ? (
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink-faint">
              <MapPin className="h-3.5 w-3.5" />
              {pkg.destination.name}, {pkg.destination.country}
            </p>
          ) : (
            <p className="text-[12px] font-medium text-ink-faint">
              {titleCase(pkg.travelStyle)}
            </p>
          )}
          <h3 className="mt-1.5 font-display text-lg leading-snug text-ink">{pkg.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">{pkg.summary}</p>

          <div className="mt-3 flex items-center gap-3 text-[13px] text-ink-muted">
            <Rating value={pkg.averageRating} count={pkg.reviewCount} />
            <span aria-hidden>·</span>
            <span>{durationLabel(pkg.durationDays, pkg.durationNights)}</span>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">From</p>
              <p className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-semibold text-ink">
                  {formatPrice(pkg.priceCents, pkg.currency)}
                </span>
                {pkg.originalPriceCents ? (
                  <span className="text-sm text-ink-faint line-through">
                    {formatPrice(pkg.originalPriceCents, pkg.currency)}
                  </span>
                ) : null}
              </p>
            </div>
            <SaveButton entityType="package" entityId={pkg.id} name={pkg.title} />
          </div>
        </div>
      </Link>
    </Card>
  )
}
