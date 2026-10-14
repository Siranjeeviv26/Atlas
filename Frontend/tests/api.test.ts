import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, apiData, ApiError, buildQuery } from '@/lib/api'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildQuery', () => {
  it('encodes defined values and skips empty ones', () => {
    expect(buildQuery({ page: 2, q: 'iceland', category: undefined, country: null, x: '' })).toBe(
      '?page=2&q=iceland',
    )
  })

  it('returns an empty string when nothing is set', () => {
    expect(buildQuery({ a: undefined, b: '' })).toBe('')
  })
})

describe('api', () => {
  it('returns the envelope on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ success: true, data: [{ id: '1' }] }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await api<{ id: string }[]>('/api/v1/destinations')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual([{ id: '1' }])
    }
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/destinations')
    expect(init.method).toBe('GET')
    expect(init.credentials).toBe('include')
  })

  it('sends JSON bodies for POST requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: null }))
    vi.stubGlobal('fetch', fetchMock)

    await api('/api/v1/newsletter/subscribe', {
      method: 'POST',
      body: { email: 'a@b.com' },
    })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.headers['content-type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual({ email: 'a@b.com' })
  })

  it('throws ApiError with code and status from a failure envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          { success: false, error: { code: 'NOT_FOUND', message: 'No such destination.' } },
          404,
        ),
      ),
    )

    const error = await api('/api/v1/destinations/nope').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    const apiError = error as ApiError
    expect(apiError.status).toBe(404)
    expect(apiError.code).toBe('NOT_FOUND')
    expect(apiError.message).toBe('No such destination.')
  })

  it('maps non-envelope responses to a generic failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('oops', { status: 502 })))

    const error = await api('/api/v1/home').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(502)
    expect((error as ApiError).code).toBe('REQUEST_FAILED')
  })
})

describe('apiData', () => {
  it('unwraps the data field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { slug: 'iceland' } })),
    )

    await expect(apiData<{ slug: string }>('/api/v1/destinations/iceland')).resolves.toEqual({
      slug: 'iceland',
    })
  })

  it('throws when the envelope is a failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ success: false, error: { code: 'FORBIDDEN', message: 'nope' } }, 403),
      ),
    )

    await expect(apiData('/api/v1/me')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    })
  })
})
