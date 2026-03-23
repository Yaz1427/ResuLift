import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Vérifie que l'analyse appartient bien à l'utilisateur
  const { data: analysis } = await supabase
    .from('analyses')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!analysis) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  await supabase.from('analyses').delete().eq('id', id)

  return NextResponse.json({ success: true })
}
