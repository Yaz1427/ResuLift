import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: rawAnalysis } = await supabase
    .from('analyses')
    .select('status, ats_score')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!rawAnalysis) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const analysis = rawAnalysis as { status: string; ats_score: number | null }

  return NextResponse.json({
    status: analysis.status,
    atsScore: analysis.ats_score,
  })
}
