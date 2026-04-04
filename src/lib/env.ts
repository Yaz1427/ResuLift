/**
 * Validates required environment variables at startup.
 * Import this module in any server-side entry point to catch misconfigurations early.
 *
 * Usage: import '@/lib/env' in layout.tsx or API routes.
 */

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

// Makes this file a module so it can be dynamically imported in tests
export {}

// Only validate on the server (not during client-side bundle evaluation)
if (typeof window === 'undefined') {
  requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  requireEnv('STRIPE_SECRET_KEY')
  requireEnv('STRIPE_WEBHOOK_SECRET')
  requireEnv('STRIPE_BASIC_PRICE_ID')
  requireEnv('STRIPE_PREMIUM_PRICE_ID')
  requireEnv('ANTHROPIC_API_KEY')
  requireEnv('NEXT_PUBLIC_APP_URL')
}
