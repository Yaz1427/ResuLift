import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/lib/button-variants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, BarChart3, TrendingUp, FileText, Eye, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate, getScoreColor, cn } from '@/lib/utils'
import { DeleteAnalysisButton } from '@/components/analysis/delete-button'
import type { Analysis } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tableau de bord — ResuLift' }

const PAGE_SIZE = 10

interface PageProps {
  searchParams: Promise<{ page?: string; type?: string; status?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { page: pageParam, type: typeFilter, status: statusFilter } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1') || 1)
  const offset = (page - 1) * PAGE_SIZE

  // Build filtered query
  let query = supabase
    .from('analyses')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (typeFilter && (typeFilter === 'basic' || typeFilter === 'premium')) {
    query = query.eq('type', typeFilter)
  }
  if (statusFilter && ['completed', 'failed', 'processing', 'pending'].includes(statusFilter)) {
    query = query.eq('status', statusFilter)
  }

  const { data: rawAnalyses, count } = await query.range(offset, offset + PAGE_SIZE - 1)

  const analyses = (rawAnalyses ?? []) as Analysis[]
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Stats (always from all completed)
  const { data: allCompleted } = await supabase
    .from('analyses')
    .select('ats_score, status')
    .eq('user_id', user.id)
  const completedAll = (allCompleted ?? []).filter(a => a.status === 'completed')
  const avgScore = completedAll.length > 0
    ? Math.round(completedAll.reduce((sum, a) => sum + (a.ats_score ?? 0), 0) / completedAll.length)
    : null
  const { count: totalCount } = await supabase
    .from('analyses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const statusLabels: Record<string, string> = {
    completed: 'Terminé',
    processing: 'En cours',
    pending: 'En attente',
    failed: 'Échoué',
  }
  const statusColors: Record<string, string> = {
    completed: 'bg-green-500/10 text-green-500 border-green-500/20',
    processing: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    pending: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    failed: 'bg-red-500/10 text-red-500 border-red-500/20',
  }

  function filterHref(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const merged = { page: '1', type: typeFilter, status: statusFilter, ...params }
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v)
    }
    return `/dashboard?${p.toString()}`
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">Suivez et gérez vos analyses de CV</p>
        </div>
        <Link href="/dashboard/new" className={cn(buttonVariants(), 'bg-violet-600 hover:bg-violet-700 text-white border-transparent')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle analyse
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Analyses au total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Score ATS moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${avgScore ? getScoreColor(avgScore) : ''}`}>
              {avgScore ?? '—'}
              {avgScore && <span className="text-lg text-muted-foreground">/100</span>}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Terminées</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedAll.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-muted-foreground">Filtrer :</span>
        <Link href={filterHref({ type: undefined })} className={cn(
          'text-xs px-3 py-1.5 rounded-full border transition-colors',
          !typeFilter ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'border-border/40 text-muted-foreground hover:border-border'
        )}>Tous les types</Link>
        <Link href={filterHref({ type: 'basic' })} className={cn(
          'text-xs px-3 py-1.5 rounded-full border transition-colors',
          typeFilter === 'basic' ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'border-border/40 text-muted-foreground hover:border-border'
        )}>Basic</Link>
        <Link href={filterHref({ type: 'premium' })} className={cn(
          'text-xs px-3 py-1.5 rounded-full border transition-colors',
          typeFilter === 'premium' ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'border-border/40 text-muted-foreground hover:border-border'
        )}>Premium</Link>
        <span className="text-border/40">|</span>
        <Link href={filterHref({ status: undefined })} className={cn(
          'text-xs px-3 py-1.5 rounded-full border transition-colors',
          !statusFilter ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'border-border/40 text-muted-foreground hover:border-border'
        )}>Tous les statuts</Link>
        {['completed', 'failed', 'processing'].map(s => (
          <Link key={s} href={filterHref({ status: s })} className={cn(
            'text-xs px-3 py-1.5 rounded-full border transition-colors',
            statusFilter === s ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'border-border/40 text-muted-foreground hover:border-border'
          )}>{statusLabels[s]}</Link>
        ))}
      </div>

      {/* Analyses table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>
            Analyses
            {total > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({total} résultat{total > 1 ? 's' : ''})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analyses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {typeFilter || statusFilter
                  ? 'Aucune analyse ne correspond à ces filtres.'
                  : "Aucune analyse pour l'instant. Chargez votre premier CV pour commencer."}
              </p>
              {!typeFilter && !statusFilter && (
                <Link href="/dashboard/new" className={cn(buttonVariants(), 'bg-violet-600 hover:bg-violet-700 text-white border-transparent')}>
                  Lancer ma première analyse
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium">Date</th>
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium">Poste</th>
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium">Type</th>
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium">Score</th>
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium">Statut</th>
                      <th className="text-left py-3 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.map(analysis => (
                      <tr key={analysis.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-2 text-muted-foreground">{formatDate(analysis.created_at)}</td>
                        <td className="py-3 px-2">
                          <div className="font-medium">{analysis.job_title ?? 'Sans titre'}</div>
                          {analysis.job_company && (
                            <div className="text-xs text-muted-foreground">{analysis.job_company}</div>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="capitalize text-xs">
                            {analysis.type === 'basic' ? 'Basique' : 'Premium'}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          {analysis.ats_score != null ? (
                            <span className={`font-bold ${getScoreColor(analysis.ats_score)}`}>
                              {analysis.ats_score}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className={`text-xs ${statusColors[analysis.status] ?? ''}`}>
                            {statusLabels[analysis.status] ?? analysis.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          {analysis.status === 'completed' && (
                            <Link href={`/dashboard/analysis/${analysis.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                              <Eye className="h-4 w-4 mr-1" /> Voir
                            </Link>
                          )}
                          {(analysis.status === 'processing' || analysis.status === 'pending') && (
                            <Link href={`/dashboard/analysis/${analysis.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-yellow-500 hover:text-yellow-400')}>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Suivre
                            </Link>
                          )}
                          {analysis.status === 'failed' && (
                            <Link href={`/dashboard/analysis/${analysis.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-red-500 hover:text-red-400')}>
                              <AlertCircle className="h-4 w-4 mr-1" /> Détails
                            </Link>
                          )}
                          <DeleteAnalysisButton id={analysis.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">
                    Page {page} sur {totalPages}
                  </span>
                  <div className="flex gap-2">
                    {page > 1 ? (
                      <Link href={filterHref({ page: String(page - 1) })} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                        <ChevronLeft className="h-4 w-4" />
                      </Link>
                    ) : (
                      <button disabled className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'opacity-40')}>
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    )}
                    {page < totalPages ? (
                      <Link href={filterHref({ page: String(page + 1) })} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <button disabled className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'opacity-40')}>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const dynamic = 'force-dynamic'
