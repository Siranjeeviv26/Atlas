import Hapi from '@hapi/hapi'
import { env, allowedOrigins } from './config/env.js'
import { logger } from './utils/logger.js'
import { errorHandlingPlugin } from './plugins/error-handler.js'
import { authRoutes } from './plugins/auth-routes.js'
import { healthRoutes } from './modules/health/routes.js'
import { destinationRoutes } from './modules/destinations/routes.js'
import { packageRoutes } from './modules/packages/routes.js'
import { homeRoutes } from './modules/home/routes.js'
import { meRoutes } from './modules/me/routes.js'
import { favoriteRoutes } from './modules/favorites/routes.js'
import { enquiryRoutes } from './modules/enquiries/routes.js'
import { newsletterRoutes } from './modules/newsletter/routes.js'
import { adminUploadRoutes } from './modules/admin/uploads/routes.js'
import { docsRoutes } from './modules/docs/routes.js'

const API_PREFIX = '/api/v1'

export async function buildServer(): Promise<Hapi.Server> {
  const server = Hapi.server({
    host: env.HOST,
    port: env.PORT,
    routes: {
      // Better Auth reads the raw cookie header itself; Hapi's state parser
      // would otherwise reject the whole request when the browser holds any
      // malformed localhost cookie (e.g. from another dev tool).
      state: { parse: false },
      cors: {
        origin: allowedOrigins,
        credentials: true,
        headers: [
          'accept',
          'authorization',
          'content-type',
          'origin',
          'referer',
          'user-agent',
          'x-requested-with',
        ],
        exposedHeaders: ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset'],
        additionalExposedHeaders: ['x-ratelimit-limit', 'x-ratelimit-remaining'],
        maxAge: 86400,
      },
      validate: {
        // Reject unknown query/body keys so typos surface as 400s, not silent ignores.
        options: { stripUnknown: false, abortEarly: false, allowUnknown: false },
      },
      security: {
        hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
        xframe: 'deny',
        xss: 'enabled',
        noSniff: true,
      },
    },
  })

  server.ext('onRequest', (request, h) => {
    // Hapi's built-in CORS does not echo credentials on OPTIONS preflight.
    if (request.method === 'options') {
      const origin = request.headers.origin ? String(request.headers.origin) : undefined
      if (origin && allowedOrigins.includes(origin)) {
        const requestedHeaders = request.headers['access-control-request-headers']
        return h
          .response()
          .code(204)
          .header('access-control-allow-origin', origin)
          .header('access-control-allow-credentials', 'true')
          .header('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
          .header(
            'access-control-allow-headers',
            (requestedHeaders ? String(requestedHeaders) : null) ??
              'accept,authorization,content-type,origin,referer,user-agent',
          )
          .header('access-control-max-age', '86400')
          .takeover()
      }
    }
    return h.continue
  })

  await server.register(errorHandlingPlugin)

  // Request logging
  server.events.on('log', (event) => {
    logger.info({ msg: 'server log', tags: event.tags, data: event.data })
  })
  server.events.on('request', (request, event, tags) => {
    if (tags.error) {
      const response = request.response as { statusCode?: number } | undefined
      logger.error({
        msg: 'request error',
        method: request.method,
        path: request.path,
        statusCode: response?.statusCode,
        data: event.data,
      })
    }
  })

  server.route({
    method: 'GET',
    path: '/',
    options: { cache: { expiresIn: 60_000, privacy: 'public' } },
    handler: () => ({
      success: true,
      data: {
        service: 'atlas-api',
        version: '1.0.0',
        docs: '/api/v1/docs',
        openapi: '/api/v1/openapi.json',
        endpoints: {
          health: `${API_PREFIX}/health`,
          home: `${API_PREFIX}/home`,
          destinations: `${API_PREFIX}/destinations`,
          packages: `${API_PREFIX}/packages`,
          favorites: `${API_PREFIX}/favorites`,
          enquiries: `${API_PREFIX}/enquiries`,
          newsletter: `${API_PREFIX}/newsletter`,
          me: `${API_PREFIX}/me`,
          auth: '/api/auth',
        },
      },
    }),
  })

  server.route([
    ...healthRoutes,
    ...docsRoutes,
    ...homeRoutes,
    ...destinationRoutes,
    ...packageRoutes,
    ...meRoutes,
    ...favoriteRoutes,
    ...enquiryRoutes,
    ...newsletterRoutes,
    ...adminUploadRoutes,
    ...authRoutes,
  ])

  server.route({
    method: '*',
    path: '/{p*}',
    handler: (_request, h) =>
      h
        .response({
          success: false,
          error: { code: 'NOT_FOUND', message: 'That API route does not exist.' },
        })
        .code(404),
  })

  return server
}
