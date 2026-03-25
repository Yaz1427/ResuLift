'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AnalysisPollingProps {
  analysisId: string
  initialStatus: string
}

// Chaque étape démarre à un certain moment (en ms) et va jusqu'au suivant
// Total ~18s pour couvrir le temps moyen d'une analyse Claude
const STEPS: { label: string; startMs: number }[] = [
  { label: 'Lecture et extraction du contenu de votre CV...', startMs: 0 },
  { label: "Analyse des exigences de l'offre d'emploi...", startMs: 2500 },
  { label: 'Comparaison des mots-clés et compétences...', startMs: 5500 },
  { label: "Évaluation de la pertinence de l'expérience...", startMs: 9000 },
  { label: 'Génération des recommandations personnalisées...', startMs: 12500 },
  { label: 'Mise en forme du rapport final...', startMs: 16000 },
]

// La barre atteint 88% au dernier step, puis monte lentement jusqu'à 95% max
const STEP_PROGRESS = [0, 15, 30, 50, 65, 80]
const MAX_IDLE_PROGRESS = 95
const IDLE_CREEP_PER_TICK = 0.03 // % par 100ms après le dernier step
const TIMEOUT_MS = 3 * 60 * 1000

export function AnalysisPolling({ analysisId, initialStatus }: AnalysisPollingProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const [done, setDone] = useState(false)
  const startTime = useRef(Date.now())

  // Tick toutes les 100ms pour animer la barre et avancer les étapes
  useEffect(() => {
    if (done) return

    const tick = setInterval(() => {
      const elapsed = Date.now() - startTime.current

      // Détermine l'étape courante
      let currentStep = 0
      for (let i = STEPS.length - 1; i >= 0; i--) {
        if (elapsed >= STEPS[i].startMs) { currentStep = i; break }
      }
      setStepIndex(currentStep)

      // Calcule la progression
      const isLastStep = currentStep === STEPS.length - 1
      if (isLastStep) {
        // Après le dernier step, rampe lentement vers MAX_IDLE_PROGRESS
        setProgress(prev =>
          prev < MAX_IDLE_PROGRESS ? Math.min(prev + IDLE_CREEP_PER_TICK, MAX_IDLE_PROGRESS) : prev
        )
      } else {
        // Interpolation linéaire entre ce step et le suivant
        const stepStart = STEPS[currentStep].startMs
        const stepEnd = STEPS[currentStep + 1].startMs
        const stepProg = STEP_PROGRESS[currentStep]
        const nextProg = STEP_PROGRESS[currentStep + 1]
        const ratio = Math.min((elapsed - stepStart) / (stepEnd - stepStart), 1)
        const interpolated = stepProg + ratio * (nextProg - stepProg)
        setProgress(interpolated)
      }
    }, 100)

    return () => clearInterval(tick)
  }, [done])

  // Timeout de 3 minutes
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [])

  // Polling API toutes les 3s
  useEffect(() => {
    if (status === 'completed' || status === 'failed') return

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/analysis/${analysisId}/status`)
        const data = await res.json()
        setStatus(data.status)
        if (data.status === 'completed') {
          clearInterval(poll)
          setDone(true)
          setProgress(100)
          toast.success('Analyse terminée !')
          setTimeout(() => router.push(`/dashboard/analysis/${analysisId}`), 600)
        } else if (data.status === 'failed') {
          clearInterval(poll)
          setDone(true)
          toast.error("L'analyse a échoué")
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

  const isCompleted = status === 'completed'

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Card className="border-border/50 w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          {/* Icône */}
          <div className="flex justify-center mb-6">
            {isCompleted ? (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            ) : (
              <div className="relative h-12 w-12">
                <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                  <circle
                    cx="24" cy="24" r="20"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-violet-400">
                  {Math.round(progress)}%
                </span>
              </div>
            )}
          </div>

          {/* Titre */}
          <h2 className="text-xl font-bold mb-1">
            {isCompleted ? 'Analyse terminée !' : 'Analyse de votre CV en cours'}
          </h2>

          {/* Étape courante */}
          <p className="text-muted-foreground text-sm mb-6 min-h-[20px]">
            {isCompleted ? 'Redirection vers vos résultats...' : STEPS[stepIndex].label}
          </p>

          {/* Barre de progression */}
          <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-violet-600 transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Liste des étapes */}
          <div className="mt-6 space-y-2 text-left">
            {STEPS.map((step, i) => {
              const isDone = i < stepIndex || isCompleted
              const isCurrent = i === stepIndex && !isCompleted
              return (
                <div key={i} className={cn(
                  'flex items-center gap-2 text-xs transition-colors duration-300',
                  isDone ? 'text-green-500' : isCurrent ? 'text-foreground' : 'text-muted-foreground/40'
                )}>
                  <span className={cn(
                    'h-1.5 w-1.5 rounded-full flex-shrink-0',
                    isDone ? 'bg-green-500' : isCurrent ? 'bg-violet-500' : 'bg-muted-foreground/30'
                  )} />
                  {step.label}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
