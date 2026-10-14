import Joi from '@hapi/joi'

export const DESTINATION_SORTS = [
  'featured',
  'rating_desc',
  'price_asc',
  'name_asc',
  'newest',
] as const

export const PACKAGE_SORTS = [
  'featured',
  'price_asc',
  'price_desc',
  'duration_asc',
  'rating_desc',
  'newest',
] as const

export const BUDGET_LEVELS = ['budget', 'mid', 'premium', 'luxury'] as const
export const TRAVEL_STYLES = [
  'adventure',
  'cultural',
  'beach',
  'wildlife',
  'city',
  'wellness',
  'food',
  'road-trip',
  'expedition',
] as const

const slug = Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120)

export const paginationQuery = {
  page: Joi.number().integer().min(1).max(10_000).default(1),
  limit: Joi.number().integer().min(1).max(60).default(12),
}

export const listDestinationsQuery = Joi.object({
  ...paginationQuery,
  q: Joi.string().trim().max(120).allow(''),
  country: Joi.string().trim().max(80).allow(''),
  continent: Joi.string().trim().max(80).allow(''),
  region: Joi.string().trim().max(80).allow(''),
  category: Joi.string().trim().max(60).allow(''),
  budget: Joi.string().valid(...BUDGET_LEVELS).allow(''),
  tag: Joi.string().trim().max(60).allow(''),
  featured: Joi.boolean().truthy('true', '1').falsy('false', '0'),
  sort: Joi.string()
    .valid(...DESTINATION_SORTS)
    .default('featured'),
})

export const destinationParams = Joi.object({
  slug: slug.required(),
})

export const listPackagesQuery = Joi.object({
  ...paginationQuery,
  q: Joi.string().trim().max(120).allow(''),
  destination: slug.allow(''),
  style: Joi.string().trim().max(60).allow(''),
  minPrice: Joi.number().integer().min(0).max(1_000_000),
  maxPrice: Joi.number().integer().min(0).max(1_000_000),
  minDuration: Joi.number().integer().min(1).max(90),
  maxDuration: Joi.number().integer().min(1).max(90),
  featured: Joi.boolean().truthy('true', '1').falsy('false', '0'),
  sort: Joi.string()
    .valid(...PACKAGE_SORTS)
    .default('featured'),
})

export const packageParams = Joi.object({
  slug: slug.required(),
})

export const createEnquiryPayload = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  phone: Joi.string().trim().max(40).allow('', null),
  subject: Joi.string().trim().min(3).max(160).required(),
  message: Joi.string().trim().min(10).max(4000).required(),
  destinationSlug: slug.allow(''),
  packageSlug: slug.allow(''),
  travelDate: Joi.date().iso().greater('now').allow(null),
  budgetCents: Joi.number().integer().min(0).max(10_000_000).allow(null),
  travellers: Joi.number().integer().min(1).max(40).default(1),
})

export const subscribeNewsletterPayload = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  source: Joi.string().trim().max(60).default('site'),
})

export const updateProfilePayload = Joi.object({
  displayName: Joi.string().trim().min(2).max(120),
  username: Joi.string().trim().min(3).max(40).pattern(/^[a-z0-9_]+$/i).allow(null),
  bio: Joi.string().trim().max(600).allow('', null),
  phone: Joi.string().trim().max(40).allow('', null),
  country: Joi.string().trim().max(80).allow('', null),
  homeAirport: Joi.string().trim().max(80).allow('', null),
  avatarUrl: Joi.string().uri({ allowRelative: false }).allow('', null),
}).min(1)

export const favoritePayload = Joi.object({
  entityType: Joi.string().valid('destination', 'package').required(),
  entityId: Joi.string().uuid().required(),
})

export const favoriteParams = Joi.object({
  entityType: Joi.string().valid('destination', 'package').required(),
  entityId: Joi.string().uuid().required(),
})

export const listFavoritesQuery = Joi.object({
  ...paginationQuery,
  entityType: Joi.string().valid('destination', 'package', 'all').default('all'),
})

export const listEnquiriesQuery = Joi.object({
  ...paginationQuery,
  status: Joi.string().valid('pending', 'in_progress', 'resolved', 'cancelled').allow(''),
})

export const uploadSignaturePayload = Joi.object({
  folder: Joi.string().trim().max(120).default('atlas/destinations'),
  fileName: Joi.string().trim().max(160),
})

export const serverUploadPayload = Joi.object({
  dataUrl: Joi.string()
    .pattern(/^data:image\/(jpeg|png|webp|avif);base64,[A-Za-z0-9+/=]+$/)
    .required(),
  folder: Joi.string().trim().max(120).default('atlas/destinations'),
  fileName: Joi.string().trim().max(160),
  alt: Joi.string().trim().max(200),
  isHero: Joi.boolean().truthy('true', '1').falsy('false', '0'),
  entity_type: Joi.string().valid('destination', 'package'),
  entity_id: Joi.string().uuid(),
})

export const adminListQuery = Joi.object({
  ...paginationQuery,
  q: Joi.string().trim().max(120).allow(''),
  published: Joi.boolean().truthy('true', '1').falsy('false', '0'),
})
