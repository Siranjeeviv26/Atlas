import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function durationLabel(days: number, nights?: number): string {
  return nights === undefined ? `${days} days` : `${days} days / ${nights} nights`
}

export function titleCase(value: string): string {
  return value
    .split(/[-_\s]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
