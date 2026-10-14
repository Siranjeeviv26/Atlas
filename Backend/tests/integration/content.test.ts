import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { closeServer, getServer } from '../helpers/server.js'

interface Envelope<T> {
  success: boolean
  data: T
  meta?: { page?: number; limit?: number; total?: number }
  error?: { code: string; message: string }
}

interface DestinationItem {
  id: string
  slug: string
  name: string
  packageCount?: number
  isFeatured?: boolean
}

interface PackageItem {
  id: string
  slug: string
  title: string
  priceCents: number
}

describe('GET /api/v1/home', () => {
  beforeAll(async () => {
    await getServer()
  })
  afterAll(closeServer)

  it('returns featured destinations, trending packages, stats and testimonials', async () => {
    const res = await (await getServer()).inject({ method: 'GET', url: '/api/v1/home' })

    expect(res.statusCode).toBe(200)
    const body = res.result as Envelope<{
      featuredDestinations: DestinationItem[]
      trendingPackages: PackageItem[]
      stats: Record<string, number>
      categories: unknown[]
      testimonials: unknown[]
    }>

    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.featuredDestinations)).toBe(true)
    expect(body.data.featuredDestinations.length).toBeGreaterThan(0)
    expect(Array.isArray(body.data.trendingPackages)).toBe(true)
    expect(body.data.trendingPackages.length).toBeGreaterThan(0)
    expect(body.data.testimonials.length).toBeGreaterThan(0)
    expect(body.data.stats.destinations).toBeGreaterThan(0)
    expect(body.data.stats.packages).toBeGreaterThan(0)
    expect(body.data.stats.countries).toBeGreaterThan(0)
  })
})

describe('GET /api/v1/destinations', () => {
  afterAll(closeServer)

  it('returns a paginated list with package counts', async () => {
    const res = await (await getServer()).inject({
      method: 'GET',
      url: '/api/v1/destinations?limit=5',
    })

    expect(res.statusCode).toBe(200)
    const body = res.result as Envelope<DestinationItem[]>

    expect(body.success).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
    expect(body.data.length).toBeLessThanOrEqual(5)
    // Regression: the correlated packageCount subquery must resolve destinations.id.
    expect(body.data.some((item) => (item.packageCount ?? 0) > 0)).toBe(true)
  })

  it('filters by category', async () => {
    const res = await (await getServer()).inject({
      method: 'GET',
      url: '/api/v1/destinations?category=beach',
    })

    expect(res.statusCode).toBe(200)
    const body = res.result as Envelope<DestinationItem[]>
    const categories = await (await getServer()).inject({
      method: 'GET',
      url: '/api/v1/destinations/filters',
    })
    expect(categories.statusCode).toBe(200)
    expect(body.success).toBe(true)
  })

  it('supports text search', async () => {
    const res = await (await getServer()).inject({
      method: 'GET',
      url: '/api/v1/destinations?q=japan',
    })

    expect(res.statusCode).toBe(200)
    const body = res.result as Envelope<DestinationItem[]>
    expect(body.success).toBe(true)
    expect(body.data.some((item) => item.slug.includes('kyoto'))).toBe(true)
  })

  it('rejects unknown query keys', async () => {
    const res = await (await getServer()).inject({
      method: 'GET',
      url: '/api/v1/destinations?bogus=1',
    })

    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    expect(res.statusCode).toBeLessThan(500)
  })

  it('returns filter facets', async () => {
    const res = await (await getServer()).inject({
      method: 'GET',
      url: '/api/v1/destinations/filters',
    })

    expect(res.statusCode).toBe(200)
    const body = res.result as Envelope<{ countries: string[]; categories: string[] }>
    expect(body.data.countries.length).toBeGreaterThan(0)
    expect(body.data.categories.length).toBeGreaterThan(0)
  })
})

describe('GET /api/v1/destinations/{slug}', () => {
  afterAll(closeServer)

  it('returns a full detail payload for a seeded slug', async () => {
    const list = await (await getServer()).inject({
      method: 'GET',
      url: '/api/v1/destinations?limit=1',
    })
    const slug = ((list.result as Envelope<DestinationItem[]>).data[0] as DestinationItem).slug

    const res = await (await getServer()).inject({
      method: 'GET',
      url: `/api/v1/destinations/${slug}`,
    })

    expect(res.statusCode).toBe(200)
    const body = res.result as Envelope<{
      slug: string
      gallery?: unknown[]
      packages?: unknown[]
      relatedDestinations?: unknown[]
    }>
    expect(body.data.slug).toBe(slug)
    expect(Array.isArray(body.data.gallery)).toBe(true)
    expect(Array.isArray(body.data.packages)).toBe(true)
    expect(Array.isArray(body.data.relatedDestinations)).toBe(true)
  })

  it('returns 404 for an unknown slug', async () => {
    const res = await (await getServer()).inject({
      method: 'GET',
      url: '/api/v1/destinations/not-a-real-place',
    })

    expect(res.statusCode).toBe(404)
    const body = res.result as Envelope<never> & { error: { code: string } }
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })
})

describe('GET /api/v1/packages', () => {
  afterAll(closeServer)

  it('returns a paginated list', async () => {
    const res = await (await getServer()).inject({ method: 'GET', url: '/api/v1/packages?limit=4' })

    expect(res.statusCode).toBe(200)
    const body = res.result as Envelope<PackageItem[]>
    expect(body.data.length).toBeGreaterThan(0)
    expect(body.data.length).toBeLessThanOrEqual(4)
    expect(body.data[0].priceCents).toBeGreaterThan(0)
  })

  it('filters by travel style and duration', async () => {
    const res = await (await getServer()).inject({
      method: 'GET',
      url: '/api/v1/packages?style=adventure&maxDuration=10',
    })

    expect(res.statusCode).toBe(200)
    const body = res.result as Envelope<PackageItem[]>
    expect(body.success).toBe(true)
  })

  it('returns facets', async () => {
    const res = await (await getServer()).inject({ method: 'GET', url: '/api/v1/packages/facets' })

    expect(res.statusCode).toBe(200)
    const body = res.result as Envelope<Record<string, unknown>>
    expect(body.success).toBe(true)
    expect(Object.keys(body.data).length).toBeGreaterThan(0)
  })

  it('returns 404 for an unknown package slug', async () => {
    const res = await (await getServer()).inject({
      method: 'GET',
      url: '/api/v1/packages/definitely-not-real',
    })

    expect(res.statusCode).toBe(404)
  })
})
