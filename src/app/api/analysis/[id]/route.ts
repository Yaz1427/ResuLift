import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Vérifie que l'analyse appartient bien à l'utilisateur connecté
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: analysis } = await supabase
    .from('analyses')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!analysis) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  // Suppression via service client (bypass RLS + gère la FK payments → analyses)
  const service = getServiceClient()
  await service.from('payments').delete().eq('analysis_id', id)
  const { error } = await service.from('analyses').delete().eq('id', id)

  if (error) {
    console.error('[delete analysis]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
