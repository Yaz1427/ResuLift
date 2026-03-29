import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { buildGenerateCVPrompt } from '@/lib/prompts'
import { generateCVDocx, generateCVPdf, detectPhotoType } from '@/lib/cv-generator'
import { extractPhotoFromResume } from '@/lib/photo-extractor'
import { parseResume } from '@/lib/resume-parser'
import { fetchResumeBuffer } from '@/lib/supabase/service'
import { generateCVSchema } from '@/lib/validations'
import type { Analysis } from '@/types/database'
import type { AnalysisResult, GeneratedCV } from '@/types/analysis'

export const maxDuration = 60

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rl = await rateLimit(`generateCV:${user.id}`, RATE_LIMITS.generateCV)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans une heure.' },
      { status: 429, headers: { 'Retry-After': String(rl.resetAt - Math.floor(Date.now() / 1000)) } }
    )
  }

  let input: { analysisId: string; format: 'docx' | 'pdf' }
  try {
    input = generateCVSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Paramètres invalides (analysisId UUID requis, format: pdf|docx)' }, { status: 400 })
  }
  const { analysisId, format } = input

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

  // Récupère le CV original (URL signée Supabase, regénérée si expirée)
  let resumeBuffer: Buffer
  try {
    resumeBuffer = await fetchResumeBuffer(analysis.resume_url)
  } catch (err) {
    console.error('[generate-cv] Impossible de récupérer le CV:', err)
    return NextResponse.json({ error: 'Impossible de récupérer le CV — veuillez relancer une analyse' }, { status: 500 })
  }
  const { text: resumeText } = await parseResume(resumeBuffer, analysis.resume_filename)

  // ── Photo : 1) avatar du profil  2) extraction depuis le CV original ──
  let photo: { buffer: Buffer; type: 'jpg' | 'png' } | undefined

  // 1. Avatar depuis la table profiles (uploadé via les paramètres)
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  const avatarUrl = (profile as any)?.avatar_url as string | null
  if (avatarUrl) {
    try {
      const cleanUrl = avatarUrl.split('?')[0]
      // Validate avatar URL is from Supabase to prevent SSRF
      const avatarHost = new URL(cleanUrl).hostname
      if (avatarHost.endsWith('.supabase.co')) {
        const res = await fetch(cleanUrl)
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer())
          const type = detectPhotoType(buf)
          if (type) photo = { buffer: buf, type }
        }
      }
    } catch { /* avatar non disponible */ }
  }

  // 2. Si pas d'avatar, extraire la photo directement du CV original
  if (!photo) {
    const extracted = await extractPhotoFromResume(resumeBuffer, analysis.resume_filename)
    if (extracted) photo = extracted
  }

  // Appel Claude pour restructurer le CV
  let generatedPdf: Buffer | undefined
  let generatedDocx: Buffer | undefined

  const prompt = buildGenerateCVPrompt(
    resumeText,
    analysis.job_description,
    analysis.job_title ?? undefined,
    analysis.job_company ?? undefined,
    result
  )

  let cvData: GeneratedCV
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    cvData = JSON.parse(cleaned) as GeneratedCV
  } catch (err) {
    console.error('[generate-cv] Claude API or JSON parse failed:', err)
    return NextResponse.json({ error: 'Erreur de génération du CV. Veuillez réessayer.' }, { status: 500 })
  }

  // ── Post-processing : filet de sécurité côté serveur ──────────────────────
  // Claude ne respecte pas toujours les limites de caractères.
  // On tronque proprement APRÈS génération pour garantir un rendu PDF propre.
  const MAX_BULLET = 85
  const MAX_SUMMARY = 180
  const MAX_SKILLS = 15
  const MAX_BULLETS_PER_EXP = 3

  // Tronquer au dernier mot complet avant la limite
  function smartTruncate(text: string, max: number): string {
    if (text.length <= max) return text
    const cut = text.slice(0, max)
    const lastSpace = cut.lastIndexOf(' ')
    return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()
  }

  if (cvData.summary) {
    cvData.summary = smartTruncate(cvData.summary, MAX_SUMMARY)
  }
  for (const exp of cvData.experience) {
    exp.bullets = exp.bullets
      .slice(0, MAX_BULLETS_PER_EXP)
      .map(b => smartTruncate(b, MAX_BULLET))
  }
  if (cvData.skills.length > MAX_SKILLS) {
    cvData.skills = cvData.skills.slice(0, MAX_SKILLS)
  }

  // Sanitize job_title before using in Content-Disposition to prevent header injection
  const safeTitle = (analysis.job_title ?? 'ResuLift')
    .replace(/[^\w\s-]/g, '')   // keep only word chars, spaces, hyphens
    .replace(/\s+/g, '_')
    .slice(0, 80)
    || 'ResuLift'
  const baseName = `CV_Optimise_${safeTitle}`

  if (format === 'pdf') {
    const pdfBuffer = await generateCVPdf(cvData, photo)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${baseName}.pdf"`,
      },
    })
  }

  const docxBuffer = await generateCVDocx(cvData, photo)
  return new NextResponse(new Uint8Array(docxBuffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${baseName}.docx"`,
    },
  })
}
