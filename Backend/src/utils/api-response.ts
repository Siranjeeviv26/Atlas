export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ApiResponse<T> {
  success: true
  data: T
  meta?: PaginationMeta | Record<string, unknown>
}

export interface ApiErrorBody {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export function ok<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> {
  return { success: true, data, ...(meta ? { meta } : {}) }
}

export function paginated<T>(
  items: T[],
  meta: PaginationMeta,
  extraMeta?: Record<string, unknown>,
): ApiResponse<T[]> & { meta: PaginationMeta & Record<string, unknown> } {
  return { success: true, data: items, meta: { ...meta, ...extraMeta } }
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}
