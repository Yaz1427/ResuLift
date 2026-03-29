import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient, extractStoragePath } from '@/lib/supabase/service'

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
    .select('id, resume_url, optimized_cv_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!analysis) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const service = getServiceClient()

  // Clean up files from Supabase Storage to prevent orphaned data
  const resumePath = extractStoragePath(analysis.resume_url)
  if (resumePath) {
    await service.storage.from('resumes').remove([resumePath])
  }

  // Suppression via service client (bypass RLS + gère la FK payments → analyses)
  await service.from('payments').delete().eq('analysis_id', id)
  const { error } = await service.from('analyses').delete().eq('id', id)

  if (error) {
    console.error('[delete analysis]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
