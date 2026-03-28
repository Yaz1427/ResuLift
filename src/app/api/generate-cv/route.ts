import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { buildGenerateCVPrompt } from '@/lib/prompts'
import { generateCVDocx, generateCVPdf, detectPhotoType } from '@/lib/cv-generator'
import { extractPhotoFromResume } from '@/lib/photo-extractor'
import { parseResume } from '@/lib/resume-parser'
import type { Analysis } from '@/types/database'
import type { AnalysisResult, GeneratedCV } from '@/types/analysis'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service config manquant')
  return createServiceClient(url, key, { auth: { persistSession: false } })
}

/** Extract the storage path (e.g. "userId/1234.pdf") from a Supabase signed URL */
function extractStoragePath(signedUrl: string): string | null {
  try {
    const url = new URL(signedUrl)
    // Signed URL format: /storage/v1/object/sign/resumes/<path>
    const match = url.pathname.match(/\/storage\/v1\/object\/sign\/resumes\/(.+)/)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

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

  // Récupère le CV original (nécessaire pour texte + extraction photo éventuelle)
  // L'URL signée stockée dans resume_url expire après 24h.
  // On extrait le chemin storage et on regénère une URL fraîche via le service role.
  let resumeBuffer: Buffer
  try {
    const storagePath = extractStoragePath(analysis.resume_url)
    if (storagePath) {
      const service = getServiceSupabase()
      const { data: signedData } = await service.storage
        .from('resumes')
        .createSignedUrl(storagePath, 60 * 5) // 5 min suffisent
      if (!signedData?.signedUrl) throw new Error('Impossible de générer l\'URL signée')
      const res = await fetch(signedData.signedUrl)
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
      resumeBuffer = Buffer.from(await res.arrayBuffer())
    } else {
      // Fallback : tenter l'URL originale (peut encore être valide)
      const res = await fetch(analysis.resume_url)
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
      resumeBuffer = Buffer.from(await res.arrayBuffer())
    }
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
      const cleanUrl = avatarUrl.split('?')[0] // retirer le cache-busting
      const res = await fetch(cleanUrl)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        const type = detectPhotoType(buf)
        if (type) photo = { buffer: buf, type }
      }
    } catch { /* avatar non disponible */ }
  }

  // 2. Si pas d'avatar, extraire la photo directement du CV original
  if (!photo) {
    const extracted = await extractPhotoFromResume(resumeBuffer, analysis.resume_filename)
    if (extracted) photo = extracted
  }

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
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  let cvData: GeneratedCV
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    cvData = JSON.parse(cleaned) as GeneratedCV
  } catch {
    return NextResponse.json({ error: 'Erreur de génération du CV (JSON invalide)' }, { status: 500 })
  }

  const baseName = `CV_Optimise_${(analysis.job_title ?? 'ResuLift').replace(/\s+/g, '_')}`

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
