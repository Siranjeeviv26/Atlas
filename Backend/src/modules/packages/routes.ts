import type { ServerRoute } from '@hapi/hapi'
import { listPackagesQuery, packageParams } from '../../validation/schemas.js'
import { normalisePagination } from '../../utils/pagination.js'
import { buildPaginationMeta, ok, paginated } from '../../utils/api-response.js'
import { notFound } from '../../utils/errors.js'
import {
  getPackageBySlug,
  getPackageFilterFacets,
  getRelatedPackages,
  listPackages,
  type PackageSort,
} from './repository.js'
import { serializePackageDetail, serializePackageListItem } from './mappers.js'

export const packageRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/v1/packages',
    options: {
      description: 'List published travel packages with filtering, sorting and pagination',
      tags: ['api', 'packages'],
      validate: { query: listPackagesQuery },
      cache: { expiresIn: 60_000, privacy: 'public' },
    },
    handler: async (request) => {
      const query = request.query as Record<string, unknown>
      const { page, limit, offset } = normalisePagination(query.page, query.limit)

      const { items, total, styles } = await listPackages(
        {
          q: (query.q as string) || undefined,
          destinationSlug: (query.destination as string) || undefined,
          style: (query.style as string) || undefined,
          minPrice: query.minPrice === undefined ? undefined : Number(query.minPrice),
          maxPrice: query.maxPrice === undefined ? undefined : Number(query.maxPrice),
          minDuration: query.minDuration === undefined ? undefined : Number(query.minDuration),
          maxDuration: query.maxDuration === undefined ? undefined : Number(query.maxDuration),
          featured: query.featured === undefined ? undefined : Boolean(query.featured),
        },
        (query.sort as PackageSort) ?? 'featured',
        limit,
        offset,
      )

      return paginated(
        items.map(serializePackageListItem),
        buildPaginationMeta(page, limit, total),
        { styles },
      )
    },
  },
  {
    method: 'GET',
    path: '/api/v1/packages/facets',
    options: {
      description: 'Filter facets for the package directory',
      tags: ['api', 'packages'],
      cache: { expiresIn: 300_000, privacy: 'public' },
    },
    handler: async () => ok(await getPackageFilterFacets()),
  },
  {
    method: 'GET',
    path: '/api/v1/packages/{slug}',
    options: {
      description: 'Full package detail with itinerary, inclusions and gallery',
      tags: ['api', 'packages'],
      validate: { params: packageParams },
      cache: { expiresIn: 60_000, privacy: 'public' },
    },
    handler: async (request) => {
      const { slug } = request.params as { slug: string }
      const detail = await getPackageBySlug(slug)
      if (!detail) throw notFound(`No package found for "${slug}".`)

      const serialized = serializePackageDetail(detail)
      const related = await getRelatedPackages(
        detail.id,
        detail.destinationId,
        detail.travelStyle,
        4,
      )

      return ok({
        ...serialized,
        relatedPackages: related.map(serializePackageListItem),
      })
    },
  },
]
