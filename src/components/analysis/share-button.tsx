'use client'

import { useState } from 'react'
import { Share2, Check, Loader2, Link2Off } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ShareButtonProps {
  analysisId: string
  /** Pass true if the analysis already has a share_id (to show the revoke button immediately) */
  isShared?: boolean
}

export function ShareButton({ analysisId, isShared = false }: ShareButtonProps) {
  const [loading, setLoading]     = useState(false)
  const [revoking, setRevoking]   = useState(false)
  const [copied, setCopied]       = useState(false)
  const [shared, setShared]       = useState(isShared)

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
      setShared(true)
      toast.success('Lien copié dans le presse-papier !')
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  async function handleRevoke() {
    setRevoking(true)
    try {
      const res = await fetch('/api/analysis/share', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur')
      }
      setShared(false)
      toast.success('Lien de partage révoqué.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleShare} disabled={loading || revoking}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : copied ? (
          <><Check className="h-4 w-4 mr-1" /> Copié !</>
        ) : (
          <><Share2 className="h-4 w-4 mr-1" /> Partager</>
        )}
      </Button>

      {shared && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRevoke}
          disabled={revoking || loading}
          className="text-muted-foreground hover:text-red-400"
          title="Révoquer le lien de partage"
        >
          {revoking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Link2Off className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  )
}
