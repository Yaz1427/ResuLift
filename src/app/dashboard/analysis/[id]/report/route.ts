import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateReportHtml } from '@/lib/pdf-generator'
import type { Analysis } from '@/types/database'
import type { AnalysisResult } from '@/types/analysis'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rawAnalysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!rawAnalysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
  }

  const analysis = rawAnalysis as Analysis

  if (!analysis.result || analysis.status !== 'completed') {
    return NextResponse.json({ error: 'Analysis not completed' }, { status: 400 })
  }

  const html = generateReportHtml(analysis, analysis.result as AnalysisResult)

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="resulift-report-${id.slice(0, 8)}.html"`,
    },
  })
}
