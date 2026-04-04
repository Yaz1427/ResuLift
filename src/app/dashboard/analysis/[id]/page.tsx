import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/lib/button-variants'
import { AnalysisPolling } from '@/components/analysis/analysis-polling'
import { RetryAnalysisButton } from '@/components/analysis/retry-button'
import { AnalysisResultView } from '@/components/analysis/analysis-result-view'
import { cn } from '@/lib/utils'
import type { AnalysisResult } from '@/types/analysis'
import type { Analysis } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: "Résultat d'analyse — ResuLift" }

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string }>
}

export default async function AnalysisResultPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawAnalysis } = await supabase
    .from('analyses')
    .select('id, user_id, type, status, ats_score, result, job_title, job_company, resume_url, resume_filename, job_description, target_country, seniority_level, share_id, optimized_cv_url, created_at, completed_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!rawAnalysis) notFound()

  const analysis = rawAnalysis as Analysis

  if (analysis.status === 'processing' || analysis.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto">
        <AnalysisPolling analysisId={id} initialStatus={analysis.status} />
      </div>
    )
  }

  if (analysis.status === 'failed') {
    const errorMsg = (analysis.result as { error?: string } | null)?.error
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-2xl font-bold mb-2">L&apos;analyse a échoué</h1>
        <p className="text-muted-foreground mb-2">
          Quelque chose s&apos;est mal passé pendant l&apos;analyse de votre CV.
        </p>
        <p className="text-sm text-muted-foreground/60 mb-4">
          Poste visé : <span className="text-foreground/70">{analysis.job_title ?? 'Non renseigné'}</span>
          {analysis.job_company && <> · {analysis.job_company}</>}
        </p>
        {errorMsg && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400 max-w-md mx-auto">
            {errorMsg}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <RetryAnalysisButton id={id} />
          <Link href="/dashboard/new" className={cn(buttonVariants({ variant: 'outline' }))}>
            Nouvelle analyse
          </Link>
          <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghost' }))}>
            Tableau de bord
          </Link>
        </div>
      </div>
    )
  }

  const result = analysis.result as AnalysisResult | null
  if (!result) notFound()

  return <AnalysisResultView analysis={analysis} result={result} analysisId={id} />
}

export const dynamic = 'force-dynamic'
