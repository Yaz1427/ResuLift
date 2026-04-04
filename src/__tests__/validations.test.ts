import { describe, it, expect } from 'vitest'
import { signUpSchema, signInSchema, checkoutSchema, generateCVSchema } from '@/lib/validations'

// ─── signUpSchema ─────────────────────────────────────────────────────────────

describe('signUpSchema', () => {
  const valid = {
    email: 'user@example.com',
    password: 'Secret1!',
  }

  it('accepts a valid signup', () => {
    expect(() => signUpSchema.parse(valid)).not.toThrow()
  })

  // Email
  it('rejects invalid email', () => {
    expect(() => signUpSchema.parse({ ...valid, email: 'notanemail' })).toThrow()
  })

  it('rejects email over 254 chars', () => {
    const long = 'a'.repeat(249) + '@x.com' // 255 chars total
    expect(() => signUpSchema.parse({ ...valid, email: long })).toThrow()
  })

  // Password — length
  it('rejects password shorter than 8 chars', () => {
    expect(() => signUpSchema.parse({ ...valid, password: 'Sh0rt!' })).toThrow()
  })

  it('rejects password over 128 chars', () => {
    expect(() => signUpSchema.parse({ ...valid, password: 'Aa1!' + 'x'.repeat(125) })).toThrow()
  })

  // Password — complexity (P0 : politique de mot de passe)
  it('rejects password with no uppercase letter', () => {
    expect(() => signUpSchema.parse({ ...valid, password: 'secret1!' })).toThrow()
  })

  it('rejects password with no number', () => {
    expect(() => signUpSchema.parse({ ...valid, password: 'Secret!!' })).toThrow()
  })

  it('rejects password with no special character', () => {
    expect(() => signUpSchema.parse({ ...valid, password: 'Secret12' })).toThrow()
  })

  it('accepts password that meets all requirements', () => {
    expect(() => signUpSchema.parse({ ...valid, password: 'MyP@ssw0rd' })).not.toThrow()
  })

  // Optional fullName
  it('accepts signup without fullName', () => {
    expect(() => signUpSchema.parse({ email: valid.email, password: valid.password })).not.toThrow()
  })

  it('rejects fullName shorter than 2 chars', () => {
    expect(() => signUpSchema.parse({ ...valid, fullName: 'A' })).toThrow()
  })
})

// ─── signInSchema ─────────────────────────────────────────────────────────────

describe('signInSchema', () => {
  it('accepts valid signin', () => {
    expect(() => signInSchema.parse({ email: 'u@x.com', password: 'anypassword' })).not.toThrow()
  })

  it('rejects empty password', () => {
    expect(() => signInSchema.parse({ email: 'u@x.com', password: '' })).toThrow()
  })

  it('rejects invalid email', () => {
    expect(() => signInSchema.parse({ email: 'bad', password: 'pass' })).toThrow()
  })
})

// ─── checkoutSchema ───────────────────────────────────────────────────────────

describe('checkoutSchema', () => {
  const validCheckout = {
    analysisType: 'basic',
    resumeUrl: 'https://rrplwoztvfjnotgrswbb.supabase.co/storage/v1/object/sign/resumes/abc.pdf',
    resumeFilename: 'cv.pdf',
    jobDescription: 'a'.repeat(50),
  }

  it('accepts valid basic checkout', () => {
    expect(() => checkoutSchema.parse(validCheckout)).not.toThrow()
  })

  it('accepts valid premium checkout', () => {
    expect(() => checkoutSchema.parse({ ...validCheckout, analysisType: 'premium' })).not.toThrow()
  })

  it('rejects non-Supabase resume URL', () => {
    expect(() => checkoutSchema.parse({
      ...validCheckout,
      resumeUrl: 'https://evil.com/malware.pdf',
    })).toThrow()
  })

  it('rejects job description under 50 chars', () => {
    expect(() => checkoutSchema.parse({ ...validCheckout, jobDescription: 'short' })).toThrow()
  })

  it('rejects job description over 8000 chars', () => {
    expect(() => checkoutSchema.parse({
      ...validCheckout,
      jobDescription: 'a'.repeat(8001),
    })).toThrow()
  })

  it('rejects invalid analysisType', () => {
    expect(() => checkoutSchema.parse({ ...validCheckout, analysisType: 'enterprise' })).toThrow()
  })

  it('accepts valid seniorityLevel', () => {
    expect(() => checkoutSchema.parse({ ...validCheckout, seniorityLevel: 'senior' })).not.toThrow()
  })

  it('rejects invalid seniorityLevel', () => {
    expect(() => checkoutSchema.parse({ ...validCheckout, seniorityLevel: 'god' })).toThrow()
  })
})

// ─── generateCVSchema ─────────────────────────────────────────────────────────

describe('generateCVSchema', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000'

  it('accepts valid uuid + default format', () => {
    const result = generateCVSchema.parse({ analysisId: validId })
    expect(result.format).toBe('docx')
  })

  it('accepts pdf format', () => {
    const result = generateCVSchema.parse({ analysisId: validId, format: 'pdf' })
    expect(result.format).toBe('pdf')
  })

  it('rejects non-uuid analysisId', () => {
    expect(() => generateCVSchema.parse({ analysisId: 'not-a-uuid' })).toThrow()
  })

  it('rejects invalid format', () => {
    expect(() => generateCVSchema.parse({ analysisId: validId, format: 'txt' })).toThrow()
  })
})
