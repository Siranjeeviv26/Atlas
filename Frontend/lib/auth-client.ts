'use client'

import { createAuthClient } from 'better-auth/react'
import { useCallback } from 'react'

/**
 * Better Auth's React client. All calls go to same-origin `/api/auth/*`,
 * which Next rewrites to the Hapi server that hosts the auth handler.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || undefined,
})

export const { useSession, signIn, signUp, signOut } = authClient

export interface SessionUser {
  id: string
  email: string
  name: string
  image?: string | null
  emailVerified?: boolean
  createdAt?: string
}

export interface SessionData {
  session: { token: string; expiresAt?: string | [Date, number] } | null
  user: SessionUser | null
}

export function useAuth() {
  const { data, isPending, error, refetch } = useSession()

  const refresh = useCallback(() => refetch(), [refetch])

  const logout = useCallback(async () => {
    await signOut()
    await refetch()
  }, [refetch])

  return {
    session: data?.session ?? null,
    user: (data?.user ?? null) as SessionUser | null,
    isAuthenticated: Boolean(data?.user),
    isLoading: isPending,
    error,
    refresh,
    logout,
  }
}
