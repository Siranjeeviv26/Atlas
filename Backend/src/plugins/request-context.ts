import type { Request } from '@hapi/hapi'
import { eq } from 'drizzle-orm'
import { auth, type Session } from './auth.js'
import { db } from '../db/index.js'
import { profiles, user } from '../db/schema/index.js'
import { forbidden, unauthorized } from '../utils/errors.js'

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
}

export interface RequestUser extends AuthenticatedUser {
  profile: {
    id: string
    displayName: string | null
    username: string | null
    bio: string | null
    phone: string | null
    country: string | null
    homeAirport: string | null
    avatarUrl: string | null
    role: string
  }
}

declare module '@hapi/hapi' {
  interface Request {
    authSession?: Session | null
    requestUser?: RequestUser | null
  }
}

function headerBag(request: Request): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(key, String(entry))
    } else {
      headers.set(key, String(value))
    }
  }
  return headers
}

/** Resolves the Better Auth session for a Hapi request (null when signed out). */
export async function resolveSession(request: Request): Promise<Session | null> {
  if (request.authSession !== undefined) return request.authSession

  try {
    const result = await auth.api.getSession({ headers: headerBag(request) })
    request.authSession = (result as Session | null) ?? null
  } catch (error) {
    request.log(['auth', 'error'], { err: error })
    request.authSession = null
  }

  return request.authSession
}

export async function resolveRequestUser(request: Request): Promise<RequestUser | null> {
  if (request.requestUser !== undefined) return request.requestUser

  const session = await resolveSession(request)
  if (!session?.user) {
    request.requestUser = null
    return null
  }

  const rows = await db
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      username: profiles.username,
      bio: profiles.bio,
      phone: profiles.phone,
      country: profiles.country,
      homeAirport: profiles.homeAirport,
      avatarUrl: profiles.avatarUrl,
      role: profiles.role,
      userId: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
    })
    .from(profiles)
    .innerJoin(user, eq(profiles.userId, user.id))
    .where(eq(profiles.userId, session.user.id))
    .limit(1)

  const row = rows[0]
  if (!row) {
    request.requestUser = null
    return null
  }

  const requestUser: RequestUser = {
    id: row.userId,
    name: row.name,
    email: row.email,
    emailVerified: row.emailVerified,
    image: row.image,
    profile: {
      id: row.id,
      displayName: row.displayName,
      username: row.username,
      bio: row.bio,
      phone: row.phone,
      country: row.country,
      homeAirport: row.homeAirport,
      avatarUrl: row.avatarUrl,
      role: row.role,
    },
  }

  request.requestUser = requestUser
  return requestUser
}

export async function requireUser(request: Request): Promise<RequestUser> {
  const found = await resolveRequestUser(request)
  if (!found) throw unauthorized('You must be signed in to do that.')
  return found
}

export async function requireAdmin(request: Request): Promise<RequestUser> {
  const requestUser = await requireUser(request)
  if (requestUser.profile.role !== 'admin') {
    throw forbidden('Administrator access is required.')
  }
  return requestUser
}
