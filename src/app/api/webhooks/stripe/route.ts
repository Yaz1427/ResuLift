import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { getServiceClient, fetchResumeBuffer } from '@/lib/supabase/service'
import { analyzeResume } from '@/lib/analysis-engine'
import { parseResume } from '@/lib/resume-parser'
import type { Analysis } from '@/types/database'

export const maxDuration = 60

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object
  const analysisId = session.metadata?.analysis_id as string | undefined
  const userId = session.metadata?.user_id as string | undefined
  const analysisType = (session.metadata?.analysis_type ?? 'basic') as 'basic' | 'premium'

  if (!analysisId || !userId) {
    console.error('[webhook] Missing metadata')
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Idempotency check — avoid processing the same webhook twice
  const { data: rawAnalysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', analysisId)
    .single()

  if (!rawAnalysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
  }

  if (rawAnalysis.status === 'completed' || rawAnalysis.status === 'processing') {
    console.log(`[webhook] Skipping duplicate event for analysis ${analysisId} (status: ${rawAnalysis.status})`)
    return NextResponse.json({ received: true })
  }

  // Mark payment as succeeded
  await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      stripe_payment_intent_id: session.payment_intent as string,
    })
    .eq('stripe_session_id', session.id)

  // Mark analysis as processing
  await supabase
    .from('analyses')
    .update({ status: 'processing' })
    .eq('id', analysisId)

  const analysis = rawAnalysis as Analysis

  // Run analysis synchronously (Stripe waits up to 30s — Claude takes ~15s)
  try {
    const resumeBuffer = await fetchResumeBuffer(analysis.resume_url)
    const { text: resumeText } = await parseResume(resumeBuffer, analysis.resume_filename)

    const result = await analyzeResume({
      resumeText,
      jobDescription: analysis.job_description,
      jobTitle: analysis.job_title ?? undefined,
      company: analysis.job_company ?? undefined,
      analysisType,
      targetCountry: analysis.target_country ?? undefined,
      seniorityLevel: (analysis.seniority_level as import('@/types/analysis').SeniorityLevel) ?? undefined,
    })

    await supabase
      .from('analyses')
      .update({
        status: 'completed',
        ats_score: result.overallScore,
        result,
        completed_at: new Date().toISOString(),
      })
      .eq('id', analysis.id)

    console.log(`[webhook] Analysis ${analysisId} completed — score: ${result.overallScore}`)
  } catch (error) {
    console.error('[webhook] Analysis failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    await supabase
      .from('analyses')
      .update({
        status: 'failed',
        result: { error: errorMessage } as any,
      })
      .eq('id', analysis.id)
  }

  return NextResponse.json({ received: true })
}
