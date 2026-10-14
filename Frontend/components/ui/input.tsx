import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-xl border border-sand bg-white px-3.5 text-sm text-ink shadow-none transition-colors',
        'placeholder:text-ink-faint hover:border-ink-faint/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-28 w-full rounded-xl border border-sand bg-white px-4 py-3 text-[15px] text-ink transition-colors',
      'placeholder:text-ink-faint hover:border-ink-faint/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        'h-11 w-full appearance-none rounded-xl border border-sand bg-white px-4 pr-10 text-[15px] text-ink transition-colors',
        'hover:border-ink-faint/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      fill="none"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
    >
      <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  </div>
))
Select.displayName = 'Select'

export function Label({
  className,
  children,
  htmlFor,
  required,
}: {
  className?: string
  children: React.ReactNode
  htmlFor?: string
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('mb-1 block text-[13px] font-medium text-ink', className)}
    >
      {children}
      {required ? <span className="ml-0.5 text-clay">*</span> : null}
    </label>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1.5 text-[13px] text-clay">
      {message}
    </p>
  )
}
