import { Resend } from 'resend'
import { renderWelcomeEmail } from './emails/welcome'
import { renderAnalysisCompleteEmail } from './emails/analysis-complete'
import { renderReceiptEmail } from './emails/receipt'
import { rateLimit, RATE_LIMITS } from './rate-limit'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = 'ResuLift <noreply@resulift.cv>'

export async function sendWelcomeEmail(email: string, fullName?: string) {
  const rl = await rateLimit(`email:${email}`, RATE_LIMITS.email)
  if (!rl.success) return

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Welcome to ResuLift! 🚀',
    html: renderWelcomeEmail({ email, fullName }),
  })
}

export async function sendAnalysisCompleteEmail(params: {
  email: string
  fullName?: string
  analysisId: string
  atsScore: number
  jobTitle?: string
  analysisType: 'basic' | 'premium'
}) {
  const rl = await rateLimit(`email:${params.email}`, RATE_LIMITS.email)
  if (!rl.success) return

  return resend.emails.send({
    from: FROM,
    to: params.email,
    subject: `Your ResuLift analysis is ready — ATS Score: ${params.atsScore}/100`,
    html: renderAnalysisCompleteEmail(params),
  })
}

export async function sendReceiptEmail(params: {
  email: string
  amount: number
  analysisType: 'basic' | 'premium'
  analysisId: string
  paymentDate: string
}) {
  return resend.emails.send({
    from: FROM,
    to: params.email,
    subject: 'ResuLift — Payment Receipt',
    html: renderReceiptEmail(params),
  })
}
