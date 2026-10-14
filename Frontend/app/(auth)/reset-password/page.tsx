'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Loader2, TriangleAlert } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input, Label, FieldError } from '@/components/ui/input'
import { AuthLayout } from '@/components/auth-layout'

const schema = z
  .object({
    newPassword: z.string().min(8, 'Use at least 8 characters.'),
    confirm: z.string(),
  })
  .refine((values) => values.newPassword === values.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm'],
  })
type FormValues = z.infer<typeof schema>

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const urlError = searchParams.get('error')

  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    if (!token) {
      setServerError('This link is missing its reset token. Request a new link.')
      return
    }
    setServerError(null)
    const { error } = await authClient.resetPassword({
      newPassword: values.newPassword,
      token,
    })
    if (error) {
      setServerError(error.message ?? 'Could not reset the password. Request a new link.')
      return
    }
    setDone(true)
    setTimeout(() => router.push('/login'), 1800)
  }

  // ── Success state ───────────────────────────────────────
  if (done) {
    return (
      <AuthLayout
        eyebrow="All set"
        heading="Password updated"
        subheading="Redirecting you to sign in…"
      >
        <div className="mt-8 rounded-2xl border border-sand bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal/10">
              <Check className="h-5 w-5 text-teal-dark" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">You&apos;re all set</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                Your password has been updated. You can now sign in with your new
                credentials.
              </p>
            </div>
          </div>
        </div>

        <Button asChild className="mt-6 w-full">
          <Link href="/login">Sign in now</Link>
        </Button>
      </AuthLayout>
    )
  }

  // ── Reset form ──────────────────────────────────────────
  return (
    <AuthLayout
      eyebrow="Password reset"
      heading="Set a new password"
      subheading="Choose a strong password you haven't used before."
    >
      {urlError ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-xl border border-clay/20 bg-clay/5 p-4 text-sm text-clay"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          This reset link is invalid or has expired. Request a fresh one.
        </p>
      ) : null}

      {!token && !urlError ? (
        <p className="mt-6 rounded-xl border border-sand bg-white p-4 text-sm text-ink-muted">
          Open the link from your email to land here with a valid token, or{' '}
          <Link href="/forgot-password" className="font-medium text-teal-dark underline-offset-4 hover:underline">
            request a new reset link
          </Link>
          .
        </p>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3" noValidate>
        <div>
          <Label htmlFor="new-password" required>
            New password
          </Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            {...register('newPassword')}
          />
          <FieldError message={errors.newPassword?.message} />
        </div>
        <div>
          <Label htmlFor="confirm-password" required>
            Confirm password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...register('confirm')}
          />
          <FieldError message={errors.confirm?.message} />
        </div>

        {serverError ? <FieldError message={serverError} /> : null}

        <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Update password
        </Button>
      </form>
    </AuthLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
