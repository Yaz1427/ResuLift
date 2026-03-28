import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Analysis } from '@/types/database'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service config manquant')
  return createServiceClient(url, key, { auth: { persistSession: false } })
}

/** Extract storage path from a Supabase signed URL */
function extractStoragePath(signedUrl: string): string | null {
  try {
    const url = new URL(signedUrl)
    const match = url.pathname.match(/\/storage\/v1\/object\/sign\/resumes\/(.+)/)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

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

  // L'URL signée expire après 24h — on regénère une URL fraîche via le service role
  let buffer: ArrayBuffer
  try {
    const storagePath = extractStoragePath(analysis.resume_url)
    if (storagePath) {
      const service = getServiceSupabase()
      const { data: signedData } = await service.storage
        .from('resumes')
        .createSignedUrl(storagePath, 60 * 5)
      if (!signedData?.signedUrl) throw new Error('Signed URL generation failed')
      const res = await fetch(signedData.signedUrl)
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
      buffer = await res.arrayBuffer()
    } else {
      const res = await fetch(analysis.resume_url)
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
      buffer = await res.arrayBuffer()
    }
  } catch {
    return new Response('Fichier indisponible', { status: 502 })
  }

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
