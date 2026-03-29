import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { shareSchema } from '@/lib/validations'
import { randomUUID } from 'crypto'

// POST /api/analysis/share — génère un share_id pour une analyse
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  let input: { analysisId: string }
  try {
    input = shareSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'analysisId UUID requis' }, { status: 400 })
  }
  const { analysisId } = input

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
  const service = getServiceClient()
  await service.from('analyses').update({ share_id: shareId }).eq('id', analysisId)

  return NextResponse.json({ shareId })
}
