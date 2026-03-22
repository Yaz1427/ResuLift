import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { OptimizedBullet, KeywordSuggestion } from '@/types/analysis'
import { ArrowRight, Sparkles } from 'lucide-react'

interface OptimizedBulletsProps {
  bullets: OptimizedBullet[]
}

interface KeywordSuggestionsProps {
  suggestions: KeywordSuggestion[]
}

export function OptimizedBullets({ bullets }: OptimizedBulletsProps) {
  return (
    <div className="space-y-4">
      {bullets.map((bullet, i) => (
        <Card key={i} className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              Bullet Point {i + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
              <p className="text-xs font-medium text-muted-foreground mb-1">Original</p>
              <p className="text-sm leading-relaxed">{bullet.original}</p>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-violet-400" />
            </div>
            <div className="bg-violet-500/5 rounded-lg p-3 border border-violet-500/20">
              <p className="text-xs font-medium text-violet-400 mb-1">Optimized</p>
              <p className="text-sm leading-relaxed">{bullet.optimized}</p>
            </div>
            {bullet.reasoning && (
              <>
                <Separator />
                <p className="text-xs text-muted-foreground"><span className="font-medium">Why: </span>{bullet.reasoning}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const relevanceConfig = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  important: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'nice-to-have': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
}

export function KeywordSuggestions({ suggestions }: KeywordSuggestionsProps) {
  return (
    <div className="space-y-3">
      {suggestions.map((s, i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className={`text-xs flex-shrink-0 mt-0.5 capitalize ${relevanceConfig[s.relevance]}`}>
                {s.relevance}
              </Badge>
              <div>
                <p className="font-semibold text-sm mb-1">{s.keyword}</p>
                <p className="text-sm text-muted-foreground mb-2">
                  <span className="font-medium text-foreground">Where to add: </span>
                  {s.suggestedPlacement}
                </p>
                <div className="bg-muted/30 rounded-lg p-2 border border-border/30">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Example: </span>{s.exampleUsage}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
