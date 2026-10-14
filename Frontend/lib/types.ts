// Mirrors the shapes returned by the Hapi API (backend/src/modules mappers).

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ApiErrorBody {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
  meta?: { path?: string; method?: string; requestId?: string }
}

export interface SuccessEnvelope<T> {
  success: true
  data: T
  meta?: PaginationMeta & Record<string, unknown>
}

export type Envelope<T> = SuccessEnvelope<T> | ApiErrorBody

export interface Testimonial {
  id: string
  name: string
  role: string | null
  location: string | null
  avatarUrl: string | null
  content: string
  rating: number
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
  budgetLevel: 'budget' | 'mid' | 'premium' | 'luxury'
  tags: string[]
  heroImageUrl: string | null
  averageRating: number
  reviewCount: number
  isFeatured: boolean
  packageCount?: number
}

export interface GalleryImage {
  id: string
  url: string
  alt: string
  isHero: boolean
}

export interface PackageListItem {
  id: string
  slug: string
  title: string
  summary: string
  priceCents: number
  originalPriceCents: number | null
  currency?: string
  durationDays: number
  durationNights?: number
  travelStyle: string
  maxGroupSize?: number
  heroImageUrl: string | null
  averageRating: number
  reviewCount: number
  seatsLeft?: number | null
  isFeatured: boolean
  departureMonths?: string[]
  destination?: {
    id?: string
    name: string
    slug: string
    country: string
    continent?: string
  }
}

export interface ItineraryDay {
  day: number
  title: string
  description: string
  activities?: string[]
  meals?: string[]
  overnight?: string | null
}

export interface DestinationDetail extends DestinationListItem {
  description: string
  highlights: string[]
  bestMonths: string[]
  latitude: number | null
  longitude: number | null
  currency: string | null
  language: string | null
  gallery: GalleryImage[]
  packages: PackageListItem[]
}

export interface PackageDetail extends PackageListItem {
  description: string
  minAge: number | null
  inclusions: string[]
  exclusions: string[]
  itinerary: ItineraryDay[]
  gallery: GalleryImage[]
}

export interface DestinationFilters {
  countries: string[]
  continents: string[]
  categories: string[]
  tags: string[]
}

export interface PackageFacets {
  styles?: { style: string; count: number }[]
  priceRange?: { minCents: number; maxCents: number }
  maxDuration?: number
  [key: string]: unknown
}

export interface HomePayload {
  featuredDestinations: DestinationListItem[]
  trendingPackages: PackageListItem[]
  stats: { destinations: number; packages: number; countries: number }
  categories: { style: string; count: number }[]
  testimonials: Testimonial[]
}

export interface Profile {
  id: string
  email: string
  name: string
  image: string | null
  emailVerified: boolean
  role: 'customer' | 'admin'
  displayName: string | null
  username: string | null
  bio: string | null
  phone: string | null
  country: string | null
  homeAirport: string | null
  avatarUrl: string | null
  welcomedAt: string | null
}

export interface FavoriteItem {
  id: string
  entityType: 'destination' | 'package'
  entityId: string
  createdAt: string
  destination?: DestinationListItem | null
  package?: PackageListItem | null
}

export interface Enquiry {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled'
  travelDate: string | null
  travellers: number
  createdAt: string
  destinationName?: string | null
  packageTitle?: string | null
}
