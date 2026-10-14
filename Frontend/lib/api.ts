import type { ApiErrorBody, Envelope, PaginationMeta, SuccessEnvelope } from './types'

/**
 * Browser calls stay same-origin (`/api/*` → Next rewrite → Hapi).
 * Server components have no origin, so they hit the same BACKEND_URL the
 * rewrite uses. NEXT_PUBLIC_API_URL overrides both.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window === 'undefined'
    ? process.env.BACKEND_URL || 'http://localhost:4000'
    : '')

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function isEnvelope(value: unknown): value is Envelope<unknown> {
  return typeof value === 'object' && value !== null && 'success' in value
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  cache?: RequestCache
  next?: { revalidate?: number | false; tags?: string[] }
}

async function parseResponse<T>(response: Response): Promise<Envelope<T>> {
  const text = await response.text()
  let payload: unknown
  try {
    payload = text ? JSON.parse(text) : {}
  } catch {
    payload = {}
  }

  if (!response.ok || !isEnvelope(payload) || payload.success === false) {
    const failure = payload as Partial<ApiErrorBody>
    throw new ApiError(
      response.status,
      failure.error?.code ?? 'REQUEST_FAILED',
      failure.error?.message ?? `Request failed with status ${response.status}.`,
      failure.error?.details,
    )
  }

  return payload as SuccessEnvelope<T>
}

/**
 * Thin fetch wrapper around the enveloped API. In dev the browser hits
 * same-origin `/api/*` (rewritten to the Hapi server), so cookies are
 * first-party; when NEXT_PUBLIC_API_URL is set we call that origin directly
 * and must send credentials.
 */
export async function api<T>(path: string, options: ApiRequestOptions = {}): Promise<Envelope<T>> {
  const { method = 'GET', body, signal, cache = 'no-store', next } = options

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: {
      accept: 'application/json',
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal,
    cache,
    ...(next ? { next } : {}),
  })

  return parseResponse<T>(response)
}

/** Unwraps `data`, throwing `ApiError` for any failure envelope. */
export async function apiData<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const envelope = await api<T>(path, options)
  if (!envelope.success) {
    throw new ApiError(500, 'REQUEST_FAILED', 'Malformed API response.')
  }
  return envelope.data
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export type { PaginationMeta }
