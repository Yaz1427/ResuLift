import { z } from 'zod'

// Limits to prevent token exhaustion and oversized payloads
const JOB_DESCRIPTION_MAX = 8_000
const JOB_TITLE_MAX = 150
const COMPANY_MAX = 150
const FULL_NAME_MAX = 100
const FILENAME_MAX = 255

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(FULL_NAME_MAX).optional(),
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(1, 'Password is required').max(128),
})

export const analysisRequestSchema = z.object({
  analysisId: z.string().uuid(),
  resumeUrl: z.string().url().max(2048),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters').max(JOB_DESCRIPTION_MAX),
  jobTitle: z.string().max(JOB_TITLE_MAX).optional(),
  company: z.string().max(COMPANY_MAX).optional(),
  analysisType: z.enum(['basic', 'premium']),
})

export const checkoutSchema = z.object({
  analysisType: z.enum(['basic', 'premium']),
  resumeUrl: z.string().url().max(2048).refine(
    (url) => {
      try { return new URL(url).hostname.endsWith('.supabase.co') }
      catch { return false }
    },
    { message: 'Resume URL must be from Supabase storage' }
  ),
  resumeFilename: z.string().max(FILENAME_MAX),
  jobDescription: z.string().min(50).max(JOB_DESCRIPTION_MAX),
  jobTitle: z.string().max(JOB_TITLE_MAX).optional(),
  company: z.string().max(COMPANY_MAX).optional(),
  targetCountry: z.string().max(10).optional(),
  seniorityLevel: z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'manager']).optional(),
})

export const generateCVSchema = z.object({
  analysisId: z.string().uuid(),
  format: z.enum(['pdf', 'docx']).default('docx'),
})

export const shareSchema = z.object({
  analysisId: z.string().uuid(),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
