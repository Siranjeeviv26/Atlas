'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { apiData } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

interface Providers {
  google: boolean
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.9h5.35c-.5 2.5-2.6 3.9-5.35 3.9a5.9 5.9 0 1 1 0-11.8c1.45 0 2.75.55 3.75 1.45l2.15-2.15A8.9 8.9 0 1 0 12 20.9c4.75 0 8.85-3.35 8.85-8.9 0-.3-.05-.6-.1-.9Z"
      />
    </svg>
  )
}

/**
 * Google sign-in. The button is always present; until OAuth credentials are
 * configured on the API it is disabled with an explanatory hint, so nothing is
 * a dead click.
 */
export function GoogleSignIn({ next = '/' }: { next?: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const { data: providers } = useQuery({
    queryKey: ['auth-providers'],
    queryFn: () => apiData<Providers>('/api/v1/auth/providers'),
    staleTime: 5 * 60_000,
    retry: 1,
  })

  const enabled = Boolean(providers?.google)

  async function handleClick() {
    setError(null)
    setPending(true)
    const { error: signInError } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: next,
    })
    setPending(false)
    if (signInError) {
      setError(signInError.message ?? 'Google sign-in failed. Try again.')
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full"
        disabled={!enabled || pending}
        title={enabled ? 'Continue with Google' : 'Google OAuth is not configured on this server'}
        onClick={handleClick}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="h-4 w-4" />
        )}
        Continue with Google
      </Button>
      {!enabled ? (
        <p className="text-center text-[11px] text-ink-faint">
          Google sign-in activates once OAuth credentials are added.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-center text-[13px] text-clay">
          {error}
        </p>
      ) : null}
    </div>
  )
}
