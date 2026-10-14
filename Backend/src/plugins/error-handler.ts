import type { Plugin, Request, ResponseToolkit } from '@hapi/hapi'
import Boom from '@hapi/boom'
import { env } from '../config/env.js'

function wantsHtml(request: Request): boolean {
  const accept = String(request.headers.accept ?? '')
  return accept.includes('text/html') && !accept.includes('application/json')
}

interface ErrorPayloadShape {
  success: false
  error: { code: string; message: string; details?: unknown }
  meta: { path: string; method: string; requestId: string }
}

function errorPayload(error: Boom.Boom, request: Request): ErrorPayloadShape {
  const data = (error.data ?? {}) as { code?: string; details?: unknown }
  const statusCode = error.output.statusCode
  const validationIssues = (error as unknown as { details?: unknown }).details

  const code =
    data.code ??
    (statusCode === 400
      ? 'VALIDATION_ERROR'
      : statusCode === 401
        ? 'UNAUTHORIZED'
        : statusCode === 403
          ? 'FORBIDDEN'
          : statusCode === 404
            ? 'NOT_FOUND'
            : statusCode === 409
              ? 'CONFLICT'
              : statusCode === 413
                ? 'PAYLOAD_TOO_LARGE'
                : statusCode === 429
                  ? 'RATE_LIMITED'
                  : statusCode >= 500
                    ? 'INTERNAL_ERROR'
                    : 'REQUEST_FAILED')

  const validationDetails =
    validationIssues !== undefined && Array.isArray(validationIssues)
      ? { issues: validationIssues }
      : undefined

  const details =
    data.details ??
    validationDetails ??
    (statusCode >= 500 && env.NODE_ENV !== 'production' ? { stack: error.stack } : undefined)

  return {
    success: false,
    error: {
      code,
      message: error.message,
      ...(details !== undefined ? { details } : {}),
    },
    meta: {
      path: request.path,
      method: request.method.toUpperCase(),
      requestId: request.info.id,
    },
  }
}

export const errorHandlingPlugin: Plugin<undefined> = {
  name: 'atlas-error-handling',
  register(server) {
    server.ext('onPreResponse', (request: Request, h: ResponseToolkit) => {
      const response = request.response

      if (!Boom.isBoom(response)) {
        return h.continue
      }

      const boom = response as Boom.Boom
      const safe =
        boom.output.statusCode >= 500 && env.NODE_ENV === 'production'
          ? Boom.badImplementation('Something went wrong on our end.')
          : boom

      if (wantsHtml(request)) {
        const status = safe.output.statusCode
        return h
          .response(
            `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${status}</title></head>` +
              `<body style="font-family:system-ui;background:#0B1220;color:#F7F4EE;display:grid;place-items:center;min-height:100vh;margin:0">` +
              `<main style="text-align:center;padding:2rem"><p style="letter-spacing:.2em;text-transform:uppercase;font-size:12px;color:#7DD3E8;margin:0 0 12px">Atlas</p>` +
              `<h1 style="font-size:3rem;margin:0 0 8px">${status}</h1>` +
              `<p style="color:#A8B2C4;margin:0 0 24px">${safe.message}</p>` +
              `<a href="/" style="color:#7DD3E8">Back to home</a></main></body></html>`,
          )
          .code(status)
      }

      request.log(['error'], {
        statusCode: safe.output.statusCode,
        code: (safe.data as { code?: string } | undefined)?.code,
        message: safe.message,
        stack: safe.stack,
      })

      return h.response(errorPayload(safe, request)).code(safe.output.statusCode)
    })
  },
}
