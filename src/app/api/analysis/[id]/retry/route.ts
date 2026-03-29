import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient, fetchResumeBuffer } from '@/lib/supabase/service'
import { analyzeResume } from '@/lib/analysis-engine'
import { parseResume } from '@/lib/resume-parser'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import type { Analysis } from '@/types/database'

export const maxDuration = 60

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rl = await rateLimit(`retry:${user.id}`, RATE_LIMITS.generateCV)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez plus tard.' },
      { status: 429, headers: { 'Retry-After': String(rl.resetAt - Math.floor(Date.now() / 1000)) } }
    )
  }

  const { data: rawAnalysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!rawAnalysis) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const analysis = rawAnalysis as Analysis

  if (analysis.status !== 'failed') {
    return NextResponse.json({ error: 'Seules les analyses échouées peuvent être relancées' }, { status: 400 })
  }

  const service = getServiceClient()

  // Remet en processing
  await service.from('analyses').update({ status: 'processing' }).eq('id', id)

  try {
    const resumeBuffer = await fetchResumeBuffer(analysis.resume_url)
    const { text: resumeText } = await parseResume(resumeBuffer, analysis.resume_filename)

    const result = await analyzeResume({
      resumeText,
      jobDescription: analysis.job_description,
      jobTitle: analysis.job_title ?? undefined,
      company: analysis.job_company ?? undefined,
      analysisType: analysis.type as 'basic' | 'premium',
      targetCountry: analysis.target_country ?? undefined,
      seniorityLevel: (analysis.seniority_level as import('@/types/analysis').SeniorityLevel) ?? undefined,
    })

    await service.from('analyses').update({
      status: 'completed',
      ats_score: result.overallScore,
      result,
      completed_at: new Date().toISOString(),
    }).eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[retry] Analysis failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    await service.from('analyses').update({
      status: 'failed',
      result: { error: errorMessage } as any,
    }).eq('id', id)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
