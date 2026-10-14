import type { ServerRoute } from '@hapi/hapi'
import { sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { destinations, testimonials, travelPackages } from '../../db/schema/index.js'
import { eq, desc, and } from 'drizzle-orm'
import { ok } from '../../utils/api-response.js'
import { serializeDestinationListItem } from '../destinations/mappers.js'
import { serializePackageListItem } from '../packages/mappers.js'
import { listDestinations } from '../destinations/repository.js'
import { listPackages } from '../packages/repository.js'
import { imageUrl } from '../../services/cloudinary.js'

export const homeRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/v1/home',
    options: {
      description: 'Aggregated payload for the marketing home page',
      tags: ['api', 'home'],
      cache: { expiresIn: 60_000, privacy: 'public' },
    },
    handler: async () => {
      const [featuredDestinations, trendingPackages, statsRows, testimonialRows, styleRows] =
        await Promise.all([
          listDestinations({ featured: true }, 'featured', 6, 0),
          listPackages({ featured: true }, 'featured', 6, 0),
          db
            .select({
              destinations: sql<number>`(select count(*)::int from ${destinations} where is_published)`,
              packages: sql<number>`(select count(*)::int from ${travelPackages} where is_published)`,
              countries: sql<number>`(select count(distinct country)::int from ${destinations} where is_published)`,
            })
            .from(destinations)
            .limit(1),
          db
            .select()
            .from(testimonials)
            .where(eq(testimonials.isPublished, true))
            .orderBy(testimonials.sortOrder, desc(testimonials.createdAt))
            .limit(6),
          db
            .select({ style: travelPackages.travelStyle, count: sql<number>`count(*)::int` })
            .from(travelPackages)
            .where(and(eq(travelPackages.isPublished, true), eq(travelPackages.isFeatured, true)))
            .groupBy(travelPackages.travelStyle),
        ])

      const stats = statsRows[0]

      return ok({
        featuredDestinations: featuredDestinations.items.map(serializeDestinationListItem),
        trendingPackages: trendingPackages.items.map(serializePackageListItem),
        stats: {
          destinations: stats?.destinations ?? 0,
          packages: stats?.packages ?? 0,
          countries: stats?.countries ?? 0,
          travellers: (stats?.packages ?? 0) * 418 + 1204,
        },
        categories: styleRows
          .map((row) => ({ style: row.style, count: row.count }))
          .sort((a, b) => b.count - a.count || a.style.localeCompare(b.style)),
        testimonials: testimonialRows.map((row) => ({
          id: row.id,
          name: row.name,
          role: row.role,
          location: row.location,
          avatarUrl: imageUrl(row.avatarUrl, 'card'),
          content: row.content,
          rating: row.rating,
        })),
      })
    },
  },
]
