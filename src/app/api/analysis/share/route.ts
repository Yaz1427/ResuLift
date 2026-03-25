import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// POST /api/analysis/share — génère un share_id pour une analyse
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { analysisId } = await request.json() as { analysisId: string }

  const { data: analysis } = await supabase
    .from('analyses')
    .select('id, status, share_id')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .single()

  if (!analysis) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  if (analysis.status !== 'completed') return NextResponse.json({ error: 'Analyse non terminée' }, { status: 400 })

  // Retourne l'existant ou génère un nouveau
  if (analysis.share_id) {
    return NextResponse.json({ shareId: analysis.share_id })
  }

  const shareId = randomUUID()
  const service = getService()
  await service.from('analyses').update({ share_id: shareId }).eq('id', analysisId)

  return NextResponse.json({ shareId })
}
