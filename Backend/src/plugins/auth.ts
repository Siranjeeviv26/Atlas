import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { account, session, user, verification, profiles } from '../db/schema/index.js'
import { env, apiUrl, allowedOrigins, googleOAuthConfigured } from '../config/env.js'
import { emailService } from '../services/email.js'
import { logger } from '../utils/logger.js'

/**
 * Better Auth builds email links from its API baseURL (:4000). Sent as-is, a
 * click lands on the raw API and its post-verify redirect resolves against the
 * API origin. Rewrite to the frontend origin instead — its `/api/*` rewrite
 * proxies back to us, so the redirect (and the user) stays in the app.
 */
function toAppUrl(url: string): string {
  return url.startsWith(apiUrl) ? env.APP_URL + url.slice(apiUrl.length) : url
}

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: apiUrl,
  basePath: '/api/auth',
  trustedOrigins: allowedOrigins,

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day
    freshAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  emailAndPassword: {
    enabled: true,
    // Verification is enforced: sign-up skips auto sign-in, and sign-in for an
    // unverified account returns 403 EMAIL_NOT_VERIFIED (no session issued).
    // sendOnSignIn below re-sends the link on each blocked attempt so a user
    // who lost the first email can still get back in.
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({
      user: authUser,
      url,
    }: {
      user: { email: string; name: string }
      url: string
    }) => {
      await emailService.sendPasswordReset(authUser.email, authUser.name, toAppUrl(url))
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    // Re-send the verification email when an unverified user tries to sign in.
    sendOnSignIn: true,
    // Clicking the emailed link verifies the account AND signs the user in,
    // then redirects them to the callbackURL from the link.
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({
      user: authUser,
      url,
    }: {
      user: { email: string; name: string }
      url: string
      token: string
    }) => {
      await emailService.sendVerification(authUser.email, authUser.name, toAppUrl(url))
    },
  },

  ...(googleOAuthConfigured
    ? {
        socialProviders: {
          google: {
            clientId: env.GOOGLE_CLIENT_ID as string,
            clientSecret: env.GOOGLE_CLIENT_SECRET as string,
            scope: ['openid', 'email', 'profile'],
          },
        },
      }
    : {}),

  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          try {
            await db.insert(profiles).values({
              userId: createdUser.id,
              displayName: createdUser.name || createdUser.email.split('@')[0],
              username: null,
              avatarUrl: createdUser.image ?? null,
            })
          } catch (error) {
            logger.error({ err: error, userId: createdUser.id }, 'Failed to create profile')
          }

          if (createdUser.emailVerified) {
            await emailService.sendWelcome(createdUser.email, createdUser.name)
          }
        },
      },
      update: {
        after: async (updatedUser) => {
          if (!updatedUser.emailVerified) return

          const existing = await db.query.profiles.findFirst({
            where: eq(profiles.userId, updatedUser.id),
          })

          // Only welcome once — the flag lives on the profile row we control.
          if (existing && !existing.welcomedAt) {
            await db
              .update(profiles)
              .set({ welcomedAt: new Date() })
              .where(eq(profiles.id, existing.id))
            await emailService.sendWelcome(updatedUser.email, updatedUser.name)
          }
        },
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session

export const authEnabledProviders = {
  google: googleOAuthConfigured,
} as const
