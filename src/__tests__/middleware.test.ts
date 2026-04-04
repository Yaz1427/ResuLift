import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Supabase SSR mock ────────────────────────────────────────────────────────

const mockGetUser = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

import { updateSession } from '@/lib/supabase/middleware'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(pathname: string) {
  return new NextRequest(`https://resulift.cv${pathname}`, { method: 'GET' })
}

const AUTHENTICATED_USER = { id: 'user-123', email: 'user@test.com' }

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('updateSession (auth middleware)', () => {
  beforeEach(() => vi.clearAllMocks())

  // P0 — Redirect non-auth user trying to access /dashboard
  it('redirects unauthenticated user from /dashboard to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = makeRequest('/dashboard')
    const res = await updateSession(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('includes redirectedFrom param in redirect URL', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = makeRequest('/dashboard/analysis/abc123')
    const res = await updateSession(req)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('redirectedFrom')
  })

  it('redirects unauthenticated user from /dashboard/new to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = makeRequest('/dashboard/new')
    const res = await updateSession(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  // P0 — Authenticated user can access /dashboard
  it('allows authenticated user to access /dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } })
    const req = makeRequest('/dashboard')
    const res = await updateSession(req)
    expect(res.status).not.toBe(307)
  })

  // P1 — Authenticated user redirected away from /login
  it('redirects authenticated user from /login to /dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } })
    const req = makeRequest('/login')
    const res = await updateSession(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('redirects authenticated user from /signup to /dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } })
    const req = makeRequest('/signup')
    const res = await updateSession(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/dashboard')
  })

  // Public routes — accessible without auth
  it('allows unauthenticated user on public marketing page (/)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = makeRequest('/')
    const res = await updateSession(req)
    expect(res.status).not.toBe(307)
  })

  it('allows unauthenticated user on /pricing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = makeRequest('/pricing')
    const res = await updateSession(req)
    expect(res.status).not.toBe(307)
  })

  it('allows unauthenticated user on /share/:id', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = makeRequest('/share/some-public-id')
    const res = await updateSession(req)
    expect(res.status).not.toBe(307)
  })

  // Missing env vars — should not crash (graceful skip)
  it('skips middleware gracefully when Supabase env vars are missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    const req = makeRequest('/dashboard')
    const res = await updateSession(req)
    // Should return a response without crashing (not necessarily 307)
    expect(res).toBeDefined()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
  })
})
