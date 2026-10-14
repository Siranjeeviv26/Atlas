import Boom from '@hapi/boom'

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'

export class ApiError extends Error {
  readonly statusCode: number
  readonly code: ErrorCode
  readonly details?: unknown

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }

  toBoom(): Boom.Boom {
    return boomFrom(this.statusCode, this.code, this.message, this.details)
  }
}

/**
 * Builds a Boom error that carries our envelope's error code.
 * Always throw Boom: Hapi's `Boom.boomify()` forces any plain Error to 500,
 * which would silently swallow the real status code.
 */
export function boomFrom(
  statusCode: number,
  code: ErrorCode,
  message: string,
  details?: unknown,
): Boom.Boom {
  return new Boom.Boom(message, {
    statusCode,
    data: { code, details },
  })
}

export const badRequest = (message: string, details?: unknown) =>
  boomFrom(400, 'VALIDATION_ERROR', message, details)

export const unauthorized = (message = 'Authentication is required.') =>
  boomFrom(401, 'UNAUTHORIZED', message)

export const forbidden = (message = 'You do not have permission to perform this action.') =>
  boomFrom(403, 'FORBIDDEN', message)

export const notFound = (message = 'The requested resource was not found.') =>
  boomFrom(404, 'NOT_FOUND', message)

export const conflict = (message: string, details?: unknown) =>
  boomFrom(409, 'CONFLICT', message, details)

export const rateLimited = (
  message = 'Too many requests. Please slow down and try again shortly.',
) => boomFrom(429, 'RATE_LIMITED', message)

export const payloadTooLarge = (message = 'The uploaded file is too large.') =>
  boomFrom(413, 'PAYLOAD_TOO_LARGE', message)

export const unsupportedMediaType = (message = 'That media type is not supported.') =>
  boomFrom(415, 'UNSUPPORTED_MEDIA_TYPE', message)

export const serviceUnavailable = (message: string) =>
  boomFrom(503, 'SERVICE_UNAVAILABLE', message)

export const internalError = (message = 'Something went wrong on our end.') =>
  boomFrom(500, 'INTERNAL_ERROR', message)

/** Normalises anything thrown inside a route into a Boom error. */
export function toBoom(error: unknown): Boom.Boom {
  if (Boom.isBoom(error)) return error
  if (error instanceof ApiError) return error.toBoom()
  if (error instanceof Error) {
    const anyError = error as Error & { statusCode?: number; code?: string }
    if (anyError.name === 'ValidationError') {
      return boomFrom(400, 'VALIDATION_ERROR', anyError.message)
    }
    const status = Number(anyError.statusCode)
    if (Number.isInteger(status) && status >= 400 && status < 500) {
      return boomFrom(status, 'VALIDATION_ERROR', anyError.message)
    }
    return Boom.badImplementation(error.message)
  }
  return Boom.badImplementation('Unexpected error')
}
