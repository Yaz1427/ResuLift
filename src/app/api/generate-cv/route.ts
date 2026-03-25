import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildGenerateCVPrompt } from '@/lib/prompts'
import { generateCVDocx, generateCVPdf } from '@/lib/cv-generator'
import { parseResume } from '@/lib/resume-parser'
import type { Analysis } from '@/types/database'
import type { AnalysisResult, GeneratedCV } from '@/types/analysis'

export const maxDuration = 60

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { analysisId, format = 'docx' } = await request.json() as { analysisId: string; format?: 'docx' | 'pdf' }
  if (!analysisId) return NextResponse.json({ error: 'analysisId requis' }, { status: 400 })

  const { data: rawAnalysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .single()

  if (!rawAnalysis) return NextResponse.json({ error: 'Analyse introuvable' }, { status: 404 })

  const analysis = rawAnalysis as Analysis
  const result = analysis.result as AnalysisResult | null

  if (analysis.type !== 'premium') {
    return NextResponse.json({ error: 'Fonctionnalité réservée aux analyses Premium' }, { status: 403 })
  }
  if (analysis.status !== 'completed' || !result) {
    return NextResponse.json({ error: 'Analyse non terminée' }, { status: 400 })
  }

  // Récupère et parse le CV original
  const resumeResponse = await fetch(analysis.resume_url)
  if (!resumeResponse.ok) return NextResponse.json({ error: 'Impossible de récupérer le CV' }, { status: 500 })
  const resumeBuffer = Buffer.from(await resumeResponse.arrayBuffer())
  const { text: resumeText } = await parseResume(resumeBuffer, analysis.resume_filename)

  // Appel Claude pour restructurer le CV
  const prompt = buildGenerateCVPrompt(
    resumeText,
    analysis.job_description,
    analysis.job_title ?? undefined,
    analysis.job_company ?? undefined,
    result
  )

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  let cvData: GeneratedCV
  try {
    // Nettoie le JSON si entouré de backticks
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    cvData = JSON.parse(cleaned) as GeneratedCV
  } catch {
    return NextResponse.json({ error: 'Erreur de génération du CV (JSON invalide)' }, { status: 500 })
  }

  const baseName = `CV_Optimise_${(analysis.job_title ?? 'ResuLift').replace(/\s+/g, '_')}`

  if (format === 'pdf') {
    const pdfBuffer = await generateCVPdf(cvData)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${baseName}.pdf"`,
      },
    })
  }

  const docxBuffer = await generateCVDocx(cvData)
  return new NextResponse(new Uint8Array(docxBuffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${baseName}.docx"`,
    },
  })
}
