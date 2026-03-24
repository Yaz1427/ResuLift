import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { CategoryResult } from '@/types/analysis'

interface CategoryCardProps {
  title: string
  icon: React.ReactNode
  data: CategoryResult
}

export function CategoryCard({ title, icon, data }: CategoryCardProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-violet-400">{icon}</div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <span className="text-lg font-bold">{data.score}<span className="text-sm text-muted-foreground">/100</span></span>
        </div>
        <Progress value={data.score} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{data.feedback}</p>
        {data.found.length > 0 && (
          <div>
            <p className="text-xs font-medium text-green-500 mb-1.5">Présent ({data.found.length})</p>
            <div className="flex flex-wrap gap-1">
              {data.found.slice(0, 8).map(item => (
                <span
                  key={item}
                  title={item}
                  className="inline-block max-w-[180px] truncate text-xs px-2 py-0.5 rounded-full border border-green-500/30 text-green-400 bg-green-500/5"
                >
                  {item}
                </span>
              ))}
              {data.found.length > 8 && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-border/40 text-muted-foreground">
                  +{data.found.length - 8} de plus
                </span>
              )}
            </div>
          </div>
        )}
        {data.missing.length > 0 && (
          <div>
            <p className="text-xs font-medium text-red-500 mb-1.5">Manquant ({data.missing.length})</p>
            <div className="flex flex-wrap gap-1">
              {data.missing.slice(0, 8).map(item => (
                <span
                  key={item}
                  title={item}
                  className="inline-block max-w-[180px] truncate text-xs px-2 py-0.5 rounded-full border border-red-500/30 text-red-400 bg-red-500/5"
                >
                  {item}
                </span>
              ))}
              {data.missing.length > 8 && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-border/40 text-muted-foreground">
                  +{data.missing.length - 8} de plus
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
