import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  normalisePagination,
} from '../../src/utils/pagination.js'

describe('normalisePagination', () => {
  it('applies defaults for empty input', () => {
    expect(normalisePagination(undefined, undefined)).toEqual({
      page: 1,
      limit: DEFAULT_LIMIT,
      offset: 0,
    })
  })

  it('computes the offset from page and limit', () => {
    expect(normalisePagination(3, 10)).toEqual({ page: 3, limit: 10, offset: 20 })
    expect(normalisePagination('5', '7')).toEqual({ page: 5, limit: 7, offset: 28 })
  })

  it('clamps limit to the maximum', () => {
    expect(normalisePagination(1, 9999).limit).toBe(MAX_LIMIT)
    expect(normalisePagination(1, -5).limit).toBe(1)
    // 0 is falsy, so it falls back to the default limit rather than clamping to 1.
    expect(normalisePagination(1, 0).limit).toBe(DEFAULT_LIMIT)
    expect(normalisePagination(1, 0, 25).limit).toBe(25)
  })

  it('never lets page fall below 1', () => {
    expect(normalisePagination(0, 10).page).toBe(1)
    expect(normalisePagination(-3, 10).page).toBe(1)
    expect(normalisePagination('nope', 10).page).toBe(1)
    expect(normalisePagination(-3, 10).offset).toBe(0)
  })

  it('accepts a custom fallback limit', () => {
    expect(normalisePagination(undefined, undefined, 25).limit).toBe(25)
  })
})
