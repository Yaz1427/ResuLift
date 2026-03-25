import { createClient } from '@/lib/supabase/server'
import type { Analysis } from '@/types/database'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  const { analysisId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non autorisé', { status: 401 })

  const { data: rawAnalysis } = await supabase
    .from('analyses')
    .select('resume_url, resume_filename')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .single()

  if (!rawAnalysis) return new Response('Introuvable', { status: 404 })

  const analysis = rawAnalysis as Pick<Analysis, 'resume_url' | 'resume_filename'>

  const fileRes = await fetch(analysis.resume_url)
  if (!fileRes.ok) return new Response('Fichier indisponible', { status: 502 })

  const buffer = await fileRes.arrayBuffer()
  const filename = analysis.resume_filename ?? 'cv'
  const isPdf = filename.toLowerCase().endsWith('.pdf')

  return new Response(buffer, {
    headers: {
      'Content-Type': isPdf
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
