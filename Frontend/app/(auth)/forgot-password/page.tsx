'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Check, Loader2, Mail } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input, Label, FieldError } from '@/components/ui/input'
import { AuthLayout } from '@/components/auth-layout'

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
})
type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      // Absolute: Better Auth's reset callback resolves this server-side
      // against the API origin — a relative path would land on :4000.
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setServerError(error.message ?? 'Could not start the reset flow. Try again.')
      return
    }
    setSent(true)
  }

  // ── Sent state ──────────────────────────────────────────
  if (sent) {
    return (
      <AuthLayout
        eyebrow="Check your inbox"
        heading="Reset link on its way"
        subheading="If an account exists for that address, a secure reset link is in your inbox. It expires in one hour."
        image="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80"
      >
        <div className="mt-8 rounded-2xl border border-sand bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal/10">
              <Check className="h-5 w-5 text-teal-dark" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Link sent successfully</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                Open the email and click the link to set a new password. Didn&apos;t
                receive it? Check your spam folder or try again below.
              </p>
            </div>
          </div>
        </div>

        <Button asChild variant="outline" className="mt-6 w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>

        <p className="mt-8 text-center text-sm text-ink-muted">
          <button
            type="button"
            onClick={() => setSent(false)}
            className="inline-flex items-center gap-1.5 font-medium text-teal-dark underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Try a different email
          </button>
        </p>
      </AuthLayout>
    )
  }

  // ── Request form ────────────────────────────────────────
  return (
    <AuthLayout
      eyebrow="Password reset"
      heading="Reset your password"
      subheading="Enter the email you signed up with and we'll send you a one-time link to set a new password."
      image="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-2.5" noValidate>
        <div>
          <Label htmlFor="email" required>
            Email
          </Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>

        {serverError ? <FieldError message={serverError} /> : null}

        <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" aria-hidden />
          )}
          Send reset link
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-ink-muted">
        Remembered it?{' '}
        <Link href="/login" className="font-medium text-teal-dark underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
