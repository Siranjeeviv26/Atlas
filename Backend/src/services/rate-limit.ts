import { rateLimited } from '../utils/errors.js'

interface Bucket {
  count: number
  resetAt: number
}

export interface RateLimitRule {
  /** Maximum number of requests allowed inside the window. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

const DEFAULT_RULE: RateLimitRule = { limit: 120, windowMs: 60_000 }

export const RATE_LIMITS = {
  auth: { limit: 20, windowMs: 60_000 },
  authPasswordReset: { limit: 5, windowMs: 15 * 60_000 },
  publicSubmission: { limit: 10, windowMs: 10 * 60_000 },
  uploads: { limit: 40, windowMs: 60_000 },
  general: { limit: 300, windowMs: 60_000 },
} satisfies Record<string, RateLimitRule>

/**
 * Small in-memory sliding-window counter. Suitable for a single-node deployment;
 * swap for a shared store (Redis / Catbox) when scaling horizontally.
 */
export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>()
  private readonly maxKeys: number

  constructor(options: { maxKeys?: number } = {}) {
    this.maxKeys = options.maxKeys ?? 20_000
  }

  hit(key: string, rule: RateLimitRule = DEFAULT_RULE): RateLimitResult {
    const now = Date.now()
    this.prune(now)

    const bucket = this.buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + rule.windowMs })
      return {
        allowed: true,
        remaining: rule.limit - 1,
        resetAt: now + rule.windowMs,
        limit: rule.limit,
      }
    }

    bucket.count += 1
    return {
      allowed: bucket.count <= rule.limit,
      remaining: Math.max(0, rule.limit - bucket.count),
      resetAt: bucket.resetAt,
      limit: rule.limit,
    }
  }

  reset(key: string): void {
    this.buckets.delete(key)
  }

  private prune(now: number): void {
    if (this.buckets.size < this.maxKeys) return
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key)
    }
    // Still full: drop the oldest quarter of entries to stay bounded.
    if (this.buckets.size >= this.maxKeys) {
      const excess = Math.ceil(this.maxKeys * 0.25)
      let dropped = 0
      for (const key of this.buckets.keys()) {
        this.buckets.delete(key)
        dropped += 1
        if (dropped >= excess) break
      }
    }
  }
}

export const rateLimiter = new RateLimiter()

export function clientKey(ip: string | undefined, scope: string): string {
  return `${scope}:${ip ?? 'unknown'}`
}

/** Throws a 429 ApiError when the caller has exhausted its budget. */
export function enforceRateLimit(
  ip: string | undefined,
  scope: string,
  rule: RateLimitRule = RATE_LIMITS.general,
): RateLimitResult {
  const result = rateLimiter.hit(clientKey(ip, scope), rule)
  if (!result.allowed) {
    const seconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
    throw rateLimited(
      `Too many requests. Please wait ${seconds}s before trying again.`,
    )
  }
  return result
}
