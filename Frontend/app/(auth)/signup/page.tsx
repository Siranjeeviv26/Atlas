'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, MailCheck, ArrowLeft } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input, Label, FieldError } from '@/components/ui/input'
import { AuthLayout, AuthDivider } from '@/components/auth-layout'
import { GoogleSignIn } from '@/components/auth-social'

const schema = z
  .object({
    name: z.string().min(2, 'Tell us your name.'),
    email: z.string().email('Enter a valid email address.'),
    password: z.string().min(8, 'Use at least 8 characters.'),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm'],
  })
type FormValues = z.infer<typeof schema>

export default function SignupPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null)
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setResendState('idle')
    const { data, error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      // Verification email links land here after the click.
      callbackURL: '/account',
    })
    if (error) {
      setServerError(error.message ?? 'Could not create your account.')
      return
    }
    // token is null while verification is enforced: no session yet.
    if (data && !data.token) {
      setVerifyEmail(values.email)
      return
    }
    setServerError('Could not create your account. Please try again.')
  }

  async function resend() {
    if (!verifyEmail || resendState !== 'idle') return
    setResendState('sending')
    const { error } = await authClient.sendVerificationEmail({
      email: verifyEmail,
      callbackURL: '/account',
    })
    setResendState(error ? 'idle' : 'sent')
  }

  // ── Check-your-inbox state ──────────────────────────────
  if (verifyEmail) {
    return (
      <AuthLayout
        eyebrow="Almost there"
        heading="Check your inbox"
        subheading="Click the link we just sent to activate your account — it also signs you straight in."
        image="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80"
      >
        <div className="mt-8 rounded-2xl border border-sand bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal/10">
              <MailCheck className="h-5 w-5 text-teal-dark" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">{verifyEmail}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                The verification link expires in 24 hours. Check your spam folder if
                it doesn&apos;t appear within a few minutes.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={resend}
          variant="outline"
          className="mt-6 w-full"
          disabled={resendState !== 'idle'}
        >
          {resendState === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {resendState === 'sent' ? 'Verification email sent' : 'Resend verification email'}
        </Button>

        <p className="mt-8 text-center text-sm text-ink-muted">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-medium text-teal-dark underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to sign in
          </Link>
        </p>
      </AuthLayout>
    )
  }

  // ── Sign-up form ────────────────────────────────────────
  return (
    <AuthLayout
      eyebrow="Join Atlas"
      heading="Create your account"
      subheading="Free to join — start your shortlist today."
      image="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-2.5" noValidate>
        <div>
          <Label htmlFor="name" required>
            Full name
          </Label>
          <Input id="name" autoComplete="name" placeholder="Alex Rivera" {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <Label htmlFor="email" required>
            Email
          </Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="password" required>
            Password
          </Label>
          <Input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" {...register('password')} />
          <FieldError message={errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="confirm" required>
            Confirm password
          </Label>
          <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" {...register('confirm')} />
          <FieldError message={errors.confirm?.message} />
        </div>

        {serverError ? <FieldError message={serverError} /> : null}

        <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create account
        </Button>
      </form>

      <AuthDivider />

      <GoogleSignIn next="/account" />

      <p className="mt-4 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-teal-dark underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
