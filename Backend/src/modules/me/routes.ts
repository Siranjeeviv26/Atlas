import type { ServerRoute } from '@hapi/hapi'
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { profiles, user } from '../../db/schema/index.js'
import { updateProfilePayload } from '../../validation/schemas.js'
import { ok } from '../../utils/api-response.js'
import { conflict, notFound } from '../../utils/errors.js'
import { requireUser, resolveRequestUser } from '../../plugins/request-context.js'
import { emailService } from '../../services/email.js'

function serializeProfile(requestUser: NonNullable<Awaited<ReturnType<typeof resolveRequestUser>>>) {
  return {
    id: requestUser.profile.id,
    name: requestUser.name,
    email: requestUser.email,
    emailVerified: requestUser.emailVerified,
    image: requestUser.image,
    displayName: requestUser.profile.displayName,
    username: requestUser.profile.username,
    bio: requestUser.profile.bio,
    phone: requestUser.profile.phone,
    country: requestUser.profile.country,
    homeAirport: requestUser.profile.homeAirport,
    avatarUrl: requestUser.profile.avatarUrl,
    role: requestUser.profile.role,
  }
}

export const meRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/v1/me',
    options: {
      description: 'Current signed-in user with profile',
      tags: ['api', 'me'],
    },
    handler: async (request) => {
      const requestUser = await requireUser(request)
      return ok(serializeProfile(requestUser))
    },
  },
  {
    method: 'PATCH',
    path: '/api/v1/me',
    options: {
      description: 'Update the signed-in user profile',
      tags: ['api', 'me'],
      validate: { payload: updateProfilePayload },
    },
    handler: async (request) => {
      const requestUser = await requireUser(request)
      const payload = request.payload as Record<string, unknown>

      const hasUsername = Object.prototype.hasOwnProperty.call(payload, 'username')
      const username = typeof payload.username === 'string' && payload.username.trim()
        ? payload.username.trim().toLowerCase()
        : null

      if (hasUsername && username) {
        const clash = await db
          .select({ id: profiles.id })
          .from(profiles)
          .where(eq(profiles.username, username))
          .limit(1)
        if (clash.length && clash[0].id !== requestUser.profile.id) {
          throw conflict('That username is already taken.', { field: 'username' })
        }
      }

      const patch: Partial<typeof profiles.$inferInsert> = {}
      if (payload.displayName !== undefined) patch.displayName = String(payload.displayName)
      if (hasUsername) patch.username = username
      if (payload.bio !== undefined) patch.bio = payload.bio === '' ? null : String(payload.bio)
      if (payload.phone !== undefined) patch.phone = payload.phone === '' ? null : String(payload.phone)
      if (payload.country !== undefined)
        patch.country = payload.country === '' ? null : String(payload.country)
      if (payload.homeAirport !== undefined)
        patch.homeAirport = payload.homeAirport === '' ? null : String(payload.homeAirport)
      if (payload.avatarUrl !== undefined)
        patch.avatarUrl = payload.avatarUrl === '' ? null : String(payload.avatarUrl)

      if (Object.keys(patch).length) {
        await db.update(profiles).set(patch).where(eq(profiles.id, requestUser.profile.id))
      }

      // Keep the Better Auth user row in sync for name / image.
      const authPatch: Partial<typeof user.$inferInsert> = {}
      if (payload.displayName !== undefined) authPatch.name = String(payload.displayName)
      if (payload.avatarUrl !== undefined)
        authPatch.image = payload.avatarUrl === '' ? null : String(payload.avatarUrl)
      if (Object.keys(authPatch).length) {
        await db.update(user).set(authPatch).where(eq(user.id, requestUser.id))
      }

      // Re-read so the response reflects persisted state.
      request.requestUser = undefined
      const refreshed = await requireUser(request)
      return ok(serializeProfile(refreshed))
    },
  },
  {
    method: 'POST',
    path: '/api/v1/me/resend-verification',
    options: {
      description: 'Re-send the email verification link',
      tags: ['api', 'me'],
    },
    handler: async (request) => {
      const requestUser = await requireUser(request)
      if (requestUser.emailVerified) {
        return ok({ alreadyVerified: true })
      }

      await emailService.sendVerification(requestUser.email, requestUser.name, buildVerifyUrl())
      return ok({ sent: true })
    },
  },
]

function buildVerifyUrl(): string {
  // Better Auth issues the token; this endpoint is a convenience that asks the
  // client to restart the flow from the sign-in screen where the link is sent.
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
  return `${appUrl}/verify-email`
}
