'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
})
type FormValues = z.infer<typeof schema>

export function NewsletterForm({
  className,
  tone = 'light',
  source = 'site',
}: {
  className?: string
  tone?: 'light' | 'dark'
  source?: string
}) {
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      await api('/api/v1/newsletter/subscribe', {
        method: 'POST',
        body: { email: values.email, source },
      })
      setDone(true)
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Something went wrong. Try again shortly.',
      )
    }
  }

  if (done) {
    return (
      <p
        className={cn(
          'flex items-center gap-2 text-sm font-medium',
          tone === 'dark' ? 'text-teal-light' : 'text-teal-dark',
          className,
        )}
      >
        <Check className="h-4 w-4" />
        You are on the list. See you in your inbox.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('w-full', className)} noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label htmlFor={`newsletter-email-${source}`} className="sr-only">
            Email address
          </label>
          <Input
            id={`newsletter-email-${source}`}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={Boolean(errors.email) || undefined}
            className={
              tone === 'dark'
                ? 'border-midnight-600 bg-midnight-800 text-on-dark placeholder:text-on-dark-muted/70'
                : undefined
            }
            {...register('email')}
          />
        </div>
        <Button type="submit" disabled={isSubmitting} size="md">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Subscribe
        </Button>
      </div>
      {errors.email ? (
        <p role="alert" className="mt-2 text-[13px] text-clay">
          {errors.email.message}
        </p>
      ) : null}
      {serverError ? (
        <p role="alert" className="mt-2 text-[13px] text-clay">
          {serverError}
        </p>
      ) : null}
    </form>
  )
}
