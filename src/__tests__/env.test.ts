import { describe, it, expect, vi, afterEach } from 'vitest'

// We test env.ts by controlling process.env and re-importing the module
// each time using dynamic import + vi.resetModules()

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_BASIC_PRICE_ID',
  'STRIPE_PREMIUM_PRICE_ID',
  'ANTHROPIC_API_KEY',
  'NEXT_PUBLIC_APP_URL',
]

/** Set all required env vars to a placeholder value */
function setAllEnvVars() {
  for (const key of REQUIRED_VARS) {
    vi.stubEnv(key, `test-${key}`)
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('lib/env.ts', () => {
  it('does not throw when all required env vars are set', async () => {
    setAllEnvVars()
    await expect(import('@/lib/env')).resolves.toBeDefined()
  })

  // Test each required var individually
  for (const missingVar of REQUIRED_VARS) {
    it(`throws when ${missingVar} is missing`, async () => {
      setAllEnvVars()
      vi.stubEnv(missingVar, '') // override to empty string
      await expect(import('@/lib/env')).rejects.toThrow(missingVar)
      vi.resetModules()
    })
  }
})
