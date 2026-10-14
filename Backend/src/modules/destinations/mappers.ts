import type { DestinationListItem } from './repository.js'
import { imageUrl } from '../../services/cloudinary.js'

export interface SerializedDestination {
  id: string
  slug: string
  name: string
  country: string
  continent: string
  region: string | null
  summary: string
  category: string
  budgetLevel: string
  tags: string[]
  heroImageUrl: string | null
  averageRating: number
  reviewCount: number
  isFeatured: boolean
  packageCount?: number
}

export function serializeDestinationListItem(
  item: DestinationListItem,
): SerializedDestination {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    country: item.country,
    continent: item.continent,
    region: item.region,
    summary: item.summary,
    category: item.category,
    budgetLevel: item.budgetLevel,
    tags: item.tags ?? [],
    heroImageUrl: imageUrl(item.heroImageUrl, 'card'),
    averageRating: Number(item.averageRating ?? 0),
    reviewCount: item.reviewCount ?? 0,
    isFeatured: item.isFeatured,
    ...(item.packageCount !== undefined ? { packageCount: item.packageCount } : {}),
  }
}

export function serializeDestinationDetail(detail: Awaited<ReturnType<typeof import('./repository.js').getDestinationBySlug>>) {
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
    name: detail.name,
    country: detail.country,
    continent: detail.continent,
    region: detail.region,
    summary: detail.summary,
    description: detail.description,
    category: detail.category,
    budgetLevel: detail.budgetLevel,
    tags: detail.tags ?? [],
    highlights: detail.highlights ?? [],
    bestMonths: detail.bestMonths ?? [],
    latitude: detail.latitude,
    longitude: detail.longitude,
    currency: detail.currency,
    language: detail.language,
    heroImageUrl: imageUrl(detail.heroImageUrl ?? hero?.url ?? null, 'hero'),
    averageRating: Number(detail.averageRating ?? 0),
    reviewCount: detail.reviewCount ?? 0,
    isFeatured: detail.isFeatured,
    gallery,
    packages: (detail.packages ?? []).map((pkg) => ({
      id: pkg.id,
      slug: pkg.slug,
      title: pkg.title,
      summary: pkg.summary,
      priceCents: pkg.priceCents,
      originalPriceCents: pkg.originalPriceCents,
      durationDays: pkg.durationDays,
      durationNights: pkg.durationNights,
      travelStyle: pkg.travelStyle,
      heroImageUrl: imageUrl(pkg.heroImageUrl, 'card'),
      averageRating: Number(pkg.averageRating ?? 0),
      reviewCount: pkg.reviewCount ?? 0,
      seatsLeft: pkg.seatsLeft,
      isFeatured: pkg.isFeatured,
    })),
  }
}
