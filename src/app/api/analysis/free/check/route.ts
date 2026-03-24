import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ eligible: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('free_analysis_used')
    .eq('id', user.id)
    .single()

  const used = (profile as { free_analysis_used: boolean } | null)?.free_analysis_used ?? false
  return NextResponse.json({ eligible: !used })
}
