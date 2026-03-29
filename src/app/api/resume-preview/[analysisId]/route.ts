import { createClient } from '@/lib/supabase/server'
import { fetchResumeBuffer } from '@/lib/supabase/service'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import type { Analysis } from '@/types/database'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  const { analysisId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non autorisé', { status: 401 })

  const rl = await rateLimit(`preview:${user.id}`, RATE_LIMITS.generateCV)
  if (!rl.success) return new Response('Trop de requêtes', { status: 429 })

  const { data: rawAnalysis } = await supabase
    .from('analyses')
    .select('resume_url, resume_filename')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .single()

  if (!rawAnalysis) return new Response('Introuvable', { status: 404 })

  const analysis = rawAnalysis as Pick<Analysis, 'resume_url' | 'resume_filename'>

  let buffer: Buffer
  try {
    buffer = await fetchResumeBuffer(analysis.resume_url)
  } catch {
    return new Response('Fichier indisponible', { status: 502 })
  }

  const rawFilename = analysis.resume_filename ?? 'cv'
  const isPdf = rawFilename.toLowerCase().endsWith('.pdf')
  // Sanitize filename to prevent header injection
  const safeFilename = rawFilename.replace(/[^\w.\-]/g, '_').slice(0, 100) || 'cv'

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': isPdf
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `inline; filename="${safeFilename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
