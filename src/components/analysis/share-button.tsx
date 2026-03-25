'use client'

import { useState } from 'react'
import { Share2, Link2, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ShareButton({ analysisId }: { analysisId: string }) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    setLoading(true)
    try {
      const res = await fetch('/api/analysis/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')

      const url = `${window.location.origin}/share/${data.shareId}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Lien copié dans le presse-papier !')
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : copied ? (
        <><Check className="h-4 w-4 mr-1" /> Copié !</>
      ) : (
        <><Share2 className="h-4 w-4 mr-1" /> Partager</>
      )}
    </Button>
  )
}
