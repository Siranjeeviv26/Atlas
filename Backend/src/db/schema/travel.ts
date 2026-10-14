import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { user } from './auth.js'

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export const profiles = pgTable(
  'profiles',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    displayName: text('display_name'),
    username: text('username'),
    bio: text('bio'),
    phone: text('phone'),
    country: text('country'),
    homeAirport: text('home_airport'),
    avatarUrl: text('avatar_url'),
    role: text('role').notNull().default('customer'),
    welcomedAt: timestamp('welcomed_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('profiles_user_id_unique').on(table.userId),
    uniqueIndex('profiles_username_unique').on(table.username),
    index('profiles_role_idx').on(table.role),
  ],
)

// ---------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------

export const destinations = pgTable(
  'destinations',
  {
    id: id(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    country: text('country').notNull(),
    continent: text('continent').notNull(),
    region: text('region'),
    summary: text('summary').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    budgetLevel: text('budget_level').notNull().default('mid'),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    highlights: jsonb('highlights').$type<string[]>().notNull().default([]),
    bestMonths: jsonb('best_months').$type<string[]>().notNull().default([]),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    currency: text('currency').notNull().default('USD'),
    language: text('language'),
    heroImageUrl: text('hero_image_url'),
    heroImagePublicId: text('hero_image_public_id'),
    averageRating: doublePrecision('average_rating').notNull().default(0),
    reviewCount: integer('review_count').notNull().default(0),
    isFeatured: boolean('is_featured').notNull().default(false),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('destinations_slug_unique').on(table.slug),
    index('destinations_country_idx').on(table.country),
    index('destinations_continent_idx').on(table.continent),
    index('destinations_category_idx').on(table.category),
    index('destinations_budget_level_idx').on(table.budgetLevel),
    index('destinations_published_featured_idx').on(table.isPublished, table.isFeatured),
  ],
)

export const destinationImages = pgTable(
  'destination_images',
  {
    id: id(),
    destinationId: text('destination_id')
      .notNull()
      .references(() => destinations.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    publicId: text('public_id'),
    alt: text('alt').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isHero: boolean('is_hero').notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [
    index('destination_images_destination_idx').on(table.destinationId),
  ],
)

// ---------------------------------------------------------------------------
// Travel packages
// ---------------------------------------------------------------------------

export const travelPackages = pgTable(
  'travel_packages',
  {
    id: id(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    description: text('description').notNull(),
    destinationId: text('destination_id')
      .notNull()
      .references(() => destinations.id, { onDelete: 'restrict' }),
    priceCents: integer('price_cents').notNull(),
    originalPriceCents: integer('original_price_cents'),
    currency: text('currency').notNull().default('USD'),
    durationDays: integer('duration_days').notNull(),
    durationNights: integer('duration_nights').notNull(),
    travelStyle: text('travel_style').notNull(),
    maxGroupSize: integer('max_group_size').notNull().default(12),
    minAge: integer('min_age').notNull().default(12),
    inclusions: jsonb('inclusions').$type<string[]>().notNull().default([]),
    exclusions: jsonb('exclusions').$type<string[]>().notNull().default([]),
    itinerary: jsonb('itinerary')
      .$type<Array<{ day: number; title: string; description: string; activities: string[] }>>()
      .notNull()
      .default([]),
    heroImageUrl: text('hero_image_url'),
    heroImagePublicId: text('hero_image_public_id'),
    averageRating: doublePrecision('average_rating').notNull().default(0),
    reviewCount: integer('review_count').notNull().default(0),
    seatsLeft: integer('seats_left').notNull().default(0),
    departureMonths: jsonb('departure_months').$type<string[]>().notNull().default([]),
    isFeatured: boolean('is_featured').notNull().default(false),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('travel_packages_slug_unique').on(table.slug),
    index('travel_packages_destination_idx').on(table.destinationId),
    index('travel_packages_style_idx').on(table.travelStyle),
    index('travel_packages_price_idx').on(table.priceCents),
    index('travel_packages_duration_idx').on(table.durationDays),
    index('travel_packages_published_featured_idx').on(table.isPublished, table.isFeatured),
  ],
)

export const packageImages = pgTable(
  'package_images',
  {
    id: id(),
    packageId: text('package_id')
      .notNull()
      .references(() => travelPackages.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    publicId: text('public_id'),
    alt: text('alt').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isHero: boolean('is_hero').notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [index('package_images_package_idx').on(table.packageId)],
)

// ---------------------------------------------------------------------------
// Favourites
// ---------------------------------------------------------------------------

export const favorites = pgTable(
  'favorites',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('favorites_user_entity_unique').on(
      table.userId,
      table.entityType,
      table.entityId,
    ),
    index('favorites_user_idx').on(table.userId),
  ],
)

// ---------------------------------------------------------------------------
// Enquiries
// ---------------------------------------------------------------------------

export const travelEnquiries = pgTable(
  'travel_enquiries',
  {
    id: id(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    subject: text('subject').notNull(),
    destinationId: text('destination_id').references(() => destinations.id, {
      onDelete: 'set null',
    }),
    packageId: text('package_id').references(() => travelPackages.id, {
      onDelete: 'set null',
    }),
    travelDate: timestamp('travel_date', { withTimezone: true }),
    budgetCents: integer('budget_cents'),
    travellers: integer('travellers').notNull().default(1),
    message: text('message').notNull(),
    status: text('status').notNull().default('pending'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('travel_enquiries_user_idx').on(table.userId),
    index('travel_enquiries_status_idx').on(table.status),
    index('travel_enquiries_email_idx').on(table.email),
  ],
)

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

export const newsletterSubscriptions = pgTable(
  'newsletter_subscriptions',
  {
    id: id(),
    email: text('email').notNull(),
    status: text('status').notNull().default('subscribed'),
    source: text('source').notNull().default('site'),
    subscribedAt: createdAt(),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('newsletter_email_unique').on(table.email)],
)

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

export const testimonials = pgTable(
  'testimonials',
  {
    id: id(),
    name: text('name').notNull(),
    role: text('role').notNull(),
    location: text('location').notNull(),
    avatarUrl: text('avatar_url'),
    content: text('content').notNull(),
    rating: integer('rating').notNull().default(5),
    sortOrder: integer('sort_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: createdAt(),
  },
  (table) => [index('testimonials_published_idx').on(table.isPublished)],
)

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(user, { fields: [profiles.userId], references: [user.id] }),
}))

export const destinationsRelations = relations(destinations, ({ many }) => ({
  images: many(destinationImages),
  packages: many(travelPackages),
}))

export const destinationImagesRelations = relations(destinationImages, ({ one }) => ({
  destination: one(destinations, {
    fields: [destinationImages.destinationId],
    references: [destinations.id],
  }),
}))

export const travelPackagesRelations = relations(travelPackages, ({ one, many }) => ({
  destination: one(destinations, {
    fields: [travelPackages.destinationId],
    references: [destinations.id],
  }),
  images: many(packageImages),
}))

export const packageImagesRelations = relations(packageImages, ({ one }) => ({
  package: one(travelPackages, {
    fields: [packageImages.packageId],
    references: [travelPackages.id],
  }),
}))

export const travelEnquiriesRelations = relations(travelEnquiries, ({ one }) => ({
  destination: one(destinations, {
    fields: [travelEnquiries.destinationId],
    references: [destinations.id],
  }),
  travelPackage: one(travelPackages, {
    fields: [travelEnquiries.packageId],
    references: [travelPackages.id],
  }),
}))
