import { describe, it, expect, beforeEach, vi } from 'vitest'

// Force in-memory fallback by ensuring Upstash env vars are absent
vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

// Import AFTER stubbing env so the module sees empty vars
const { rateLimit, RATE_LIMITS } = await import('@/lib/rate-limit')

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a unique key per test to avoid cross-test pollution */
let counter = 0
function uid() { return `test-user-${++counter}-${Date.now()}` }

// ─── rateLimit — basic behaviour ──────────────────────────────────────────────

describe('rateLimit (in-memory)', () => {
  it('allows first request', async () => {
    const result = await rateLimit(uid(), { limit: 3, windowSec: 60 })
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('allows requests up to the limit', async () => {
    const key = uid()
    const opts = { limit: 3, windowSec: 60 }
    await rateLimit(key, opts)
    await rateLimit(key, opts)
    const third = await rateLimit(key, opts)
    expect(third.success).toBe(true)
    expect(third.remaining).toBe(0)
  })

  it('blocks the request that exceeds the limit', async () => {
    const key = uid()
    const opts = { limit: 3, windowSec: 60 }
    await rateLimit(key, opts)
    await rateLimit(key, opts)
    await rateLimit(key, opts)
    const fourth = await rateLimit(key, opts)
    expect(fourth.success).toBe(false)
    expect(fourth.remaining).toBe(0)
  })

  it('returns a future resetAt timestamp', async () => {
    const before = Math.floor(Date.now() / 1000)
    const result = await rateLimit(uid(), { limit: 5, windowSec: 120 })
    expect(result.resetAt).toBeGreaterThan(before)
    expect(result.resetAt).toBeLessThanOrEqual(before + 121)
  })

  it('different keys are independent', async () => {
    const opts = { limit: 1, windowSec: 60 }
    const keyA = uid()
    const keyB = uid()
    await rateLimit(keyA, opts) // exhausts keyA
    const result = await rateLimit(keyB, opts) // keyB is fresh
    expect(result.success).toBe(true)
  })

  it('resets after the window expires', async () => {
    // Use a 1-second window and fake the clock
    const key = uid()
    const opts = { limit: 1, windowSec: 1 }

    // Exhaust the window
    await rateLimit(key, opts)
    const blocked = await rateLimit(key, opts)
    expect(blocked.success).toBe(false)

    // Advance time by 2 seconds
    const now = Date.now()
    vi.setSystemTime(now + 2000)

    const reset = await rateLimit(key, opts)
    expect(reset.success).toBe(true)

    vi.useRealTimers()
  })
})

// ─── RATE_LIMITS constants ────────────────────────────────────────────────────

describe('RATE_LIMITS constants', () => {
  it('upload allows 10 per hour', () => {
    expect(RATE_LIMITS.upload).toEqual({ limit: 10, windowSec: 3600 })
  })

  it('freeAnalysis allows 3 per hour', () => {
    expect(RATE_LIMITS.freeAnalysis).toEqual({ limit: 3, windowSec: 3600 })
  })

  it('checkout allows 10 per hour', () => {
    expect(RATE_LIMITS.checkout).toEqual({ limit: 10, windowSec: 3600 })
  })

  it('generateCV allows 10 per hour', () => {
    expect(RATE_LIMITS.generateCV).toEqual({ limit: 10, windowSec: 3600 })
  })

  it('email allows 5 per hour', () => {
    expect(RATE_LIMITS.email).toEqual({ limit: 5, windowSec: 3600 })
  })
})
