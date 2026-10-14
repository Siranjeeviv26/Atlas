import { describe, expect, it } from 'vitest'
import { cn, durationLabel, formatDate, formatPrice, titleCase } from '@/lib/utils'

describe('cn', () => {
  it('merges class names and dedupes tailwind conflicts', () => {
    const result = cn('px-4', 'px-6', 'text-sm')
    expect(result).toContain('px-6')
    expect(result).toContain('text-sm')
    expect(result).not.toContain('px-4')
  })

  it('keeps conditional classes only when truthy', () => {
    expect(cn('base', false && 'hidden', undefined)).toBe('base')
    expect(cn('base', true && 'hidden')).toBe('base hidden')
  })
})

describe('formatPrice', () => {
  it('converts cents to a whole-dollar currency string', () => {
    expect(formatPrice(165000)).toBe('$1,650')
    expect(formatPrice(895000, 'USD')).toBe('$8,950')
  })

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('$0')
  })
})

describe('durationLabel', () => {
  it('renders days and nights when nights is known', () => {
    expect(durationLabel(8, 7)).toBe('8 days / 7 nights')
  })

  it('renders days only when nights is missing', () => {
    expect(durationLabel(12)).toBe('12 days')
  })
})

describe('titleCase', () => {
  it('title-cases hyphenated, snake_case and spaced values', () => {
    expect(titleCase('food-and-wine')).toBe('Food And Wine')
    expect(titleCase('self_drive')).toBe('Self Drive')
    expect(titleCase('expedition')).toBe('Expedition')
  })
})

describe('formatDate', () => {
  it('formats ISO strings as month day, year', () => {
    expect(formatDate('2026-03-05T12:00:00.000Z')).toMatch(/Mar 5, 2026|Mar 4, 2026/)
  })

  it('returns empty string for null or invalid input', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate('not-a-date')).toBe('')
  })
})
