'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { CategoryResult } from '@/types/analysis'

interface CategoryCardProps {
  title: string
  icon: React.ReactNode
  data: CategoryResult
}

const SHOW_MAX = 5

export function CategoryCard({ title, icon, data }: CategoryCardProps) {
  const [expandedFound, setExpandedFound] = useState(false)
  const [expandedMissing, setExpandedMissing] = useState(false)

  const visibleFound = expandedFound ? data.found : data.found.slice(0, SHOW_MAX)
  const visibleMissing = expandedMissing ? data.missing : data.missing.slice(0, SHOW_MAX)

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
        <p className="text-sm text-muted-foreground leading-relaxed">{data.feedback}</p>

        {data.found.length > 0 && (
          <div>
            <p className="text-xs font-medium text-green-500 mb-1.5">Présent ({data.found.length})</p>
            <div className="flex flex-wrap gap-1">
              {visibleFound.map(item => (
                <span
                  key={item}
                  title={item}
                  className="inline-block text-xs px-2 py-0.5 rounded-full border border-green-500/30 text-green-400 bg-green-500/5 whitespace-normal break-words max-w-full"
                >
                  {item}
                </span>
              ))}
            </div>
            {data.found.length > SHOW_MAX && (
              <button
                onClick={() => setExpandedFound(v => !v)}
                className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {expandedFound
                  ? <><ChevronUp className="h-3 w-3" /> Voir moins</>
                  : <><ChevronDown className="h-3 w-3" /> Voir les {data.found.length - SHOW_MAX} autres</>
                }
              </button>
            )}
          </div>
        )}

        {data.missing.length > 0 && (
          <div>
            <p className="text-xs font-medium text-red-500 mb-1.5">Manquant ({data.missing.length})</p>
            <div className="flex flex-wrap gap-1">
              {visibleMissing.map(item => (
                <span
                  key={item}
                  title={item}
                  className="inline-block text-xs px-2 py-0.5 rounded-full border border-red-500/30 text-red-400 bg-red-500/5 whitespace-normal break-words max-w-full"
                >
                  {item}
                </span>
              ))}
            </div>
            {data.missing.length > SHOW_MAX && (
              <button
                onClick={() => setExpandedMissing(v => !v)}
                className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {expandedMissing
                  ? <><ChevronUp className="h-3 w-3" /> Voir moins</>
                  : <><ChevronDown className="h-3 w-3" /> Voir les {data.missing.length - SHOW_MAX} autres</>
                }
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
