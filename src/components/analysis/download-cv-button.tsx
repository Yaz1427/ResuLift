'use client'

import { useState } from 'react'
import { Loader2, FileDown, FileText, CheckCircle2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface DownloadCVButtonProps {
  analysisId: string
}

type Format = 'docx' | 'pdf'

export function DownloadCVButton({ analysisId }: DownloadCVButtonProps) {
  const [loading, setLoading] = useState<Format | null>(null)
  const [done, setDone] = useState<Format | null>(null)

  async function handleDownload(format: Format) {
    setLoading(format)
    try {
      const res = await fetch('/api/generate-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, format }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur de génération')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="(.+?)"/)
      const filename = match?.[1] ?? `CV_Optimise.${format}`

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      setDone(format)
      toast.success(`CV optimisé téléchargé en .${format.toUpperCase()} !`)
      setTimeout(() => setDone(null), 3000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleDownload('docx')}
        disabled={loading !== null}
        className="bg-violet-600 hover:bg-violet-700 text-white border-transparent gap-2"
      >
        {loading === 'docx' ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Génération...</>
        ) : done === 'docx' ? (
          <><CheckCircle2 className="h-4 w-4" /> Téléchargé !</>
        ) : (
          <><FileDown className="h-4 w-4" /> Télécharger (.docx)</>
        )}
      </Button>
      <Button
        onClick={() => handleDownload('pdf')}
        disabled={loading !== null}
        variant="outline"
        className="gap-2 border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
      >
        {loading === 'pdf' ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Génération...</>
        ) : done === 'pdf' ? (
          <><CheckCircle2 className="h-4 w-4" /> Téléchargé !</>
        ) : (
          <><FileText className="h-4 w-4" /> PDF</>
        )}
      </Button>
    </div>
  )
}
