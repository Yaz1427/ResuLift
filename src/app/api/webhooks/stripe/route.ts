import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { analyzeResume } from '@/lib/analysis-engine'
import { parseResume } from '@/lib/resume-parser'
import type { Analysis } from '@/types/database'

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    const analysisId = session.metadata?.analysis_id as string | undefined
    const userId = session.metadata?.user_id as string | undefined
    const analysisType = session.metadata?.analysis_type as 'basic' | 'premium' | undefined

    if (!analysisId || !userId) {
      console.error('[webhook] Missing metadata')
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq('stripe_session_id', session.id)

    await supabase
      .from('analyses')
      .update({ status: 'processing' })
      .eq('id', analysisId)

    const { data: rawAnalysis } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (!rawAnalysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    const analysis = rawAnalysis as Analysis

    runAnalysisInBackground(supabase, analysis, analysisType ?? 'basic').catch(err => {
      console.error('[webhook] Background analysis failed:', err)
    })
  }

  return NextResponse.json({ received: true })
}

async function runAnalysisInBackground(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  analysis: Analysis,
  analysisType: 'basic' | 'premium'
) {
  try {
    const resumeResponse = await fetch(analysis.resume_url)
    if (!resumeResponse.ok) throw new Error('Could not fetch resume file')

    const resumeBuffer = Buffer.from(await resumeResponse.arrayBuffer())
    const { text: resumeText } = await parseResume(resumeBuffer, analysis.resume_filename)

    const result = await analyzeResume({
      resumeText,
      jobDescription: analysis.job_description,
      jobTitle: analysis.job_title ?? undefined,
      company: analysis.job_company ?? undefined,
      analysisType,
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
  } catch (error) {
    console.error('[analysis] Failed:', error)
    await supabase
      .from('analyses')
      .update({ status: 'failed' })
      .eq('id', analysis.id)
  }
}
