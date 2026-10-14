import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { sql, eq } from 'drizzle-orm'
import { db } from '../../src/db/index.js'
import { profiles, user } from '../../src/db/schema/index.js'
import { closeServer, getServer, sessionCookies } from '../helpers/server.js'

const TEST_EMAIL = `phase1-test-${Date.now()}@example.com`
const TEST_PASSWORD = 'Sup3rSecret!Pass'

let cookies: string[] = []

async function inject(options: {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  payload?: object | string
  headers?: Record<string, string>
}) {
  const server = await getServer()
  return server.inject(options)
}

/** The auth proxy forwards the body unparsed (`payload.parse: false`), so read it as text. */
function json<T>(result: unknown): T {
  if (typeof result === 'string') return JSON.parse(result) as T
  if (Buffer.isBuffer(result)) return JSON.parse(result.toString('utf8')) as T
  return result as T
}

describe('Better Auth proxy', () => {
  beforeAll(async () => {
    await getServer()
  })

  afterAll(async () => {
    try {
      await db.execute(sql`delete from account where user_id in (select id from "user" where email = ${TEST_EMAIL})`)
      await db.execute(sql`delete from session where user_id in (select id from "user" where email = ${TEST_EMAIL})`)
      await db.execute(sql`delete from profiles where user_id in (select id from "user" where email = ${TEST_EMAIL})`)
      await db.execute(sql`delete from "user" where email = ${TEST_EMAIL}`)
    } catch {
      // Cleanup is best-effort.
    }
    await closeServer()
  })

  it('rejects a sign-up with a weak password', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: { name: 'Weak', email: 'weak@example.com', password: 'short' },
    })

    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    expect(res.statusCode).toBeLessThan(500)
  })

  it('rejects a sign-up with a malformed email', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: { name: 'Bad', email: 'not-an-email', password: TEST_PASSWORD },
    })

    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    expect(res.statusCode).toBeLessThan(500)
  })

  it('creates a user but issues no session (verification required)', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: { name: 'Phase One Tester', email: TEST_EMAIL, password: TEST_PASSWORD },
    })

    expect(res.statusCode).toBe(200)
    cookies = sessionCookies(res.headers as Record<string, unknown>)
    expect(cookies.some((cookie) => cookie.startsWith('better-auth.'))).toBe(false)

    const body = json<{ user?: { email?: string }; token?: string | null }>(res.result)
    expect(body.user?.email).toBe(TEST_EMAIL)
    expect(body.token).toBeNull()
  })

  it('blocks sign-in until the email is verified', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    })

    expect(res.statusCode).toBe(403)
    const body = json<{ code?: string }>(res.result)
    expect(body.code).toBe('EMAIL_NOT_VERIFIED')
  })

  it('signs in after the verification link is used', async () => {
    // Better Auth email-verification tokens are stateless HS256 JWTs signed
    // with BETTER_AUTH_SECRET — mint one the same way the send hook does.
    const { SignJWT } = await import('jose')
    const token = await new SignJWT({ email: TEST_EMAIL.toLowerCase() })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
      .sign(new TextEncoder().encode(process.env.BETTER_AUTH_SECRET as string))

    const verify = await inject({
      method: 'GET',
      url: `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
    })
    expect(verify.statusCode).toBeGreaterThanOrEqual(200)
    expect(verify.statusCode).toBeLessThan(400)

    const res = await inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    })

    expect(res.statusCode).toBe(200)
    cookies = sessionCookies(res.headers as Record<string, unknown>)
    expect(cookies.length).toBeGreaterThan(0)
  })

  it('returns the session for the cookie', async () => {
    const res = await inject({
      method: 'GET',
      url: '/api/auth/get-session',
      headers: { cookie: cookies.join('; ') },
    })

    expect(res.statusCode).toBe(200)
    const body = json<{ session?: { token?: string }; user?: { email?: string } }>(res.result)
    expect(body.session?.token).toBeTruthy()
    expect(body.user?.email).toBe(TEST_EMAIL)
  })

  it('exposes /api/v1/me to the authenticated caller', async () => {
    const res = await inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { cookie: cookies.join('; ') },
    })

    expect(res.statusCode).toBe(200)
    const body = res.result as { success: boolean; data: { email?: string; role?: string } }
    expect(body.success).toBe(true)
    expect(body.data.email).toBe(TEST_EMAIL)
    expect(body.data.role).toBe('customer')
  })

  it('auto-creates a profile row for the new user', async () => {
    const rows = await db
      .select({ role: profiles.role })
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .where(eq(user.email, TEST_EMAIL))

    expect(rows.length).toBe(1)
    expect(rows[0].role).toBe('customer')
  })

  it('rejects an invalid password on sign-in', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      payload: { email: TEST_EMAIL, password: 'WrongPassword!123' },
    })

    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    expect(res.statusCode).toBeLessThan(500)
  })
})

describe('authenticated-only routes', () => {
  afterAll(closeServer)

  it('401s /api/v1/me without a session', async () => {
    const res = await inject({ method: 'GET', url: '/api/v1/me' })

    expect(res.statusCode).toBe(401)
    const body = res.result as { success: boolean; error: { code: string } }
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('401s /api/v1/favorites without a session', async () => {
    const res = await inject({ method: 'GET', url: '/api/v1/favorites' })

    expect(res.statusCode).toBe(401)
  })

  it('401s admin uploads without an admin session', async () => {
    const res = await inject({ method: 'GET', url: '/api/v1/admin/uploads/policy' })

    expect([401, 403]).toContain(res.statusCode)
  })
})
