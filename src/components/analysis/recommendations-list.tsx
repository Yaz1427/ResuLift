import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Recommendation } from '@/types/analysis'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'

interface RecommendationsListProps {
  recommendations: Recommendation[]
}

const impactConfig = {
  high: {
    icon: <AlertTriangle className="h-4 w-4" />,
    className: 'text-red-400 bg-red-500/10 border-red-500/20',
    label: 'High Impact',
  },
  medium: {
    icon: <AlertCircle className="h-4 w-4" />,
    className: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    label: 'Medium Impact',
  },
  low: {
    icon: <Info className="h-4 w-4" />,
    className: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    label: 'Low Impact',
  },
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  const sorted = [...recommendations].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.impact] - order[b.impact]
  })

  return (
    <div className="space-y-3">
      {sorted.map((rec) => {
        const config = impactConfig[rec.impact]
        return (
          <Card key={rec.id} className="border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className={`flex items-center gap-1 text-xs flex-shrink-0 mt-0.5 ${config.className}`}>
                  {config.icon}
                  {config.label}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm mb-1">{rec.title}</p>
                  <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                  <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
                    <p className="text-xs font-medium text-violet-400 mb-1">Action Item</p>
                    <p className="text-sm">{rec.actionItem}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
