import { env } from '../../config/env.js'
import {
  BUDGET_LEVELS,
  DESTINATION_SORTS,
  PACKAGE_SORTS,
  TRAVEL_STYLES,
} from '../../validation/schemas.js'

const json = (schema: Record<string, unknown>) => ({
  required: true,
  content: { 'application/json': { schema } },
})

const errorResponse = (description: string) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorEnvelope' },
    },
  },
})

const errorResponses = {
  '400': errorResponse('Validation failed or an unknown query/body key was supplied.'),
  '401': errorResponse('Authentication is required.'),
  '403': errorResponse('Authenticated, but not permitted.'),
  '404': errorResponse('No such resource.'),
  '429': errorResponse('Rate limit exceeded.'),
  '500': errorResponse('Unexpected server error.'),
}

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Atlas API',
    version: '1.0.0',
    description:
      'Travel discovery and trip-planning API for Atlas. All responses use the ' +
      'envelope `{ success, data, meta }` on success and `{ success, error, meta }` on failure. ' +
      'Authentication is handled by Better Auth under `/api/auth` and is cookie based.',
    license: { name: 'UNLICENSED' },
  },
  servers: [
    { url: env.API_URL, description: 'Local development' },
    { url: 'http://localhost:3000', description: 'Next.js dev proxy (/api → API)' },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Home' },
    { name: 'Destinations' },
    { name: 'Packages' },
    { name: 'Auth', description: 'Better Auth endpoints, proxied verbatim from the auth handler.' },
    { name: 'Account' },
    { name: 'Favorites' },
    { name: 'Enquiries' },
    { name: 'Newsletter' },
    { name: 'Admin' },
  ],
  paths: {
    '/api/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        security: [],
        responses: {
          '200': {
            description: 'Service is running.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', const: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'ok' },
                        uptimeSeconds: { type: 'number' },
                        version: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness probe (checks the database)',
        security: [],
        responses: {
          '200': { description: 'Ready to serve traffic.' },
          '503': { description: 'Dependency unavailable.' },
        },
      },
    },
    '/api/v1/home': {
      get: {
        tags: ['Home'],
        summary: 'Everything the marketing homepage needs in one call',
        security: [],
        responses: {
          '200': {
            description: 'Featured destinations, trending packages, stats, categories and testimonials.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', const: true },
                    data: {
                      type: 'object',
                      properties: {
                        featuredDestinations: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/DestinationListItem' },
                        },
                        trendingPackages: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/PackageListItem' },
                        },
                        stats: {
                          type: 'object',
                          properties: {
                            destinations: { type: 'integer' },
                            packages: { type: 'integer' },
                            countries: { type: 'integer' },
                          },
                        },
                        categories: { type: 'array', items: { type: 'object' } },
                        testimonials: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Testimonial' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/destinations': {
      get: {
        tags: ['Destinations'],
        summary: 'List destinations',
        security: [],
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
          { name: 'q', in: 'query', schema: { type: 'string', maxLength: 120 }, description: 'Full-text search over name, country and summary.' },
          { name: 'country', in: 'query', schema: { type: 'string' } },
          { name: 'continent', in: 'query', schema: { type: 'string' } },
          { name: 'region', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'beach, culture, nature, city, adventure, wellness…' },
          { name: 'budget', in: 'query', schema: { type: 'string', enum: [...BUDGET_LEVELS] } },
          { name: 'tag', in: 'query', schema: { type: 'string' } },
          { name: 'featured', in: 'query', schema: { type: 'boolean' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: [...DESTINATION_SORTS], default: 'featured' } },
        ],
        responses: {
          '200': {
            description: 'Paginated destinations. Items are returned in `data` and pagination info in `meta`.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', const: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DestinationListItem' },
                    },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          '400': errorResponses['400'],
        },
      },
    },
    '/api/v1/destinations/filters': {
      get: {
        tags: ['Destinations'],
        summary: 'Facets for the filter sidebar',
        security: [],
        responses: {
          '200': {
            description: 'Distinct countries, continents, categories and tags.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', const: true },
                    data: {
                      type: 'object',
                      properties: {
                        countries: { type: 'array', items: { type: 'string' } },
                        continents: { type: 'array', items: { type: 'string' } },
                        categories: { type: 'array', items: { type: 'string' } },
                        tags: { type: 'array', items: { type: 'string' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/destinations/{slug}': {
      get: {
        tags: ['Destinations'],
        summary: 'Destination detail',
        security: [],
        parameters: [{ $ref: '#/components/parameters/DestinationSlug' }],
        responses: {
          '200': {
            description: 'Full detail including gallery, highlights and published packages.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', const: true },
                    data: { $ref: '#/components/schemas/DestinationDetail' },
                  },
                },
              },
            },
          },
          '404': errorResponses['404'],
        },
      },
    },
    '/api/v1/destinations/{slug}/related': {
      get: {
        tags: ['Destinations'],
        summary: 'Similar destinations by category and tags',
        security: [],
        parameters: [
          { $ref: '#/components/parameters/DestinationSlug' },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 12, default: 4 } },
        ],
        responses: {
          '200': { description: 'Related destinations.' },
          '404': errorResponses['404'],
        },
      },
    },
    '/api/v1/packages': {
      get: {
        tags: ['Packages'],
        summary: 'List travel packages',
        security: [],
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
          { name: 'q', in: 'query', schema: { type: 'string', maxLength: 120 } },
          { name: 'destination', in: 'query', schema: { type: 'string' }, description: 'Destination slug.' },
          { name: 'style', in: 'query', schema: { type: 'string', enum: [...TRAVEL_STYLES] } },
          { name: 'minPrice', in: 'query', schema: { type: 'integer', minimum: 0 }, description: 'Minor units (cents).' },
          { name: 'maxPrice', in: 'query', schema: { type: 'integer', minimum: 0 } },
          { name: 'minDuration', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 90 } },
          { name: 'maxDuration', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 90 } },
          { name: 'featured', in: 'query', schema: { type: 'boolean' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: [...PACKAGE_SORTS], default: 'featured' } },
        ],
        responses: {
          '200': {
            description: 'Paginated packages; `meta.styles` carries the distinct styles present in the result.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', const: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/PackageListItem' } },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          '400': errorResponses['400'],
        },
      },
    },
    '/api/v1/packages/facets': {
      get: {
        tags: ['Packages'],
        summary: 'Facets for the package filters',
        security: [],
        responses: { '200': { description: 'Distinct styles, price bounds and durations.' } },
      },
    },
    '/api/v1/packages/{slug}': {
      get: {
        tags: ['Packages'],
        summary: 'Package detail',
        security: [],
        parameters: [{ $ref: '#/components/parameters/PackageSlug' }],
        responses: {
          '200': {
            description: 'Full detail including itinerary, inclusions, exclusions and gallery.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', const: true },
                    data: { $ref: '#/components/schemas/PackageDetail' },
                  },
                },
              },
            },
          },
          '404': errorResponses['404'],
        },
      },
    },
    '/api/auth/sign-up/email': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account with email and password',
        security: [],
        description:
          'Creates the user, links a credential account, sends a verification email and returns a session cookie. ' +
          'Also creates a profile row via a database hook.',
        requestBody: json({
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 120 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            rememberMe: { type: 'boolean', default: true },
          },
        }),
        responses: {
          '200': {
            description: 'Account created; session cookies are set.',
            headers: {
              'set-cookie': {
                description: '`better-auth.session_token` and `better-auth.session_data`.',
                schema: { type: 'string' },
              },
            },
          },
          '400': errorResponse('Invalid email, weak password, or the address is already registered.'),
        },
      },
    },
    '/api/auth/sign-in/email': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in with email and password',
        security: [],
        requestBody: json({
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
            rememberMe: { type: 'boolean', default: true },
          },
        }),
        responses: {
          '200': { description: 'Signed in; session cookies are set.' },
          '400': errorResponse('Invalid credentials.'),
        },
      },
    },
    '/api/auth/sign-out': {
      post: {
        tags: ['Auth'],
        summary: 'Sign out and clear the session cookies',
        responses: { '200': { description: 'Session cleared.' } },
      },
    },
    '/api/auth/get-session': {
      get: {
        tags: ['Auth'],
        summary: 'Resolve the current session from cookies',
        responses: {
          '200': { description: 'The session and user, or `null` when signed out.' },
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Send a password reset link',
        security: [],
        requestBody: json({
          type: 'object',
          required: ['email'],
          properties: { email: { type: 'string', format: 'email' } },
        }),
        responses: { '200': { description: 'Always succeeds to avoid leaking which addresses exist.' } },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Set a new password using a reset token',
        security: [],
        requestBody: json({
          type: 'object',
          required: ['token', 'newPassword'],
          properties: {
            token: { type: 'string' },
            newPassword: { type: 'string', minLength: 8 },
          },
        }),
        responses: { '200': { description: 'Password updated.' } },
      },
    },
    '/api/auth/verify-email': {
      get: {
        tags: ['Auth'],
        summary: 'Verify an email address from the emailed link',
        security: [],
        parameters: [{ name: 'token', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Email verified.' } },
      },
    },
    '/api/auth/google': {
      get: {
        tags: ['Auth'],
        summary: 'Start the Google OAuth flow (only when configured)',
        security: [],
        responses: { '302': { description: 'Redirect to Google.' } },
      },
    },
    '/api/v1/me': {
      get: {
        tags: ['Account'],
        summary: 'Current user plus profile',
        responses: {
          '200': {
            description: 'The signed-in user and their profile.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', const: true },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        image: { type: ['string', 'null'] },
                        emailVerified: { type: 'boolean' },
                        role: { type: 'string', enum: ['customer', 'admin'], example: 'customer' },
                        displayName: { type: ['string', 'null'] },
                        username: { type: ['string', 'null'] },
                        bio: { type: ['string', 'null'] },
                        phone: { type: ['string', 'null'] },
                        country: { type: ['string', 'null'] },
                        homeAirport: { type: ['string', 'null'] },
                        avatarUrl: { type: ['string', 'null'] },
                        welcomedAt: { type: ['string', 'null'], format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': errorResponses['401'],
        },
      },
      patch: {
        tags: ['Account'],
        summary: 'Update the signed-in profile',
        requestBody: json({
          type: 'object',
          minProperties: 1,
          properties: {
            displayName: { type: 'string', minLength: 2, maxLength: 120 },
            username: { type: ['string', 'null'], pattern: '^[a-z0-9_]+$', maxLength: 40 },
            bio: { type: ['string', 'null'], maxLength: 600 },
            phone: { type: ['string', 'null'], maxLength: 40 },
            country: { type: ['string', 'null'], maxLength: 80 },
            homeAirport: { type: ['string', 'null'], maxLength: 80 },
            avatarUrl: { type: ['string', 'null'], format: 'uri' },
          },
        }),
        responses: {
          '200': { description: 'Updated profile.' },
          '401': errorResponses['401'],
          '409': errorResponse('That username is taken.'),
        },
      },
    },
    '/api/v1/me/resend-verification': {
      post: {
        tags: ['Account'],
        summary: 'Re-send the verification email',
        responses: {
          '200': { description: 'Queued (or a no-op when already verified).' },
          '401': errorResponses['401'],
          '429': errorResponses['429'],
        },
      },
    },
    '/api/v1/auth/providers': {
      get: {
        tags: ['Auth'],
        summary: 'Which third-party sign-in providers are configured',
        responses: {
          '200': {
            description: 'Provider availability.',
            content: {
              'application/json': {
                schema: json({
                  type: 'object',
                  properties: { google: { type: 'boolean' } },
                }),
              },
            },
          },
        },
      },
    },
    '/api/v1/favorites': {
      get: {
        tags: ['Favorites'],
        summary: "List the signed-in user's saved items",
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
          { name: 'entityType', in: 'query', schema: { type: 'string', enum: ['destination', 'package', 'all'], default: 'all' } },
        ],
        responses: {
          '200': { description: 'Paginated favorites.' },
          '401': errorResponses['401'],
        },
      },
      post: {
        tags: ['Favorites'],
        summary: 'Save a destination or package',
        requestBody: json({
          type: 'object',
          required: ['entityType', 'entityId'],
          properties: {
            entityType: { type: 'string', enum: ['destination', 'package'] },
            entityId: { type: 'string', format: 'uuid' },
          },
        }),
        responses: {
          '201': { description: 'Saved (idempotent).' },
          '401': errorResponses['401'],
          '404': errorResponse('No such destination or package.'),
        },
      },
    },
    '/api/v1/favorites/{entityType}/{entityId}': {
      delete: {
        tags: ['Favorites'],
        summary: 'Remove a saved item',
        parameters: [
          { name: 'entityType', in: 'path', required: true, schema: { type: 'string', enum: ['destination', 'package'] } },
          { name: 'entityId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Removed.' },
          '401': errorResponses['401'],
        },
      },
    },
    '/api/v1/favorites/check': {
      get: {
        tags: ['Favorites'],
        summary: 'Whether the current user has saved a given entity',
        parameters: [
          { name: 'entityType', in: 'query', required: true, schema: { type: 'string', enum: ['destination', 'package'] } },
          { name: 'entityId', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: '`{ favorited: boolean }`.' } },
      },
    },
    '/api/v1/enquiries': {
      post: {
        tags: ['Enquiries'],
        summary: 'Submit a trip enquiry (public, rate limited)',
        security: [],
        requestBody: json({
          type: 'object',
          required: ['name', 'email', 'subject', 'message'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 120 },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', maxLength: 40 },
            subject: { type: 'string', minLength: 3, maxLength: 160 },
            message: { type: 'string', minLength: 10, maxLength: 4000 },
            destinationSlug: { type: 'string' },
            packageSlug: { type: 'string' },
            travelDate: { type: 'string', format: 'date-time', description: 'Must be in the future.' },
            budgetCents: { type: 'integer', minimum: 0 },
            travellers: { type: 'integer', minimum: 1, maximum: 40, default: 1 },
          },
        }),
        responses: {
          '201': { description: 'Enquiry stored; an acknowledgement email is queued.' },
          '400': errorResponses['400'],
          '429': errorResponses['429'],
        },
      },
      get: {
        tags: ['Enquiries'],
        summary: "The signed-in user's enquiry history",
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'in_progress', 'resolved', 'cancelled'] } },
        ],
        responses: {
          '200': {
            description: 'Paginated enquiries. Signed-out callers get an empty list with `meta.requiresAuth: true`.',
          },
        },
      },
    },
    '/api/v1/enquiries/{id}': {
      get: {
        tags: ['Enquiries'],
        summary: 'Single enquiry for the signed-in user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Enquiry detail.' },
          '401': errorResponses['401'],
          '404': errorResponse('Not your enquiry, or it no longer exists.'),
        },
      },
    },
    '/api/v1/newsletter/subscribe': {
      post: {
        tags: ['Newsletter'],
        summary: 'Subscribe to the Atlas dispatch (public, rate limited)',
        security: [],
        requestBody: json({
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
            source: { type: 'string', maxLength: 60, default: 'site' },
          },
        }),
        responses: {
          '200': {
            description: 'Subscribed. `data.alreadySubscribed` is true when the address was already active.',
          },
          '400': errorResponses['400'],
          '429': errorResponses['429'],
        },
      },
    },
    '/api/v1/newsletter/unsubscribe': {
      post: {
        tags: ['Newsletter'],
        summary: 'Unsubscribe an address',
        security: [],
        requestBody: json({
          type: 'object',
          required: ['email'],
          properties: { email: { type: 'string', format: 'email' } },
        }),
        responses: { '200': { description: '`{ unsubscribed, existed }`.' } },
      },
    },
    '/api/v1/admin/uploads/policy': {
      get: {
        tags: ['Admin'],
        summary: 'Upload policy (whether Cloudinary is configured)',
        responses: { '200': { description: '`{ configured, maxBytes, folders }`.' } },
      },
    },
    '/api/v1/admin/uploads/signature': {
      post: {
        tags: ['Admin'],
        summary: 'Signed Cloudinary upload parameters for direct browser uploads',
        requestBody: json({
          type: 'object',
          properties: {
            folder: { type: 'string', maxLength: 120, default: 'atlas/destinations' },
            fileName: { type: 'string', maxLength: 160 },
          },
        }),
        responses: {
          '200': { description: 'Signature, timestamp, api key and cloud name.' },
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '503': errorResponse('Cloudinary is not configured.'),
        },
      },
    },
    '/api/v1/admin/uploads': {
      post: {
        tags: ['Admin'],
        summary: 'Server-side upload from a base64 data URL',
        description:
          'Multipart is not used; send the file as a `data:` URL. `entity_type`/`entity_id` optionally ' +
          'record the upload against a destination or package.',
        requestBody: json({
          type: 'object',
          required: ['dataUrl'],
          properties: {
            dataUrl: {
              type: 'string',
              pattern: '^data:image/(jpeg|png|webp|avif);base64,',
            },
            folder: { type: 'string', maxLength: 120, default: 'atlas/destinations' },
            fileName: { type: 'string', maxLength: 160 },
            alt: { type: 'string', maxLength: 200 },
            isHero: { type: 'boolean' },
            entity_type: { type: 'string', enum: ['destination', 'package'] },
            entity_id: { type: 'string', format: 'uuid' },
          },
        }),
        responses: {
          '201': { description: 'Uploaded; returns the Cloudinary public ID and secure URL.' },
          '401': errorResponses['401'],
          '403': errorResponses['403'],
          '413': errorResponse('The image exceeds the size limit.'),
          '415': errorResponse('Unsupported image format.'),
          '503': errorResponse('Cloudinary is not configured.'),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'better-auth.session_token',
        description: 'Set by sign-up/sign-in. Send it with `credentials: include` from the browser.',
      },
    },
    parameters: {
      Page: { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
      Limit: { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 60, default: 12 } },
      DestinationSlug: {
        name: 'slug',
        in: 'path',
        required: true,
        schema: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
      },
      PackageSlug: {
        name: 'slug',
        in: 'path',
        required: true,
        schema: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
      },
    },
    schemas: {
      ErrorEnvelope: {
        type: 'object',
        required: ['success', 'error', 'meta'],
        properties: {
          success: { type: 'boolean', const: false },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: {
                type: 'string',
                enum: [
                  'VALIDATION_ERROR',
                  'UNAUTHORIZED',
                  'FORBIDDEN',
                  'NOT_FOUND',
                  'CONFLICT',
                  'PAYLOAD_TOO_LARGE',
                  'UNSUPPORTED_MEDIA_TYPE',
                  'RATE_LIMITED',
                  'SERVICE_UNAVAILABLE',
                  'INTERNAL_ERROR',
                ],
              },
              message: { type: 'string' },
              details: { description: 'Present for validation failures and, outside production, 5xx stack traces.' },
            },
          },
          meta: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              method: { type: 'string' },
              requestId: { type: 'string' },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
          hasMore: { type: 'boolean' },
        },
      },
      Image: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          alt: { type: 'string' },
          isHero: { type: 'boolean' },
        },
      },
      Testimonial: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          role: { type: ['string', 'null'] },
          location: { type: ['string', 'null'] },
          avatarUrl: { type: ['string', 'null'], format: 'uri' },
          content: { type: 'string' },
          rating: { type: 'number', minimum: 1, maximum: 5 },
        },
      },
      DestinationListItem: {
        type: 'object',
        required: ['id', 'slug', 'name', 'country', 'continent', 'summary', 'category'],
        properties: {
          id: { type: 'string' },
          slug: { type: 'string' },
          name: { type: 'string' },
          country: { type: 'string' },
          continent: { type: 'string' },
          region: { type: ['string', 'null'] },
          summary: { type: 'string' },
          category: { type: 'string' },
          budgetLevel: { type: 'string', enum: [...BUDGET_LEVELS] },
          tags: { type: 'array', items: { type: 'string' } },
          heroImageUrl: { type: ['string', 'null'], format: 'uri' },
          averageRating: { type: 'number' },
          reviewCount: { type: 'integer' },
          isFeatured: { type: 'boolean' },
          packageCount: { type: 'integer', description: 'Only present on list responses.' },
        },
      },
      DestinationDetail: {
        allOf: [
          { $ref: '#/components/schemas/DestinationListItem' },
          {
            type: 'object',
            properties: {
              description: { type: 'string' },
              highlights: { type: 'array', items: { type: 'string' } },
              bestMonths: { type: 'array', items: { type: 'string' } },
              latitude: { type: ['number', 'null'] },
              longitude: { type: ['number', 'null'] },
              currency: { type: ['string', 'null'] },
              language: { type: ['string', 'null'] },
              gallery: { type: 'array', items: { $ref: '#/components/schemas/Image' } },
              packages: { type: 'array', items: { $ref: '#/components/schemas/PackageListItem' } },
            },
          },
        ],
      },
      PackageListItem: {
        type: 'object',
        required: ['id', 'slug', 'title', 'summary', 'priceCents', 'currency', 'durationDays'],
        properties: {
          id: { type: 'string' },
          slug: { type: 'string' },
          title: { type: 'string' },
          summary: { type: 'string' },
          priceCents: { type: 'integer', description: 'Minor units.' },
          originalPriceCents: { type: ['integer', 'null'], description: 'Struck-through price when discounted.' },
          currency: { type: 'string', example: 'USD' },
          durationDays: { type: 'integer' },
          durationNights: { type: 'integer' },
          travelStyle: { type: 'string', enum: [...TRAVEL_STYLES] },
          maxGroupSize: { type: 'integer' },
          heroImageUrl: { type: ['string', 'null'], format: 'uri' },
          averageRating: { type: 'number' },
          reviewCount: { type: 'integer' },
          seatsLeft: { type: ['integer', 'null'] },
          isFeatured: { type: 'boolean' },
          departureMonths: { type: 'array', items: { type: 'string' } },
          destination: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              country: { type: 'string' },
              continent: { type: 'string' },
            },
          },
        },
      },
      PackageDetail: {
        allOf: [
          { $ref: '#/components/schemas/PackageListItem' },
          {
            type: 'object',
            properties: {
              description: { type: 'string' },
              minAge: { type: ['integer', 'null'] },
              inclusions: { type: 'array', items: { type: 'string' } },
              exclusions: { type: 'array', items: { type: 'string' } },
              itinerary: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    day: { type: 'integer' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    meals: { type: 'array', items: { type: 'string' } },
                    overnight: { type: ['string', 'null'] },
                  },
                },
              },
              gallery: { type: 'array', items: { $ref: '#/components/schemas/Image' } },
            },
          },
        ],
      },
    },
  },
  security: [{ sessionCookie: [] }],
} as const
