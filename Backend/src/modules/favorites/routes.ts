import type { ServerRoute } from '@hapi/hapi'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { favorites, destinations, travelPackages } from '../../db/schema/index.js'
import { listFavoritesQuery, favoriteParams, favoritePayload } from '../../validation/schemas.js'
import { buildPaginationMeta, ok, paginated } from '../../utils/api-response.js'
import { notFound } from '../../utils/errors.js'
import { normalisePagination } from '../../utils/pagination.js'
import { requireUser } from '../../plugins/request-context.js'
import { serializeDestinationListItem } from '../destinations/mappers.js'
import { serializePackageListItem } from '../packages/mappers.js'

export const favoriteRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/v1/favorites',
    options: {
      description: 'Saved destinations and packages for the signed-in user',
      tags: ['api', 'favorites'],
      validate: { query: listFavoritesQuery },
    },
    handler: async (request) => {
      const requestUser = await requireUser(request)
      const query = request.query as { page?: number; limit?: number; entityType?: string }
      const { page, limit, offset } = normalisePagination(query.page, query.limit)
      const entityType = query.entityType && query.entityType !== 'all' ? query.entityType : null

      const where = entityType
        ? and(eq(favorites.userId, requestUser.id), eq(favorites.entityType, entityType))
        : eq(favorites.userId, requestUser.id)

      const [rows, totalRows] = await Promise.all([
        db
          .select()
          .from(favorites)
          .where(where)
          .orderBy(desc(favorites.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)::int` }).from(favorites).where(where),
      ])

      const destinationIds = rows
        .filter((row) => row.entityType === 'destination')
        .map((row) => row.entityId)
      const packageIds = rows
        .filter((row) => row.entityType === 'package')
        .map((row) => row.entityId)

      const [destinationRows, packageRows] = await Promise.all([
        destinationIds.length
          ? db
              .select({
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
              })
              .from(destinations)
              .where(inArray(destinations.id, destinationIds))
          : Promise.resolve([]),
        packageIds.length
          ? db
              .select({
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
              })
              .from(travelPackages)
              .innerJoin(destinations, eq(travelPackages.destinationId, destinations.id))
              .where(inArray(travelPackages.id, packageIds))
          : Promise.resolve([]),
      ])

      const destinationMap = new Map(
        destinationRows.map((row) => [row.id, serializeDestinationListItem(row)]),
      )
      const packageMap = new Map(packageRows.map((row) => [row.id, serializePackageListItem(row)]))

      const items = rows.flatMap((row): Array<{
        id: string
        entityType: 'destination' | 'package'
        entityId: string
        createdAt: string
        destination: unknown | null
        package: unknown | null
      }> => {
        const createdAt = row.createdAt.toISOString()
        if (row.entityType === 'destination') {
          const entity = destinationMap.get(row.entityId)
          return entity
            ? [{
                id: row.id,
                entityType: 'destination' as const,
                entityId: row.entityId,
                createdAt,
                destination: entity,
                package: null,
              }]
            : []
        }
        if (row.entityType === 'package') {
          const entity = packageMap.get(row.entityId)
          return entity
            ? [{
                id: row.id,
                entityType: 'package' as const,
                entityId: row.entityId,
                createdAt,
                destination: null,
                package: entity,
              }]
            : []
        }
        return []
      })

      const counts = await db
        .select({ entityType: favorites.entityType, count: sql<number>`count(*)::int` })
        .from(favorites)
        .where(eq(favorites.userId, requestUser.id))
        .groupBy(favorites.entityType)

      return paginated(items, buildPaginationMeta(page, limit, totalRows[0]?.count ?? 0), {
        counts: Object.fromEntries(counts.map((row) => [row.entityType, row.count])),
      })
    },
  },
  {
    method: 'POST',
    path: '/api/v1/favorites',
    options: {
      description: 'Save a destination or package',
      tags: ['api', 'favorites'],
      validate: { payload: favoritePayload },
    },
    handler: async (request) => {
      const requestUser = await requireUser(request)
      const { entityType, entityId } = request.payload as {
        entityType: 'destination' | 'package'
        entityId: string
      }

      await assertEntityExists(entityType, entityId)

      const existing = await db
        .select({ id: favorites.id })
        .from(favorites)
        .where(
          and(
            eq(favorites.userId, requestUser.id),
            eq(favorites.entityType, entityType),
            eq(favorites.entityId, entityId),
          ),
        )
        .limit(1)

      if (existing.length) {
        await db.delete(favorites).where(eq(favorites.id, existing[0].id))
        return ok({ favorited: false })
      }

      await db.insert(favorites).values({
        userId: requestUser.id,
        entityType,
        entityId,
      })

      return ok({ favorited: true })
    },
  },
  {
    method: 'DELETE',
    path: '/api/v1/favorites/{entityType}/{entityId}',
    options: {
      description: 'Remove a saved destination or package',
      tags: ['api', 'favorites'],
      validate: { params: favoriteParams },
    },
    handler: async (request) => {
      const requestUser = await requireUser(request)
      const { entityType, entityId } = request.params as {
        entityType: 'destination' | 'package'
        entityId: string
      }

      await db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, requestUser.id),
            eq(favorites.entityType, entityType),
            eq(favorites.entityId, entityId),
          ),
        )

      return ok({ removed: true })
    },
  },
  {
    method: 'GET',
    path: '/api/v1/favorites/check',
    options: {
      description: 'Check whether the current user has saved specific entities',
      tags: ['api', 'favorites'],
      validate: {
        query: favoritePayload.keys({ entityType: ['destination', 'package'] }).unknown(true),
      },
    },
    handler: async (request) => {
      const requestUser = await requireUser(request)
      const { entityType, entityId } = request.query as {
        entityType: 'destination' | 'package'
        entityId: string
      }

      const rows = await db
        .select({ id: favorites.id })
        .from(favorites)
        .where(
          and(
            eq(favorites.userId, requestUser.id),
            eq(favorites.entityType, entityType),
            eq(favorites.entityId, entityId),
          ),
        )
        .limit(1)

      return ok({ favorited: rows.length > 0 })
    },
  },
]

async function assertEntityExists(
  entityType: 'destination' | 'package',
  entityId: string,
): Promise<void> {
  const table = entityType === 'destination' ? destinations : travelPackages
  const rows = await db
    .select({ id: table.id })
    .from(table)
    .where(eq(table.id, entityId))
    .limit(1)

  if (!rows.length) {
    throw notFound(`No ${entityType} found for that id.`)
  }
}
