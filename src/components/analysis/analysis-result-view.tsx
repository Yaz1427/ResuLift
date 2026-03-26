'use client'

import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScoreGauge } from '@/components/analysis/score-gauge'
import { CategoryCard } from '@/components/analysis/category-card'
import { RecommendationsList } from '@/components/analysis/recommendations-list'
import { OptimizedBullets, KeywordSuggestions } from '@/components/analysis/optimized-bullets'
import { CVPreviewButton } from '@/components/analysis/cv-preview-button'
import { ResumePreviewButton } from '@/components/analysis/resume-preview-button'
import { ShareButton } from '@/components/analysis/share-button'
import { useLang } from '@/components/shared/language-provider'
import { formatDate, cn } from '@/lib/utils'
import type { AnalysisResult } from '@/types/analysis'
import type { Analysis } from '@/types/database'
import {
  PlusCircle, Download, BarChart3, Target, Award, TrendingUp, Lightbulb, Sparkles
} from 'lucide-react'

interface Props {
  analysis: Analysis
  result: AnalysisResult
  analysisId: string
}

function getPotentialScore(current: number): number {
  const gain = current < 50 ? 25 : current < 70 ? 20 : 15
  return Math.min(current + gain, 98)
}

export function AnalysisResultView({ analysis, result, analysisId }: Props) {
  const { T } = useLang()
  const isPremium = analysis.type === 'premium'
  const potentialScore = getPotentialScore(analysis.ats_score ?? 0)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {analysis.job_title ?? T.analysisResult}
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
          <ResumePreviewButton analysisId={analysisId} filename={analysis.resume_filename ?? 'cv'} />
          <ShareButton analysisId={analysisId} />
          <Link
            href={`/dashboard/analysis/${analysisId}/report`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            <Download className="mr-2 h-4 w-4" /> {T.downloadReport}
          </Link>
          <Link
            href="/dashboard/new"
            className={cn(buttonVariants({ size: 'sm' }), 'bg-violet-600 hover:bg-violet-700 text-white border-transparent')}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> {T.newAnalysis}
          </Link>
        </div>
      </div>

      {/* Premium banner */}
      {isPremium && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <Sparkles className="h-5 w-5 text-violet-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-violet-300">{T.optimizedCvAvailable}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{T.optimizedCvBannerDesc}</p>
          </div>
          <CVPreviewButton analysisId={analysisId} />
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

              <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 mb-4 flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-green-400 flex-shrink-0" />
                <p className="text-xs text-green-400">
                  {T.potentialScoreText}{' '}
                  <span className="font-bold text-green-300">{potentialScore}/100</span>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: T.catKeywords, score: result.categories.keywordsMatch.score },
                  { label: T.catFormat, score: result.categories.formatStructure.score },
                  { label: T.catExperience, score: result.categories.experienceRelevance.score },
                  { label: T.catSkills, score: result.categories.skillsAlignment.score },
                  { label: T.catImpact, score: result.categories.impactStatements.score },
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
        <TabsList className="bg-muted/30 flex-wrap h-auto gap-1">
          <TabsTrigger value="categories">{T.categories}</TabsTrigger>
          <TabsTrigger value="recommendations">
            {T.recommendations} ({result.recommendations.length})
          </TabsTrigger>
          {isPremium && (
            <>
              <TabsTrigger value="bullets">{T.optimizedBullets}</TabsTrigger>
              <TabsTrigger value="keywords">{T.keywordSuggestions}</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <CategoryCard title={T.catKeywords} icon={<Target className="h-4 w-4" />} data={result.categories.keywordsMatch} />
            <CategoryCard title={T.catFormat} icon={<BarChart3 className="h-4 w-4" />} data={result.categories.formatStructure} />
            <CategoryCard title={T.catExperience} icon={<TrendingUp className="h-4 w-4" />} data={result.categories.experienceRelevance} />
            <CategoryCard title={T.catSkills} icon={<Award className="h-4 w-4" />} data={result.categories.skillsAlignment} />
            <CategoryCard title={T.catImpact} icon={<Lightbulb className="h-4 w-4" />} data={result.categories.impactStatements} />
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <RecommendationsList recommendations={result.recommendations} />
        </TabsContent>

        {isPremium && result.optimizedBulletPoints && (
          <TabsContent value="bullets" className="mt-6">
            <div className="mb-4">
              <h3 className="font-semibold">{T.rewrittenBulletsTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1">{T.rewrittenBulletsDesc}</p>
            </div>
            <OptimizedBullets bullets={result.optimizedBulletPoints} />
            {result.profileGapAnalysis && (
              <Card className="border-border/50 mt-6">
                <CardHeader><CardTitle className="text-sm">{T.profileGapTitle}</CardTitle></CardHeader>
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
              <h3 className="font-semibold">{T.keywordGuideTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1">{T.keywordGuideDesc}</p>
            </div>
            <KeywordSuggestions suggestions={result.missingKeywordsIntegration} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
