import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { closeServer, getServer } from '../helpers/server.js'

const stamp = Date.now()

describe('POST /api/v1/newsletter/subscribe', () => {
  beforeAll(async () => {
    await getServer()
  })
  afterAll(closeServer)

  it('accepts a valid email and is idempotent', async () => {
    const email = `newsletter-${stamp}@example.com`
    const server = await getServer()

    const first = await server.inject({
      method: 'POST',
      url: '/api/v1/newsletter/subscribe',
      payload: { email },
    })
    expect(first.statusCode).toBe(200)
    expect((first.result as { success: boolean }).success).toBe(true)
    expect((first.result as { data: { alreadySubscribed: boolean } }).data.alreadySubscribed).toBe(
      false,
    )

    const second = await server.inject({
      method: 'POST',
      url: '/api/v1/newsletter/subscribe',
      payload: { email },
    })
    expect(second.statusCode).toBe(200)
    expect((second.result as { data: { alreadySubscribed: boolean } }).data.alreadySubscribed).toBe(
      true,
    )
  })

  it('rejects an invalid email', async () => {
    const res = await (await getServer()).inject({
      method: 'POST',
      url: '/api/v1/newsletter/subscribe',
      payload: { email: 'nope' },
    })

    expect(res.statusCode).toBe(400)
    expect((res.result as { success: boolean }).success).toBe(false)
  })

  it('rejects unknown payload keys', async () => {
    const res = await (await getServer()).inject({
      method: 'POST',
      url: '/api/v1/newsletter/subscribe',
      payload: { email: 'a@b.co', evil: true },
    })

    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    expect(res.statusCode).toBeLessThan(500)
  })
})

describe('POST /api/v1/enquiries', () => {
  afterAll(closeServer)

  it('creates an enquiry for a seeded package', async () => {
    const list = await (await getServer()).inject({
      method: 'GET',
      url: '/api/v1/packages?limit=1',
    })
    const pkg = (list.result as { data: { id: string; slug: string; title: string }[] }).data[0]

    const res = await (await getServer()).inject({
      method: 'POST',
      url: '/api/v1/enquiries',
      payload: {
        name: 'Phase One',
        email: `enquiry-${stamp}@example.com`,
        subject: `Availability for ${pkg.title}`,
        message: 'Is this route available in April for two travellers?',
        packageSlug: pkg.slug,
        travellers: 2,
      },
    })

    expect(res.statusCode).toBe(201)
    const body = res.result as { success: boolean; data: { id: string; status: string } }
    expect(body.success).toBe(true)
    expect(body.data.id).toBeTruthy()
    expect(body.data.status).toBe('pending')
  })

  it('rejects a missing name', async () => {
    const res = await (await getServer()).inject({
      method: 'POST',
      url: '/api/v1/enquiries',
      payload: { email: 'x@y.co', message: 'Hello there, I have a question about a trip.' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('rejects an invalid email', async () => {
    const res = await (await getServer()).inject({
      method: 'POST',
      url: '/api/v1/enquiries',
      payload: { name: 'X', email: 'not-email', message: 'Hello there, I have a question.' },
    })

    expect(res.statusCode).toBe(400)
  })
})
