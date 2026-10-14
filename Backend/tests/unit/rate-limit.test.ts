import { describe, expect, it } from 'vitest'
import { RateLimiter, RATE_LIMITS, clientKey } from '../../src/services/rate-limit.js'

describe('RateLimiter', () => {
  it('allows up to the limit inside a window', () => {
    const limiter = new RateLimiter()
    const rule = { limit: 3, windowMs: 60_000 }

    expect(limiter.hit('a', rule).allowed).toBe(true)
    expect(limiter.hit('a', rule).allowed).toBe(true)
    const third = limiter.hit('a', rule)
    expect(third.allowed).toBe(true)
    expect(third.remaining).toBe(0)

    const fourth = limiter.hit('a', rule)
    expect(fourth.allowed).toBe(false)
  })

  it('tracks keys independently', () => {
    const limiter = new RateLimiter()
    const rule = { limit: 1, windowMs: 60_000 }

    expect(limiter.hit('a', rule).allowed).toBe(true)
    expect(limiter.hit('b', rule).allowed).toBe(true)
    expect(limiter.hit('a', rule).allowed).toBe(false)
  })

  it('starts a fresh window after resetAt passes', () => {
    const limiter = new RateLimiter()
    const rule = { limit: 1, windowMs: 1 }

    expect(limiter.hit('a', rule).allowed).toBe(true)
    expect(limiter.hit('a', rule).allowed).toBe(false)

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(limiter.hit('a', rule).allowed).toBe(true)
        resolve()
      }, 10)
    })
  })

  it('reset() clears a key immediately', () => {
    const limiter = new RateLimiter()
    const rule = { limit: 1, windowMs: 60_000 }

    limiter.hit('a', rule)
    expect(limiter.hit('a', rule).allowed).toBe(false)
    limiter.reset('a')
    expect(limiter.hit('a', rule).allowed).toBe(true)
  })

  it('stays bounded when maxKeys is exceeded', () => {
    const limiter = new RateLimiter({ maxKeys: 4 })
    const rule = { limit: 5, windowMs: 60_000 }

    for (let i = 0; i < 40; i += 1) {
      limiter.hit(`key-${i}`, rule)
    }

    // Still functional after pruning.
    expect(limiter.hit('fresh-key', rule).allowed).toBe(true)
  })
})

describe('clientKey', () => {
  it('scopes the ip', () => {
    expect(clientKey('1.2.3.4', 'auth')).toBe('auth:1.2.3.4')
  })

  it('handles a missing ip', () => {
    expect(clientKey(undefined, 'auth')).toBe('auth:unknown')
  })
})

describe('RATE_LIMITS', () => {
  it('are all sane', () => {
    for (const rule of Object.values(RATE_LIMITS)) {
      expect(rule.limit).toBeGreaterThan(0)
      expect(rule.windowMs).toBeGreaterThan(0)
    }
    expect(RATE_LIMITS.auth.limit).toBeLessThan(RATE_LIMITS.general.limit)
  })
})
