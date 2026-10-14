import type { ServerRoute } from '@hapi/hapi'
import Joi from '@hapi/joi'
import {
  destinationParams,
  listDestinationsQuery,
  DESTINATION_SORTS,
} from '../../validation/schemas.js'
import { normalisePagination } from '../../utils/pagination.js'
import { buildPaginationMeta, ok, paginated } from '../../utils/api-response.js'
import { notFound } from '../../utils/errors.js'
import {
  getDestinationBySlug,
  getDestinationOptions,
  getRelatedDestinations,
  listDestinations,
  type DestinationSort,
} from './repository.js'
import {
  serializeDestinationDetail,
  serializeDestinationListItem,
} from './mappers.js'

export const destinationRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/v1/destinations',
    options: {
      description: 'List published destinations with filtering, sorting and pagination',
      tags: ['api', 'destinations'],
      validate: { query: listDestinationsQuery },
      cache: { expiresIn: 60_000, privacy: 'public' },
    },
    handler: async (request) => {
      const query = request.query as Record<string, unknown>
      const { page, limit, offset } = normalisePagination(query.page, query.limit)

      const { items, total } = await listDestinations(
        {
          q: (query.q as string) || undefined,
          country: (query.country as string) || undefined,
          continent: (query.continent as string) || undefined,
          region: (query.region as string) || undefined,
          category: (query.category as string) || undefined,
          budget: (query.budget as string) || undefined,
          tag: (query.tag as string) || undefined,
          featured: query.featured === undefined ? undefined : Boolean(query.featured),
        },
        (query.sort as DestinationSort) ?? 'featured',
        limit,
        offset,
      )

      return paginated(
        items.map(serializeDestinationListItem),
        buildPaginationMeta(page, limit, total),
      )
    },
  },
  {
    method: 'GET',
    path: '/api/v1/destinations/filters',
    options: {
      description: 'Facet values available for destination filtering',
      tags: ['api', 'destinations'],
      cache: { expiresIn: 300_000, privacy: 'public' },
    },
    handler: async () => ok(await getDestinationOptions()),
  },
  {
    method: 'GET',
    path: '/api/v1/destinations/{slug}',
    options: {
      description: 'Full destination detail including gallery and related packages',
      tags: ['api', 'destinations'],
      validate: { params: destinationParams },
      cache: { expiresIn: 60_000, privacy: 'public' },
    },
    handler: async (request) => {
      const { slug } = request.params as { slug: string }
      const detail = await getDestinationBySlug(slug)
      if (!detail) throw notFound(`No destination found for "${slug}".`)

      const serialized = serializeDestinationDetail(detail)
      const related = await getRelatedDestinations(
        detail.id,
        detail.category,
        detail.tags ?? [],
        4,
      )

      return ok({
        ...serialized,
        relatedDestinations: related.map(serializeDestinationListItem),
      })
    },
  },
  {
    method: 'GET',
    path: '/api/v1/destinations/{slug}/related',
    options: {
      description: 'Related destinations for a given slug',
      tags: ['api', 'destinations'],
      validate: {
        params: destinationParams,
        query: Joi.object({ limit: Joi.number().integer().min(1).max(8).default(4) }),
      },
    },
    handler: async (request) => {
      const { slug } = request.params as { slug: string }
      const detail = await getDestinationBySlug(slug)
      if (!detail) throw notFound(`No destination found for "${slug}".`)

      const limit = Number((request.query as { limit?: number }).limit ?? 4)
      const related = await getRelatedDestinations(detail.id, detail.category, detail.tags ?? [], limit)
      return ok(related.map(serializeDestinationListItem))
    },
  },
]

export { DESTINATION_SORTS }
