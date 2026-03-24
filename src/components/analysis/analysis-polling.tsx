'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'

interface AnalysisPollingProps {
  analysisId: string
  initialStatus: string
}

const steps = [
  'Lecture de votre CV...',
  'Analyse des exigences du poste...',
  'Correspondance des mots-clés...',
  'Évaluation de la pertinence...',
  'Génération des recommandations...',
  'Finalisation du rapport...',
]

const TIMEOUT_MS = 3 * 60 * 1000 // 3 minutes

export function AnalysisPolling({ analysisId, initialStatus }: AnalysisPollingProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [stepIndex, setStepIndex] = useState(0)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(prev => (prev + 1) % steps.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => setTimedOut(true), TIMEOUT_MS)
    return () => clearTimeout(timeout)
  }, [])

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

  if (timedOut) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Card className="border-border/50 w-full max-w-md">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-center mb-6">
              <Clock className="h-12 w-12 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">L&apos;analyse prend plus de temps que prévu</h2>
            <p className="text-muted-foreground text-sm mb-6">
              L&apos;analyse est toujours en cours. Revenez dans quelques minutes — vous trouverez le résultat dans votre tableau de bord.
            </p>
            <Link href="/dashboard" className={cn(buttonVariants(), 'bg-violet-600 hover:bg-violet-700 text-white border-transparent')}>
              Retour au tableau de bord
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            {status === 'completed' ? 'Analyse terminée !' : 'Analyse de votre CV en cours'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {status === 'completed' ? 'Redirection vers vos résultats...' : steps[stepIndex]}
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
