'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'

export function RetryAnalysisButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRetry() {
    setLoading(true)
    try {
      const res = await fetch(`/api/analysis/${id}/retry`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur')
      }
      toast.success('Analyse relancée !')
      router.push(`/dashboard/analysis/${id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du retry')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRetry}
      disabled={loading}
      className={cn(buttonVariants(), 'bg-violet-600 hover:bg-violet-700 text-white border-transparent')}
    >
      <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
      {loading ? 'Relance en cours...' : 'Réessayer'}
    </button>
  )
}
