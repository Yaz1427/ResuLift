'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface AnalysisPollingProps {
  analysisId: string
  initialStatus: string
}

const steps = [
  'Parsing your resume...',
  'Analyzing job requirements...',
  'Matching keywords...',
  'Evaluating experience relevance...',
  'Generating recommendations...',
  'Finalizing your report...',
]

export function AnalysisPolling({ analysisId, initialStatus }: AnalysisPollingProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [stepIndex, setStepIndex] = useState(0)

  // Cycle through steps for UX
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(prev => (prev + 1) % steps.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Poll for status
  useEffect(() => {
    if (status === 'completed' || status === 'failed') return

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/analysis/${analysisId}/status`)
        const data = await res.json()
        setStatus(data.status)
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(poll)
          router.push(`/dashboard/analysis/${analysisId}`)
        }
      } catch {
        // silently retry
      }
    }, 3000)

    return () => clearInterval(poll)
  }, [analysisId, status, router])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Card className="border-border/50 w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="flex justify-center mb-6">
            {status === 'completed' ? (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            ) : (
              <Loader2 className="h-12 w-12 text-violet-500 animate-spin" />
            )}
          </div>
          <h2 className="text-xl font-bold mb-2">
            {status === 'completed' ? 'Analysis Complete!' : 'Analyzing Your Resume'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {status === 'completed'
              ? 'Redirecting to your results...'
              : steps[stepIndex]
            }
          </p>
          <div className="mt-6 flex justify-center gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-6 rounded-full transition-all duration-300 ${
                  i === stepIndex ? 'bg-violet-500' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
