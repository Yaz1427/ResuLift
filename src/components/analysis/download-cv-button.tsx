'use client'

import { useState } from 'react'
import { Loader2, FileDown, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface DownloadCVButtonProps {
  analysisId: string
}

export function DownloadCVButton({ analysisId }: DownloadCVButtonProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const res = await fetch('/api/generate-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur de génération')
      }

      // Déclenche le téléchargement
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="(.+?)"/)
      const filename = match?.[1] ?? 'CV_Optimise.docx'

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      setDone(true)
      toast.success('CV optimisé téléchargé !')
      setTimeout(() => setDone(false), 3000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      className="bg-violet-600 hover:bg-violet-700 text-white border-transparent gap-2"
    >
      {loading ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Génération en cours...</>
      ) : done ? (
        <><CheckCircle2 className="h-4 w-4" /> Téléchargé !</>
      ) : (
        <><FileDown className="h-4 w-4" /> Télécharger mon CV optimisé (.docx)</>
      )}
    </Button>
  )
}
