'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, MailWarning } from 'lucide-react'
import { authClient, useAuth } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input, Label, FieldError } from '@/components/ui/input'
import { AuthLayout, AuthDivider } from '@/components/auth-layout'
import { GoogleSignIn } from '@/components/auth-social'

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})
type FormValues = z.infer<typeof schema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/account'
  const { refresh } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setUnverifiedEmail(null)
    setResendState('idle')
    const { error } = await authClient.signIn.email(values)
    if (error) {
      if (error.status === 403 || error.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(values.email)
        return
      }
      setServerError(error.message ?? 'Could not sign in. Check your details.')
      return
    }
    await refresh()
    router.push(next)
    router.refresh()
  }

  async function resend() {
    if (!unverifiedEmail || resendState !== 'idle') return
    setResendState('sending')
    const { error } = await authClient.sendVerificationEmail({
      email: unverifiedEmail,
      callbackURL: next,
    })
    setResendState(error ? 'idle' : 'sent')
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      heading="Sign in to Atlas"
      subheading="Your shortlist, saved enquiries, and trips — right where you left them."
      image="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=80"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-2.5" noValidate>
        <div>
          <Label htmlFor="email" required>
            Email
          </Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" required>
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="mb-1.5 text-[13px] font-medium text-teal-dark underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
          <FieldError message={errors.password?.message} />
        </div>

        {serverError ? <FieldError message={serverError} /> : null}

        {unverifiedEmail ? (
          <div
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <div className="flex gap-2.5">
              <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              <div className="space-y-3">
                <p>
                  Your email isn&apos;t verified yet. Check your inbox for the verification
                  link, or resend it.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resend}
                  disabled={resendState !== 'idle'}
                >
                  {resendState === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {resendState === 'sent' ? 'Verification email sent' : 'Resend verification email'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>

      <AuthDivider />

      <GoogleSignIn next={next} />

      <p className="mt-4 text-center text-sm text-ink-muted">
        New here?{' '}
        <Link href="/signup" className="font-medium text-teal-dark underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
