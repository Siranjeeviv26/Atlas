import { imageUrl } from '../../services/cloudinary.js'

type PackageListItem = Awaited<ReturnType<typeof import('./repository.js').listPackages>>['items'][number]

export function serializePackageListItem(item: PackageListItem) {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    priceCents: item.priceCents,
    originalPriceCents: item.originalPriceCents,
    currency: item.currency,
    durationDays: item.durationDays,
    durationNights: item.durationNights,
    travelStyle: item.travelStyle,
    maxGroupSize: item.maxGroupSize,
    heroImageUrl: imageUrl(item.heroImageUrl, 'card'),
    averageRating: Number(item.averageRating ?? 0),
    reviewCount: item.reviewCount ?? 0,
    seatsLeft: item.seatsLeft,
    isFeatured: item.isFeatured,
    departureMonths: item.departureMonths ?? [],
    destination: {
      name: item.destinationName,
      slug: item.destinationSlug,
      country: item.destinationCountry,
      continent: item.destinationContinent,
    },
  }
}

export function serializePackageDetail(detail: Awaited<ReturnType<typeof import('./repository.js').getPackageBySlug>>) {
  if (!detail) return null

  const gallery = (detail.images ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => ({
      id: image.id,
      url: imageUrl(image.url, 'gallery'),
      alt: image.alt,
      isHero: image.isHero,
    }))

  const hero = gallery.find((image) => image.isHero) ?? gallery[0] ?? null

  return {
    id: detail.id,
    slug: detail.slug,
    title: detail.title,
    summary: detail.summary,
    description: detail.description,
    priceCents: detail.priceCents,
    originalPriceCents: detail.originalPriceCents,
    currency: detail.currency,
    durationDays: detail.durationDays,
    durationNights: detail.durationNights,
    travelStyle: detail.travelStyle,
    maxGroupSize: detail.maxGroupSize,
    minAge: detail.minAge,
    inclusions: detail.inclusions ?? [],
    exclusions: detail.exclusions ?? [],
    itinerary: detail.itinerary ?? [],
    heroImageUrl: imageUrl(detail.heroImageUrl ?? hero?.url ?? null, 'hero'),
    averageRating: Number(detail.averageRating ?? 0),
    reviewCount: detail.reviewCount ?? 0,
    seatsLeft: detail.seatsLeft,
    departureMonths: detail.departureMonths ?? [],
    isFeatured: detail.isFeatured,
    gallery,
    destination: {
      id: detail.destinationId,
      name: detail.destinationName,
      slug: detail.destinationSlug,
      country: detail.destinationCountry,
      continent: detail.destinationContinent,
    },
  }
}
