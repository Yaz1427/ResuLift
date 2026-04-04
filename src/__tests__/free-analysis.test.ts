import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mockGetUser         = vi.hoisted(() => vi.fn())
const mockFrom            = vi.hoisted(() => vi.fn())
const mockServiceFrom     = vi.hoisted(() => vi.fn())
const mockFetchResumeBuf  = vi.hoisted(() => vi.fn().mockResolvedValue(Buffer.from('pdf')))
const mockParseResume     = vi.hoisted(() => vi.fn().mockResolvedValue({ text: 'resume text' }))
const mockAnalyzeResume   = vi.hoisted(() => vi.fn().mockResolvedValue({ overallScore: 80 }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

vi.mock('@/lib/supabase/service', () => ({
  getServiceClient: () => ({ from: mockServiceFrom }),
  fetchResumeBuffer: mockFetchResumeBuf,
}))

vi.mock('@/lib/resume-parser', () => ({
  parseResume: mockParseResume,
}))

vi.mock('@/lib/analysis-engine', () => ({
  analyzeResume: mockAnalyzeResume,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 9, resetAt: 9999999999 }),
  RATE_LIMITS: { freeAnalysis: { limit: 3, windowSec: 3600 } },
}))

// ─── Route import (after mocks) ───────────────────────────────────────────────

import { POST } from '@/app/api/analysis/free/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_BODY = {
  analysisType: 'basic',
  resumeUrl: 'https://rrplwoztvfjnotgrswbb.supabase.co/storage/v1/object/sign/resumes/u/cv.pdf',
  resumeFilename: 'cv.pdf',
  jobDescription: 'a'.repeat(50),
}

function makeRequest(body = VALID_BODY) {
  return new Request('https://resulift.cv/api/analysis/free', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const ANALYSIS_RECORD = {
  id: 'analysis-new-001',
  user_id: 'user-123',
  type: 'basic',
  status: 'processing',
  resume_url: VALID_BODY.resumeUrl,
  resume_filename: VALID_BODY.resumeFilename,
  job_description: VALID_BODY.jobDescription,
  job_title: null,
  job_company: null,
  target_country: null,
  seniority_level: null,
}

function setupUser(freeAnalysisUsed: boolean) {
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-123', email: 'u@x.com' } },
  })

  // User-scoped client: profiles select
  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { free_analysis_used: freeAnalysisUsed } }),
          }),
        }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }
    }
    return {}
  })

  // Service client: analyses insert
  mockServiceFrom.mockImplementation(() => ({
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: ANALYSIS_RECORD, error: null }),
      }),
    }),
    update: () => ({ eq: () => Promise.resolve({ error: null }) }),
  }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/analysis/free', () => {
  beforeEach(() => vi.clearAllMocks())

  // P0 — Non authentifié → 401
  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  // P1 — Gratuit déjà utilisé → 403
  it('returns 403 when free analysis already used', async () => {
    setupUser(true)
    const res = await POST(makeRequest())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/gratuite/i)
  })

  // Happy path — première utilisation → 200
  it('returns 200 with analysisId when free analysis not yet used', async () => {
    setupUser(false)
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.analysisId).toBe('analysis-new-001')
  })

  // P0 — analyzeResume est bien appelé au premier essai
  it('calls analyzeResume when free analysis is allowed', async () => {
    setupUser(false)
    await POST(makeRequest())
    expect(mockAnalyzeResume).toHaveBeenCalledOnce()
  })

  // P0 — analyzeResume n'est PAS appelé si déjà utilisé
  it('does NOT call analyzeResume when free analysis already used', async () => {
    setupUser(true)
    await POST(makeRequest())
    expect(mockAnalyzeResume).not.toHaveBeenCalled()
  })

  // P0 — Body invalide (JD trop court) → 400
  it('returns 400 for invalid request body (job description too short)', async () => {
    setupUser(false)
    const res = await POST(makeRequest({ ...VALID_BODY, jobDescription: 'short' }))
    expect(res.status).toBe(400)
  })

  // P0 — URL non-Supabase rejetée → 400
  it('returns 400 for non-Supabase resume URL', async () => {
    setupUser(false)
    const res = await POST(makeRequest({ ...VALID_BODY, resumeUrl: 'https://evil.com/cv.pdf' }))
    expect(res.status).toBe(400)
  })
})
