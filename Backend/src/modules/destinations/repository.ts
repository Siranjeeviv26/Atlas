import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { destinationImages, destinations, travelPackages } from '../../db/schema/index.js'
import type { DESTINATION_SORTS } from '../../validation/schemas.js'

export type DestinationSort = (typeof DESTINATION_SORTS)[number]

export interface DestinationListFilters {
  q?: string
  country?: string
  continent?: string
  region?: string
  category?: string
  budget?: string
  tag?: string
  featured?: boolean
}

const sortMap: Record<DestinationSort, SQL | SQL[]> = {
  featured: [desc(destinations.isFeatured), desc(destinations.averageRating), asc(destinations.name)],
  rating_desc: [desc(destinations.averageRating), desc(destinations.reviewCount)],
  price_asc: [asc(destinations.averageRating), asc(destinations.name)],
  name_asc: [asc(destinations.name)],
  newest: [desc(destinations.createdAt)],
}

function buildWhere(filters: DestinationListFilters): SQL | undefined {
  const clauses: SQL[] = [eq(destinations.isPublished, true)]

  if (filters.q) {
    const needle = `%${filters.q}%`
    clauses.push(
      or(
        ilike(destinations.name, needle),
        ilike(destinations.country, needle),
        ilike(destinations.summary, needle),
        ilike(destinations.description, needle),
        sql`exists (select 1 from jsonb_array_elements_text(${destinations.tags}) t where t ilike ${needle})`,
      ) as SQL,
    )
  }

  if (filters.country) clauses.push(ilike(destinations.country, filters.country))
  if (filters.continent) clauses.push(ilike(destinations.continent, filters.continent))
  if (filters.region) clauses.push(ilike(destinations.region, filters.region))
  if (filters.category) clauses.push(ilike(destinations.category, filters.category))
  if (filters.budget) clauses.push(eq(destinations.budgetLevel, filters.budget))
  if (filters.tag) {
    clauses.push(
      sql`exists (select 1 from jsonb_array_elements_text(${destinations.tags}) t where lower(t) = lower(${filters.tag}))`,
    )
  }
  if (filters.featured !== undefined) clauses.push(eq(destinations.isFeatured, filters.featured))

  return and(...clauses)
}

export interface DestinationListItem {
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

const listSelection = {
  id: destinations.id,
  slug: destinations.slug,
  name: destinations.name,
  country: destinations.country,
  continent: destinations.continent,
  region: destinations.region,
  summary: destinations.summary,
  category: destinations.category,
  budgetLevel: destinations.budgetLevel,
  tags: destinations.tags,
  heroImageUrl: destinations.heroImageUrl,
  averageRating: destinations.averageRating,
  reviewCount: destinations.reviewCount,
  isFeatured: destinations.isFeatured,
}

export async function listDestinations(
  filters: DestinationListFilters,
  sort: DestinationSort,
  limit: number,
  offset: number,
): Promise<{ items: DestinationListItem[]; total: number }> {
  const where = buildWhere(filters)
  const order = sortMap[sort] ?? sortMap.featured

  const [items, totalRows] = await Promise.all([
    db
      .select({
        ...listSelection,
        packageCount: sql<number>`(
          select count(*)::int from ${travelPackages} p
          where p.destination_id = ${destinations}."id" and p.is_published = true
        )`,
      })
      .from(destinations)
      .where(where)
      .orderBy(...(Array.isArray(order) ? order : [order]))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(destinations).where(where),
  ])

  return { items, total: totalRows[0]?.count ?? 0 }
}

export async function getDestinationBySlug(slug: string) {
  const rows = await db
    .select()
    .from(destinations)
    .where(and(eq(destinations.slug, slug), eq(destinations.isPublished, true)))
    .limit(1)

  const destination = rows[0]
  if (!destination) return null

  const [images, packages] = await Promise.all([
    db
      .select()
      .from(destinationImages)
      .where(eq(destinationImages.destinationId, destination.id))
      .orderBy(asc(destinationImages.sortOrder)),
    db
      .select({
        id: travelPackages.id,
        slug: travelPackages.slug,
        title: travelPackages.title,
        summary: travelPackages.summary,
        priceCents: travelPackages.priceCents,
        originalPriceCents: travelPackages.originalPriceCents,
        durationDays: travelPackages.durationDays,
        durationNights: travelPackages.durationNights,
        travelStyle: travelPackages.travelStyle,
        heroImageUrl: travelPackages.heroImageUrl,
        averageRating: travelPackages.averageRating,
        reviewCount: travelPackages.reviewCount,
        seatsLeft: travelPackages.seatsLeft,
        isFeatured: travelPackages.isFeatured,
      })
      .from(travelPackages)
      .where(and(eq(travelPackages.destinationId, destination.id), eq(travelPackages.isPublished, true)))
      .orderBy(desc(travelPackages.isFeatured), desc(travelPackages.averageRating))
      .limit(8),
  ])

  return { ...destination, images, packages }
}

export async function getRelatedDestinations(
  destinationId: string,
  category: string,
  tags: string[],
  limit = 4,
): Promise<DestinationListItem[]> {
  const tagList = tags.slice(0, 4)
  const tagMatch = tagList.length
    ? sql`exists (
        select 1 from jsonb_array_elements_text(${destinations.tags}) t
        where lower(t) in (${sql.join(tagList.map((tag) => sql`lower(${tag})`), sql`, `)})
      )`
    : undefined

  const where = and(
    eq(destinations.isPublished, true),
    sql`${destinations.id} <> ${destinationId}`,
    or(eq(destinations.category, category), tagMatch) as SQL | undefined,
  )

  return db
    .select(listSelection)
    .from(destinations)
    .where(where)
    .orderBy(desc(destinations.averageRating))
    .limit(limit)
}

export async function getDestinationOptions(): Promise<{
  countries: string[]
  continents: string[]
  categories: string[]
  tags: string[]
}> {
  const rows = await db
    .select({
      country: destinations.country,
      continent: destinations.continent,
      category: destinations.category,
      tags: destinations.tags,
    })
    .from(destinations)
    .where(eq(destinations.isPublished, true))

  const countries = new Set<string>()
  const continents = new Set<string>()
  const categories = new Set<string>()
  const tags = new Set<string>()

  for (const row of rows) {
    countries.add(row.country)
    continents.add(row.continent)
    categories.add(row.category)
    for (const tag of row.tags ?? []) tags.add(tag)
  }

  const byAlpha = (a: string, b: string) => a.localeCompare(b)
  return {
    countries: [...countries].sort(byAlpha),
    continents: [...continents].sort(byAlpha),
    categories: [...categories].sort(byAlpha),
    tags: [...tags].sort(byAlpha),
  }
}

export async function findDestinationIdBySlug(slug: string): Promise<string | null> {
  const rows = await db
    .select({ id: destinations.id })
    .from(destinations)
    .where(eq(destinations.slug, slug))
    .limit(1)
  return rows[0]?.id ?? null
}

export async function getDestinationIdsBySlugs(slugs: string[]): Promise<Map<string, string>> {
  if (!slugs.length) return new Map()
  const rows = await db
    .select({ id: destinations.id, slug: destinations.slug })
    .from(destinations)
    .where(inArray(destinations.slug, slugs))
  return new Map(rows.map((row) => [row.slug, row.id]))
}
