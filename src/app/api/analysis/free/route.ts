import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { analyzeResume } from '@/lib/analysis-engine'
import { parseResume } from '@/lib/resume-parser'
import { checkoutSchema } from '@/lib/validations'
import type { Analysis } from '@/types/database'

export const maxDuration = 60

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Check if free analysis already used
  const { data: profile } = await supabase
    .from('profiles')
    .select('free_analysis_used')
    .eq('id', user.id)
    .single()

  if ((profile as { free_analysis_used: boolean } | null)?.free_analysis_used) {
    return NextResponse.json({ error: 'Vous avez déjà utilisé votre analyse gratuite.' }, { status: 403 })
  }

  const body = await request.json()
  const input = checkoutSchema.parse(body)

  const service = getServiceClient()

  // Create analysis record
  const { data: rawAnalysis, error: analysisError } = await service
    .from('analyses')
    .insert({
      user_id: user.id,
      type: 'basic',
      status: 'processing',
      resume_url: input.resumeUrl,
      resume_filename: input.resumeFilename,
      job_description: input.jobDescription,
      job_title: input.jobTitle ?? null,
      job_company: input.company ?? null,
    })
    .select()
    .single()

  if (analysisError || !rawAnalysis) {
    return NextResponse.json({ error: 'Impossible de créer l\'analyse' }, { status: 500 })
  }

  const analysis = rawAnalysis as Analysis

  // Mark free analysis as used
  await service.from('profiles').update({ free_analysis_used: true }).eq('id', user.id)

  // Run analysis
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
      analysisType: 'basic',
    })

    await service.from('analyses').update({
      status: 'completed',
      ats_score: result.overallScore,
      result,
      completed_at: new Date().toISOString(),
    }).eq('id', analysis.id)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    await service.from('analyses').update({
      status: 'failed',
      result: { error: errorMessage } as any,
    }).eq('id', analysis.id)
  }

  return NextResponse.json({ analysisId: analysis.id })
}
