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
            <p className="text-xs font-medium text-green-500 mb-1.5">Found ({data.found.length})</p>
            <div className="flex flex-wrap gap-1">
              {data.found.slice(0, 8).map(item => (
                <Badge key={item} variant="outline" className="text-xs border-green-500/30 text-green-400 bg-green-500/5">
                  {item}
                </Badge>
              ))}
              {data.found.length > 8 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">+{data.found.length - 8} more</Badge>
              )}
            </div>
          </div>
        )}
        {data.missing.length > 0 && (
          <div>
            <p className="text-xs font-medium text-red-500 mb-1.5">Missing ({data.missing.length})</p>
            <div className="flex flex-wrap gap-1">
              {data.missing.slice(0, 8).map(item => (
                <Badge key={item} variant="outline" className="text-xs border-red-500/30 text-red-400 bg-red-500/5">
                  {item}
                </Badge>
              ))}
              {data.missing.length > 8 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">+{data.missing.length - 8} more</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
