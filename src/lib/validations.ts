import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const analysisRequestSchema = z.object({
  analysisId: z.string().uuid(),
  resumeUrl: z.string().url(),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  analysisType: z.enum(['basic', 'premium']),
})

export const checkoutSchema = z.object({
  analysisType: z.enum(['basic', 'premium']),
  resumeUrl: z.string().url(),
  resumeFilename: z.string(),
  jobDescription: z.string().min(50),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  targetCountry: z.string().optional(),
  seniorityLevel: z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'manager']).optional(),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
