import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/lib/button-variants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScoreGauge } from '@/components/analysis/score-gauge'
import { CategoryCard } from '@/components/analysis/category-card'
import { RecommendationsList } from '@/components/analysis/recommendations-list'
import { OptimizedBullets, KeywordSuggestions } from '@/components/analysis/optimized-bullets'
import { AnalysisPolling } from '@/components/analysis/analysis-polling'
import { RetryAnalysisButton } from '@/components/analysis/retry-button'
import { CVPreviewButton } from '@/components/analysis/cv-preview-button'
import { ShareButton } from '@/components/analysis/share-button'
import { formatDate, cn } from '@/lib/utils'
import type { AnalysisResult } from '@/types/analysis'
import type { Analysis } from '@/types/database'
import {
  PlusCircle, Download, BarChart3, Target, Award, TrendingUp, Lightbulb, Sparkles
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: "Résultat d'analyse — ResuLift" }

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string }>
}

function getPotentialScore(current: number): number {
  const gain = current < 50 ? 25 : current < 70 ? 20 : 15
  return Math.min(current + gain, 98)
}

export default async function AnalysisResultPage({ params }: PageProps) {
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

  const isPremium = analysis.type === 'premium'
  const potentialScore = getPotentialScore(analysis.ats_score ?? 0)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {analysis.job_title ?? "Résultat d'analyse"}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {analysis.job_company && (
              <span className="text-muted-foreground">{analysis.job_company}</span>
            )}
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground text-sm">{formatDate(analysis.created_at)}</span>
            <Badge variant="outline" className="capitalize text-xs">
              {analysis.type}
            </Badge>
            {isPremium && (
              <Badge className="bg-violet-600/20 text-violet-300 border-violet-500/30 text-xs">
                ✦ Premium
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ShareButton analysisId={id} />
          <Link
            href={`/dashboard/analysis/${id}/report`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            <Download className="mr-2 h-4 w-4" /> Rapport PDF
          </Link>
          <Link
            href="/dashboard/new"
            className={cn(buttonVariants({ size: 'sm' }), 'bg-violet-600 hover:bg-violet-700 text-white border-transparent')}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Nouvelle analyse
          </Link>
        </div>
      </div>

      {/* Premium banner avec bouton téléchargement CV */}
      {isPremium && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <Sparkles className="h-5 w-5 text-violet-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-violet-300">CV optimisé disponible</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vos bullet points ont été réécrits par Claude AI avec les mots-clés du poste intégrés. Téléchargez votre nouveau CV prêt à envoyer.
            </p>
          </div>
          <CVPreviewButton analysisId={id} />
        </div>
      )}

      {/* Score Overview */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex flex-col items-center">
              <ScoreGauge score={analysis.ats_score ?? 0} size={200} />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground leading-relaxed mb-4">{result.summary}</p>

              {/* Potential score indicator */}
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 mb-4 flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-green-400 flex-shrink-0" />
                <p className="text-xs text-green-400">
                  Avec les recommandations appliquées, votre score pourrait atteindre{' '}
                  <span className="font-bold text-green-300">{potentialScore}/100</span>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Mots-clés', score: result.categories.keywordsMatch.score },
                  { label: 'Format', score: result.categories.formatStructure.score },
                  { label: 'Expérience', score: result.categories.experienceRelevance.score },
                  { label: 'Compétences', score: result.categories.skillsAlignment.score },
                  { label: 'Impact', score: result.categories.impactStatements.score },
                ].map(cat => (
                  <div key={cat.label} className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold">{cat.score}</div>
                    <div className="text-xs text-muted-foreground">{cat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Tabs defaultValue="categories">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="recommendations">
            Recommandations ({result.recommendations.length})
          </TabsTrigger>
          {isPremium && (
            <>
              <TabsTrigger value="bullets">Points optimisés</TabsTrigger>
              <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <CategoryCard title="Mots-clés" icon={<Target className="h-4 w-4" />} data={result.categories.keywordsMatch} />
            <CategoryCard title="Format & Structure" icon={<BarChart3 className="h-4 w-4" />} data={result.categories.formatStructure} />
            <CategoryCard title="Expérience" icon={<TrendingUp className="h-4 w-4" />} data={result.categories.experienceRelevance} />
            <CategoryCard title="Compétences" icon={<Award className="h-4 w-4" />} data={result.categories.skillsAlignment} />
            <CategoryCard title="Impact" icon={<Lightbulb className="h-4 w-4" />} data={result.categories.impactStatements} />
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <RecommendationsList recommendations={result.recommendations} />
        </TabsContent>

        {isPremium && result.optimizedBulletPoints && (
          <TabsContent value="bullets" className="mt-6">
            <div className="mb-4">
              <h3 className="font-semibold">Points réécrits par l&apos;IA</h3>
              <p className="text-sm text-muted-foreground mt-1">Vos bullet points réécrits avec les mots-clés intégrés et un langage plus percutant</p>
            </div>
            <OptimizedBullets bullets={result.optimizedBulletPoints} />
            {result.profileGapAnalysis && (
              <Card className="border-border/50 mt-6">
                <CardHeader><CardTitle className="text-sm">Analyse des lacunes du profil</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.profileGapAnalysis}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {isPremium && result.missingKeywordsIntegration && (
          <TabsContent value="keywords" className="mt-6">
            <div className="mb-4">
              <h3 className="font-semibold">Guide d&apos;intégration des mots-clés manquants</h3>
              <p className="text-sm text-muted-foreground mt-1">Comment et où ajouter les mots-clés manquants dans votre CV</p>
            </div>
            <KeywordSuggestions suggestions={result.missingKeywordsIntegration} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export const dynamic = 'force-dynamic'
