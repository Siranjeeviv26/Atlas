export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 12
export const MAX_LIMIT = 60

export interface NormalisedPage {
  page: number
  limit: number
  offset: number
}

export function normalisePagination(
  pageRaw: unknown,
  limitRaw: unknown,
  fallbackLimit = DEFAULT_LIMIT,
): NormalisedPage {
  const page = Math.max(1, Number(pageRaw) || DEFAULT_PAGE)
  const requested = Number(limitRaw) || fallbackLimit
  const limit = Math.min(MAX_LIMIT, Math.max(1, requested))
  return { page, limit, offset: (page - 1) * limit }
}
