import * as React from 'react'
import { cn } from '@/lib/utils'

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('surface overflow-hidden', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn('font-display text-xl leading-tight', className)}>{children}</h3>
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  )
}

export function Badge({
  className,
  children,
  tone = 'neutral',
}: {
  className?: string
  children: React.ReactNode
  tone?: 'neutral' | 'teal' | 'amber' | 'dark' | 'outline'
}) {
  const tones = {
    neutral: 'bg-parchment text-ink-muted',
    teal: 'bg-teal/12 text-teal-dark',
    amber: 'bg-amber/15 text-amber',
    dark: 'bg-midnight text-warm-white',
    outline: 'border border-sand bg-white/70 text-ink-muted backdrop-blur',
  } as const

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-xl', className)} />
}

export function Rating({
  value,
  count,
  className,
}: {
  value: number
  count?: number
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px]', className)}>
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-3.5 w-3.5 text-amber">
        <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.2l-4.94 2.59.95-5.49-4-3.9 5.53-.8L10 1.5z" />
      </svg>
      <span className="font-semibold text-ink">{value.toFixed(1)}</span>
      {count !== undefined ? (
        <span className="text-ink-faint">({count.toLocaleString()})</span>
      ) : null}
    </span>
  )
}
