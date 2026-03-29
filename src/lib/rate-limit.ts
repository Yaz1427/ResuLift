/**
 * Lightweight rate limiter.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set,
 * falls back to a simple in-memory sliding window for local dev / when Upstash is absent.
 *
 * Usage:
 *   const result = await rateLimit(userId, { limit: 5, windowSec: 60 })
 *   if (!result.success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
 */

interface RateLimitOptions {
  /** Max number of requests allowed in the window */
  limit: number
  /** Window size in seconds */
  windowSec: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number // epoch seconds
}

// ── In-memory fallback (single-server only, resets on cold start) ─────────────
interface InMemoryEntry {
  count: number
  resetAt: number
}
const inMemoryStore = new Map<string, InMemoryEntry>()

function inMemoryRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Math.floor(Date.now() / 1000)
  const entry = inMemoryStore.get(key)

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + opts.windowSec
    inMemoryStore.set(key, { count: 1, resetAt })
    return { success: true, remaining: opts.limit - 1, resetAt }
  }

  if (entry.count >= opts.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: opts.limit - entry.count, resetAt: entry.resetAt }
}

// ── Upstash-based rate limiter ────────────────────────────────────────────────
async function upstashRateLimit(key: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  const { Ratelimit } = await import('@upstash/ratelimit')
  const { Redis } = await import('@upstash/redis')

  const redis = Redis.fromEnv()
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(opts.limit, `${opts.windowSec} s`),
    prefix: 'resulift:rl',
  })

  const { success, remaining, reset } = await limiter.limit(key)
  return { success, remaining, resetAt: Math.floor(reset / 1000) }
}

// ── Public helper ─────────────────────────────────────────────────────────────
export async function rateLimit(key: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      return await upstashRateLimit(key, opts)
    } catch {
      // Upstash unavailable — degrade gracefully to in-memory
    }
  }
  return inMemoryRateLimit(key, opts)
}

// Pre-configured limiters for common cases
export const RATE_LIMITS = {
  /** Upload: max 10 uploads per hour per user */
  upload:      { limit: 10, windowSec: 3600 },
  /** Free analysis: max 3 attempts per hour per user (actual usage limited by DB) */
  freeAnalysis:{ limit: 3,  windowSec: 3600 },
  /** Checkout: max 10 sessions per hour per user */
  checkout:    { limit: 10, windowSec: 3600 },
  /** CV generation: max 10 per hour per user */
  generateCV:  { limit: 10, windowSec: 3600 },
}
