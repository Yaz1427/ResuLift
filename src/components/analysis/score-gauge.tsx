'use client'

import { useEffect, useState } from 'react'
import { getScoreLabel, getScoreColor } from '@/lib/utils'

interface ScoreGaugeProps {
  score: number
  size?: number
}

export function ScoreGauge({ score, size = 200 }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const radius = (size - 20) / 2
  const circumference = radius * Math.PI
  // Minimum 4% arc so even very low scores show a visible sliver
  const fillPct = Math.max(animatedScore / 100, 0.04)
  const strokeDashoffset = circumference - fillPct * circumference

  const getColor = (s: number) => {
    if (s >= 80) return '#22c55e'
    if (s >= 60) return '#eab308'
    if (s >= 40) return '#f97316'
    return '#ef4444'
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimatedScore(prev => {
          if (prev >= score) { clearInterval(interval); return score }
          return Math.min(prev + 2, score)
        })
      }, 16)
      return () => clearInterval(interval)
    }, 200)
    return () => clearTimeout(timer)
  }, [score])

  const color = getColor(animatedScore)

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Arc uniquement dans le SVG */}
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        <path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.05s ease-out' }}
        />
      </svg>

      {/* Score + label en HTML pour éviter le chevauchement */}
      <div className="flex flex-col items-center -mt-2">
        <span className="text-5xl font-extrabold leading-none" style={{ color }}>
          {animatedScore}
        </span>
        <span className="text-sm font-medium mt-1" style={{ color }}>
          {getScoreLabel(animatedScore)}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">Score ATS global</span>
      </div>
    </div>
  )
}
