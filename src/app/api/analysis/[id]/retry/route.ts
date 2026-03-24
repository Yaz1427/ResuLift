import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { analyzeResume } from '@/lib/analysis-engine'
import { parseResume } from '@/lib/resume-parser'
import type { Analysis } from '@/types/database'

export const maxDuration = 60

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

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
    const resumeResponse = await fetch(analysis.resume_url)
    if (!resumeResponse.ok) throw new Error('Impossible de récupérer le fichier CV')

    const resumeBuffer = Buffer.from(await resumeResponse.arrayBuffer())
    const { text: resumeText } = await parseResume(resumeBuffer, analysis.resume_filename)

    const result = await analyzeResume({
      resumeText,
      jobDescription: analysis.job_description,
      jobTitle: analysis.job_title ?? undefined,
      company: analysis.job_company ?? undefined,
      analysisType: analysis.type as 'basic' | 'premium',
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
    await service.from('analyses').update({ status: 'failed' }).eq('id', id)
    const message = error instanceof Error ? error.message : 'Analyse échouée'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
