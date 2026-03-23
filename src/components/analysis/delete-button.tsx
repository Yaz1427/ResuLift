'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'

export function DeleteAnalysisButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Supprimer cette analyse ? Cette action est irréversible.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/analysis/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Analyse supprimée')
      router.push('/dashboard')
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'sm' }),
        'text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors'
      )}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
