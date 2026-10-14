import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { eq } from 'drizzle-orm'
import { db, sql } from './index.js'
import { destinations, destinationImages, travelPackages, packageImages, testimonials, profiles, user } from './schema/index.js'
import { seedDestinations, seedPackages, seedTestimonials } from './seed-data.js'
import { auth } from '../plugins/auth.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

async function seedDestinationsTable(): Promise<Map<string, string>> {
  const bySlug = new Map<string, string>()

  for (const seed of seedDestinations) {
    const [row] = await db
      .insert(destinations)
      .values({
        slug: seed.slug,
        name: seed.name,
        country: seed.country,
        continent: seed.continent,
        region: seed.region,
        summary: seed.summary,
        description: seed.description,
        category: seed.category,
        budgetLevel: seed.budgetLevel,
        tags: seed.tags,
        highlights: seed.highlights,
        bestMonths: seed.bestMonths,
        latitude: seed.latitude,
        longitude: seed.longitude,
        currency: seed.currency,
        language: seed.language,
        heroImageUrl: seed.heroImageUrl,
        isFeatured: seed.isFeatured,
        isPublished: true,
        averageRating: seed.averageRating,
        reviewCount: seed.reviewCount,
      })
      .onConflictDoUpdate({
        target: destinations.slug,
        set: {
          name: seed.name,
          country: seed.country,
          continent: seed.continent,
          region: seed.region,
          summary: seed.summary,
          description: seed.description,
          category: seed.category,
          budgetLevel: seed.budgetLevel,
          tags: seed.tags,
          highlights: seed.highlights,
          bestMonths: seed.bestMonths,
          latitude: seed.latitude,
          longitude: seed.longitude,
          currency: seed.currency,
          language: seed.language,
          heroImageUrl: seed.heroImageUrl,
          isFeatured: seed.isFeatured,
          isPublished: true,
          averageRating: seed.averageRating,
          reviewCount: seed.reviewCount,
        },
      })
      .returning({ id: destinations.id })

    bySlug.set(seed.slug, row.id)

    // Replace the gallery wholesale so re-seeding stays deterministic.
    await db.delete(destinationImages).where(eq(destinationImages.destinationId, row.id))
    if (seed.images.length) {
      await db.insert(destinationImages).values(
        seed.images.map((image, index) => ({
          destinationId: row.id,
          url: image.url,
          alt: image.alt,
          isHero: Boolean(image.isHero),
          sortOrder: index,
        })),
      )
    }
  }

  return bySlug
}

async function seedPackagesTable(destinationIds: Map<string, string>): Promise<void> {
  for (const seed of seedPackages) {
    const destinationId = destinationIds.get(seed.destinationSlug)
    if (!destinationId) {
      logger.warn({ slug: seed.slug }, 'Skipping package — destination not seeded')
      continue
    }

    const [row] = await db
      .insert(travelPackages)
      .values({
        slug: seed.slug,
        title: seed.title,
        summary: seed.summary,
        description: seed.description,
        destinationId,
        priceCents: seed.priceCents,
        originalPriceCents: seed.originalPriceCents,
        durationDays: seed.durationDays,
        durationNights: seed.durationNights,
        travelStyle: seed.travelStyle,
        maxGroupSize: seed.maxGroupSize,
        minAge: seed.minAge,
        inclusions: seed.inclusions,
        exclusions: seed.exclusions,
        itinerary: seed.itinerary,
        heroImageUrl: seed.heroImageUrl,
        departureMonths: seed.departureMonths,
        seatsLeft: seed.seatsLeft,
        averageRating: seed.averageRating,
        reviewCount: seed.reviewCount,
        isFeatured: seed.isFeatured,
        isPublished: true,
      })
      .onConflictDoUpdate({
        target: travelPackages.slug,
        set: {
          title: seed.title,
          summary: seed.summary,
          description: seed.description,
          destinationId,
          priceCents: seed.priceCents,
          originalPriceCents: seed.originalPriceCents,
          durationDays: seed.durationDays,
          durationNights: seed.durationNights,
          travelStyle: seed.travelStyle,
          maxGroupSize: seed.maxGroupSize,
          minAge: seed.minAge,
          inclusions: seed.inclusions,
          exclusions: seed.exclusions,
          itinerary: seed.itinerary,
          heroImageUrl: seed.heroImageUrl,
          departureMonths: seed.departureMonths,
          seatsLeft: seed.seatsLeft,
          averageRating: seed.averageRating,
          reviewCount: seed.reviewCount,
          isFeatured: seed.isFeatured,
          isPublished: true,
        },
      })
      .returning({ id: travelPackages.id })

    await db.delete(packageImages).where(eq(packageImages.packageId, row.id))
    if (seed.images.length) {
      await db.insert(packageImages).values(
        seed.images.map((image, index) => ({
          packageId: row.id,
          url: image.url,
          alt: image.alt,
          isHero: Boolean(image.isHero),
          sortOrder: index,
        })),
      )
    }
  }
}

async function seedTestimonialsTable(): Promise<void> {
  const existing = await db.select({ id: testimonials.id }).from(testimonials)
  if (existing.length >= seedTestimonials.length) {
    await db.delete(testimonials)
  }

  await db.insert(testimonials).values(
    seedTestimonials.map((seed) => ({
      name: seed.name,
      role: seed.role,
      location: seed.location,
      avatarUrl: seed.avatarUrl,
      content: seed.content,
      rating: seed.rating,
      sortOrder: seed.sortOrder,
      isPublished: true,
    })),
  )
}

async function seedAdminUser(): Promise<void> {
  const email = env.ADMIN_EMAIL.toLowerCase()

  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1)

  if (!existing.length) {
    await auth.api.signUpEmail({
      body: {
        name: 'Atlas Admin',
        email,
        password: env.ADMIN_PASSWORD,
      },
    })
    logger.info({ email }, 'Created admin account via Better Auth')
  }

  // Mark verified and promote to admin.
  await db.update(user).set({ emailVerified: true }).where(eq(user.email, email))
  const adminUser = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1)

  if (adminUser[0]) {
    const profile = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.userId, adminUser[0].id))
      .limit(1)

    if (profile[0]) {
      await db.update(profiles).set({ role: 'admin' }).where(eq(profiles.id, profile[0].id))
    } else {
      await db.insert(profiles).values({
        userId: adminUser[0].id,
        displayName: 'Atlas Admin',
        role: 'admin',
      })
    }
  }

  logger.info({ email }, 'Admin user ready')
}

async function main(): Promise<void> {
  logger.info('Seeding Atlas content…')

  const destinationIds = await seedDestinationsTable()
  logger.info({ count: destinationIds.size }, 'Destinations seeded')

  await seedPackagesTable(destinationIds)
  logger.info({ count: seedPackages.length }, 'Packages seeded')

  await seedTestimonialsTable()
  logger.info({ count: seedTestimonials.length }, 'Testimonials seeded')

  await seedAdminUser()

  logger.info('Seed complete')
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isDirectRun) {
  main()
    .then(async () => {
      await sql.end({ timeout: 2 })
      process.exit(0)
    })
    .catch(async (error) => {
      logger.error({ err: error }, 'Seed failed')
      await sql.end({ timeout: 2 })
      process.exit(1)
    })
}

export { main as runSeed }
