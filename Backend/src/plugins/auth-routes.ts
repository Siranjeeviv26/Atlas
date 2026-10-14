import type { Request as HapiRequest, ResponseToolkit, ServerRoute } from '@hapi/hapi'
import { auth, authEnabledProviders } from './auth.js'
import { apiUrl, allowedOrigins } from '../config/env.js'
import { RATE_LIMITS, enforceRateLimit } from '../services/rate-limit.js'
import { ok } from '../utils/api-response.js'
import { logger } from '../utils/logger.js'

/**
 * Better Auth exposes a WHATWG `Request => Response` handler. This plugin adapts
 * Hapi's raw Node request onto that interface so we keep a single source of
 * truth for sign-up, sign-in, OAuth, verification and password-reset flows.
 */

const AUTH_PATH = '/api/auth/{path*}'

const HOPI_HEADERS_TO_STRIP = new Set(['host', 'connection', 'content-length', 'transfer-encoding'])

/** Endpoints that get an extra-tight budget on top of the general auth limit. */
const STRICT_AUTH_ENDPOINTS: Array<{ match: RegExp; rule: typeof RATE_LIMITS.auth }> = [
  { match: /sign-up\/email/, rule: RATE_LIMITS.auth },
  { match: /sign-in\/email/, rule: RATE_LIMITS.auth },
  { match: /forget-password/, rule: RATE_LIMITS.authPasswordReset },
  { match: /reset-password/, rule: RATE_LIMITS.authPasswordReset },
  { match: /send-verification/, rule: RATE_LIMITS.authPasswordReset },
]

function buildForwardUrl(request: HapiRequest): string {
  const path = request.url.pathname + (request.url.search ?? '')
  return new URL(path, apiUrl).toString()
}

function toFetchRequest(request: HapiRequest): Request {
  const headers = new Headers()
  for (const [key, value] of Object.entries(request.headers)) {
    if (HOPI_HEADERS_TO_STRIP.has(key.toLowerCase())) continue
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(key, String(entry))
    } else {
      headers.set(key, String(value))
    }
  }

  // Better Auth validates `Origin`/`Referer` against trustedOrigins.
  if (!headers.has('origin')) headers.set('origin', allowedOrigins[0] ?? apiUrl)
  headers.set('x-forwarded-host', String(request.headers.host ?? new URL(apiUrl).host))

  const method = request.method.toUpperCase()
  const init: RequestInit = { method, headers, redirect: 'manual' }

  if (method !== 'GET' && method !== 'HEAD') {
    const payload = request.payload
    if (payload !== null && payload !== undefined) {
      if (Buffer.isBuffer(payload)) {
        init.body = new Uint8Array(payload)
      } else if (typeof payload === 'string') {
        init.body = payload
      } else {
        init.body = JSON.stringify(payload)
        if (!headers.has('content-type')) headers.set('content-type', 'application/json')
      }
    }
  }

  return new Request(buildForwardUrl(request), init)
}

function createAuthHandler() {
  return async (request: HapiRequest, h: ResponseToolkit) => {
    const endpoint = request.url.pathname

    for (const { match, rule } of STRICT_AUTH_ENDPOINTS) {
      if (match.test(endpoint)) {
        enforceRateLimit(request.info.remoteAddress, `auth:${match.source}`, rule)
      }
    }

    const upstream = await auth.handler(toFetchRequest(request))

    const upstreamBody = upstream.status === 204 ? '' : await upstream.text()
    const response = h.response(upstreamBody).code(upstream.status)

    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase()
      if (lower === 'content-length') return
      if (lower === 'set-cookie') {
        const existing = response.headers['set-cookie']
        const merged = existing
          ? [...(Array.isArray(existing) ? existing : [existing]), value]
          : [value]
        response.header(key, merged as unknown as string)
        return
      }
      response.header(key, value)
    })

    if (!upstream.ok && upstream.status >= 400) {
      logger.debug(
        { endpoint, status: upstream.status },
        'Better Auth returned a non-2xx response',
      )
    }

    return response
  }
}

const sharedOptions = {
  // Better Auth owns serialisation, status codes and cookies for this path.
  auth: false as const,
  cache: false as const,
} as const

export const authRoutes: ServerRoute[] = [
  {
    // GET-only proxy (Hapi forbids payload settings on routes that accept GET).
    method: 'GET',
    path: AUTH_PATH,
    options: { ...sharedOptions, handler: createAuthHandler() },
  },
  {
    // Body-carrying methods get a raw (unparsed) payload forwarded verbatim.
    method: ['POST', 'PUT', 'PATCH', 'DELETE'],
    path: AUTH_PATH,
    options: {
      ...sharedOptions,
      payload: {
        parse: false,
        output: 'data' as const,
        maxBytes: 2 * 1024 * 1024,
      },
      handler: createAuthHandler(),
    },
  },
  {
    method: 'GET',
    path: '/api/v1/auth/providers',
    options: {
      description: 'Which third-party sign-in providers are configured',
      tags: ['api', 'auth'],
      cache: false,
    },
    handler: async () => ok({ ...authEnabledProviders }),
  },
]

export const authPluginMeta = {
  basePath: '/api/auth',
  providers: authEnabledProviders,
} as const
