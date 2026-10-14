import { and, asc, desc, eq, gte, ilike, lte, or, sql, type SQL } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { destinations, packageImages, travelPackages } from '../../db/schema/index.js'
import type { PACKAGE_SORTS } from '../../validation/schemas.js'

export type PackageSort = (typeof PACKAGE_SORTS)[number]

export interface PackageListFilters {
  q?: string
  destinationSlug?: string
  style?: string
  minPrice?: number
  maxPrice?: number
  minDuration?: number
  maxDuration?: number
  featured?: boolean
}

const sortMap: Record<PackageSort, SQL | SQL[]> = {
  featured: [desc(travelPackages.isFeatured), desc(travelPackages.averageRating), asc(travelPackages.title)],
  price_asc: [asc(travelPackages.priceCents)],
  price_desc: [desc(travelPackages.priceCents)],
  duration_asc: [asc(travelPackages.durationDays)],
  rating_desc: [desc(travelPackages.averageRating), desc(travelPackages.reviewCount)],
  newest: [desc(travelPackages.createdAt)],
}

function buildWhere(filters: PackageListFilters): SQL | undefined {
  const clauses: SQL[] = [eq(travelPackages.isPublished, true)]

  if (filters.q) {
    const needle = `%${filters.q}%`
    clauses.push(
      or(
        ilike(travelPackages.title, needle),
        ilike(travelPackages.summary, needle),
        ilike(travelPackages.description, needle),
        ilike(destinations.name, needle),
        ilike(destinations.country, needle),
      ) as SQL,
    )
  }

  if (filters.destinationSlug) {
    clauses.push(eq(destinations.slug, filters.destinationSlug))
  }
  if (filters.style) clauses.push(ilike(travelPackages.travelStyle, filters.style))
  if (filters.minPrice !== undefined) clauses.push(gte(travelPackages.priceCents, filters.minPrice))
  if (filters.maxPrice !== undefined) clauses.push(lte(travelPackages.priceCents, filters.maxPrice))
  if (filters.minDuration !== undefined)
    clauses.push(gte(travelPackages.durationDays, filters.minDuration))
  if (filters.maxDuration !== undefined)
    clauses.push(lte(travelPackages.durationDays, filters.maxDuration))
  if (filters.featured !== undefined) clauses.push(eq(travelPackages.isFeatured, filters.featured))

  return and(...clauses)
}

const listSelection = {
  id: travelPackages.id,
  slug: travelPackages.slug,
  title: travelPackages.title,
  summary: travelPackages.summary,
  priceCents: travelPackages.priceCents,
  originalPriceCents: travelPackages.originalPriceCents,
  currency: travelPackages.currency,
  durationDays: travelPackages.durationDays,
  durationNights: travelPackages.durationNights,
  travelStyle: travelPackages.travelStyle,
  maxGroupSize: travelPackages.maxGroupSize,
  heroImageUrl: travelPackages.heroImageUrl,
  averageRating: travelPackages.averageRating,
  reviewCount: travelPackages.reviewCount,
  seatsLeft: travelPackages.seatsLeft,
  isFeatured: travelPackages.isFeatured,
  departureMonths: travelPackages.departureMonths,
  destinationName: destinations.name,
  destinationSlug: destinations.slug,
  destinationCountry: destinations.country,
  destinationContinent: destinations.continent,
}

export async function listPackages(
  filters: PackageListFilters,
  sort: PackageSort,
  limit: number,
  offset: number,
) {
  const where = buildWhere(filters)
  const order = sortMap[sort] ?? sortMap.featured

  const [items, totalRows, styleRows] = await Promise.all([
    db
      .select(listSelection)
      .from(travelPackages)
      .innerJoin(destinations, eq(travelPackages.destinationId, destinations.id))
      .where(where)
      .orderBy(...(Array.isArray(order) ? order : [order]))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(travelPackages)
      .innerJoin(destinations, eq(travelPackages.destinationId, destinations.id))
      .where(where),
    db
      .select({ style: travelPackages.travelStyle, count: sql<number>`count(*)::int` })
      .from(travelPackages)
      .innerJoin(destinations, eq(travelPackages.destinationId, destinations.id))
      .where(eq(travelPackages.isPublished, true))
      .groupBy(travelPackages.travelStyle),
  ])

  return {
    items,
    total: totalRows[0]?.count ?? 0,
    styles: styleRows
      .map((row) => ({ style: row.style, count: row.count }))
      .sort((a, b) => b.count - a.count || a.style.localeCompare(b.style)),
  }
}

export async function getPackageBySlug(slug: string) {
  const rows = await db
    .select(listSelection)
    .from(travelPackages)
    .innerJoin(destinations, eq(travelPackages.destinationId, destinations.id))
    .where(and(eq(travelPackages.slug, slug), eq(travelPackages.isPublished, true)))
    .limit(1)

  const pkg = rows[0]
  if (!pkg) return null

  const detailRows = await db
    .select()
    .from(travelPackages)
    .where(eq(travelPackages.id, pkg.id))
    .limit(1)

  const detail = detailRows[0]
  if (!detail) return null

  const images = await db
    .select()
    .from(packageImages)
    .where(eq(packageImages.packageId, detail.id))
    .orderBy(asc(packageImages.sortOrder))

  return { ...pkg, ...detail, images }
}

export async function getRelatedPackages(
  packageId: string,
  destinationId: string,
  travelStyle: string,
  limit = 4,
) {
  return db
    .select(listSelection)
    .from(travelPackages)
    .innerJoin(destinations, eq(travelPackages.destinationId, destinations.id))
    .where(
      and(
        eq(travelPackages.isPublished, true),
        sql`${travelPackages.id} <> ${packageId}`,
        or(eq(travelPackages.destinationId, destinationId), eq(travelPackages.travelStyle, travelStyle)) as SQL,
      ),
    )
    .orderBy(desc(travelPackages.isFeatured), desc(travelPackages.averageRating))
    .limit(limit)
}

export async function getPackageFilterFacets() {
  const [styles, priceRows] = await Promise.all([
    db
      .select({ style: travelPackages.travelStyle, count: sql<number>`count(*)::int` })
      .from(travelPackages)
      .where(eq(travelPackages.isPublished, true))
      .groupBy(travelPackages.travelStyle),
    db
      .select({
        min: sql<number>`coalesce(min(${travelPackages.priceCents}), 0)::int`,
        max: sql<number>`coalesce(max(${travelPackages.priceCents}), 0)::int`,
        maxDuration: sql<number>`coalesce(max(${travelPackages.durationDays}), 0)::int`,
      })
      .from(travelPackages)
      .where(eq(travelPackages.isPublished, true)),
  ])

  return {
    styles: styles
      .map((row) => ({ style: row.style, count: row.count }))
      .sort((a, b) => b.count - a.count || a.style.localeCompare(b.style)),
    priceRange: {
      minCents: priceRows[0]?.min ?? 0,
      maxCents: priceRows[0]?.max ?? 0,
    },
    maxDuration: priceRows[0]?.maxDuration ?? 0,
  }
}

export async function findPackageIdBySlug(slug: string): Promise<string | null> {
  const rows = await db
    .select({ id: travelPackages.id })
    .from(travelPackages)
    .where(eq(travelPackages.slug, slug))
    .limit(1)
  return rows[0]?.id ?? null
}
