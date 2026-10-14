import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { closeServer, getServer } from '../helpers/server.js'

describe('health routes', () => {
  beforeAll(async () => {
    await getServer()
  })

  afterAll(async () => {
    await closeServer()
  })

  it('GET / returns the service index envelope', async () => {
    const res = await (await getServer()).inject({ method: 'GET', url: '/' })

    expect(res.statusCode).toBe(200)
    const body = res.result as { success: boolean; data: { service: string } }
    expect(body.success).toBe(true)
    expect(body.data.service).toBe('atlas-api')
  })

  it('GET /api/v1/health reports ok', async () => {
    const res = await (await getServer()).inject({ method: 'GET', url: '/api/v1/health' })

    expect(res.statusCode).toBe(200)
    const body = res.result as { success: boolean; data: { status: string } }
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('ok')
  })

  it('GET /api/v1/health/ready checks the database', async () => {
    const res = await (await getServer()).inject({ method: 'GET', url: '/api/v1/health/ready' })

    expect([200, 503]).toContain(res.statusCode)
    const body = res.result as { success: boolean; data: { database?: string } }
    expect(typeof body.success).toBe('boolean')
  })

  it('unknown routes return a structured 404 envelope', async () => {
    const res = await (await getServer()).inject({ method: 'GET', url: '/api/v1/does-not-exist' })

    expect(res.statusCode).toBe(404)
    const body = res.result as { success: boolean; error: { code: string } }
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })
})

describe('API docs', () => {
  afterAll(closeServer)

  it('serves a valid OpenAPI document', async () => {
    const res = await (await getServer()).inject({
      method: 'GET',
      url: '/api/v1/openapi.json',
    })

    expect(res.statusCode).toBe(200)
    const doc = res.result as {
      openapi: string
      info: { title: string; version: string }
      paths: Record<string, unknown>
      components: { schemas: Record<string, unknown> }
    }

    expect(doc.openapi).toMatch(/^3\./)
    expect(doc.info.title).toBe('Atlas API')
    expect(Object.keys(doc.paths).length).toBeGreaterThan(20)
    expect(doc.paths['/api/v1/destinations']).toBeDefined()
    expect(doc.paths['/api/v1/packages/{slug}']).toBeDefined()
    expect(doc.paths['/api/auth/sign-in/email']).toBeDefined()
    expect(doc.components.schemas.ErrorEnvelope).toBeDefined()
  })

  it('serves the Swagger UI shell', async () => {
    const res = await (await getServer()).inject({ method: 'GET', url: '/api/v1/docs' })

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(String(res.result)).toContain('swagger-ui-bundle.js')
  })
})

describe('CORS preflight', () => {
  it('answers OPTIONS with credentials enabled for allowed origins', async () => {
    const res = await (await getServer()).inject({
      method: 'OPTIONS',
      url: '/api/v1/destinations',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'content-type',
      },
    })

    expect(res.statusCode).toBe(204)
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000')
    expect(res.headers['access-control-allow-credentials']).toBe('true')
    expect(String(res.headers['access-control-allow-methods'])).toContain('POST')
  })

  it('ignores disallowed origins', async () => {
    const res = await (await getServer()).inject({
      method: 'OPTIONS',
      url: '/api/v1/destinations',
      headers: { origin: 'https://evil.example' },
    })

    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })
})
