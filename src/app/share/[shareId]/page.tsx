import { notFound } from 'next/navigation'
import { getServiceClient } from '@/lib/supabase/service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScoreGauge } from '@/components/analysis/score-gauge'
import { formatDate } from '@/lib/utils'
import type { AnalysisResult } from '@/types/analysis'
import type { Analysis } from '@/types/database'
import { FileText, Lock } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ shareId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareId } = await params
  return {
    title: `Résultat d'analyse partagé — ResuLift`,
    description: `Consultez le score ATS et l'analyse de CV partagés via ResuLift.`,
    openGraph: {
      title: `Résultat d'analyse — ResuLift`,
      description: `Score ATS et analyse détaillée de CV partagés via ResuLift.`,
    },
  }
}

export default async function SharePage({ params }: PageProps) {
  const { shareId } = await params

  const supabase = getServiceClient()
  const { data: rawAnalysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('share_id', shareId)
    .eq('status', 'completed')
    .single()

  if (!rawAnalysis) notFound()

  const analysis = rawAnalysis as Analysis
  const result = analysis.result as AnalysisResult | null
  if (!result) notFound()

  const categoryLabels: Record<string, string> = {
    keywordsMatch: 'Mots-clés',
    formatStructure: 'Format & Structure',
    experienceRelevance: 'Expérience',
    skillsAlignment: 'Compétences',
    impactStatements: 'Impact',
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar minimal */}
      <header className="border-b border-border/40 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-violet-500" />
          <span className="font-bold">ResuLift</span>
        </Link>
        <Link href="/signup" className="text-sm text-violet-400 hover:underline">
          Analyser mon CV →
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{analysis.job_title ?? "Résultat d'analyse"}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {analysis.job_company && (
              <span className="text-muted-foreground">{analysis.job_company}</span>
            )}
            <span className="text-muted-foreground text-sm">• {formatDate(analysis.created_at)}</span>
            <Badge variant="outline" className="capitalize text-xs">{analysis.type}</Badge>
          </div>
        </div>

        {/* Score */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ScoreGauge score={analysis.ats_score ?? 0} size={180} />
              <div className="flex-1">
                <p className="text-muted-foreground leading-relaxed mb-4">{result.summary}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(result.categories).map(([key, cat]) => (
                    <div key={key} className="bg-muted/30 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold">{cat.score}</div>
                      <div className="text-xs text-muted-foreground">{categoryLabels[key] ?? key}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Locked premium content notice */}
        <div className="rounded-xl border border-border/50 bg-muted/20 px-5 py-4 flex items-center gap-3">
          <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Recommandations et détails réservés au propriétaire</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Analysez votre propre CV pour obtenir les recommandations complètes, l&apos;analyse par catégorie et les keywords manquants.
            </p>
          </div>
          <Link href="/signup" className="ml-auto text-xs text-violet-400 hover:underline flex-shrink-0">
            Essayer →
          </Link>
        </div>
      </main>
    </div>
  )
}

export const dynamic = 'force-dynamic'
