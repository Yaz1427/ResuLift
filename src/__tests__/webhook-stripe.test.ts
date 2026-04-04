import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks (must be before any import that uses them) ─────────────────

const mockConstructEvent = vi.hoisted(() => vi.fn())
const mockFetchResumeBuffer = vi.hoisted(() => vi.fn().mockResolvedValue(Buffer.from('pdf-content')))
const mockAnalyzeResume = vi.hoisted(() => vi.fn().mockResolvedValue({ overallScore: 75 }))
const mockParseResume = vi.hoisted(() => vi.fn().mockResolvedValue({ text: 'parsed resume text' }))
const mockHeadersGet = vi.hoisted(() => vi.fn((key: string) => key === 'stripe-signature' ? 'valid-sig' : null))

vi.mock('@/lib/stripe', () => ({
  stripe: { webhooks: { constructEvent: mockConstructEvent } },
}))

vi.mock('@/lib/supabase/service', () => ({
  getServiceClient: () => ({
    from: mockServiceFrom,
  }),
  fetchResumeBuffer: mockFetchResumeBuffer,
}))

vi.mock('@/lib/analysis-engine', () => ({
  analyzeResume: mockAnalyzeResume,
}))

vi.mock('@/lib/resume-parser', () => ({
  parseResume: mockParseResume,
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: mockHeadersGet }),
}))

// ─── Service client mock (defined after vi.mock calls) ────────────────────────

const mockServiceFrom = vi.fn()

// ─── Route import (after all mocks) ──────────────────────────────────────────

import { POST } from '@/app/api/webhooks/stripe/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: string = '{}') {
  return new Request('https://resulift.cv/api/webhooks/stripe', {
    method: 'POST',
    body,
  })
}

const validSession = {
  id: 'cs_test_123',
  payment_intent: 'pi_test_123',
  metadata: {
    analysis_id: 'analysis-uuid-001',
    user_id: 'user-uuid-001',
    analysis_type: 'basic',
  },
}

const validEvent = {
  type: 'checkout.session.completed',
  data: { object: validSession },
}

function setupHappyPath(status = 'pending') {
  const analysisData = {
    id: 'analysis-uuid-001',
    user_id: 'user-uuid-001',
    status,
    type: 'basic',
    resume_url: 'https://x.supabase.co/storage/v1/object/sign/resumes/u/cv.pdf',
    resume_filename: 'cv.pdf',
    job_description: 'test job',
    job_title: null,
    job_company: null,
    target_country: null,
    seniority_level: null,
  }

  mockConstructEvent.mockReturnValue(validEvent)

  mockServiceFrom.mockImplementation(() => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: analysisData, error: null }),
      }),
    }),
    update: () => ({ eq: () => Promise.resolve({ error: null }) }),
  }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test')
    // Restore default header mock after each test
    mockHeadersGet.mockImplementation((key: string) =>
      key === 'stripe-signature' ? 'valid-sig' : null
    )
  })

  // P0 — Signature manquante → 400
  it('returns 400 when stripe-signature header is missing', async () => {
    mockHeadersGet.mockReturnValue(null)
    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Missing signature')
  })

  // P0 — Signature invalide → 400
  it('returns 400 when constructEvent throws (invalid signature)', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })
    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid signature')
  })

  // P0 — Événements non-checkout ignorés
  it('returns 200 received:true for non-checkout events', async () => {
    mockConstructEvent.mockReturnValue({ type: 'payment_intent.created', data: { object: {} } })
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
  })

  // P0 — Idempotency : skip si déjà completed
  it('skips processing when analysis is already completed (idempotency)', async () => {
    setupHappyPath('completed')
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
    // analyzeResume must NOT have been called
    expect(mockAnalyzeResume).not.toHaveBeenCalled()
  })

  // P0 — Idempotency : skip si déjà processing
  it('skips processing when analysis is already processing (idempotency)', async () => {
    setupHappyPath('processing')
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    expect(mockAnalyzeResume).not.toHaveBeenCalled()
  })

  // P0 — Metadata manquante → 400
  it('returns 400 when metadata is missing', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_123', metadata: {} } },
    })
    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
  })

  // P0 — Analyse inexistante → 404
  it('returns 404 when analysis is not found', async () => {
    mockConstructEvent.mockReturnValue(validEvent)
    mockServiceFrom.mockImplementation(() => ({
      select: () => ({
        eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const res = await POST(makeRequest())
    expect(res.status).toBe(404)
  })

  // Happy path — analyse pending traitée correctement
  it('returns 200 and calls analyzeResume for a pending analysis', async () => {
    setupHappyPath('pending')
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    expect(mockAnalyzeResume).toHaveBeenCalledOnce()
    const body = await res.json()
    expect(body.received).toBe(true)
  })
})
