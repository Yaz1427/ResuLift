'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'

export function DeleteAnalysisButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/analysis/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Analyse supprimée')
      router.push('/dashboard')
    } catch {
      toast.error('Erreur lors de la suppression')
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors'
        )}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-card border border-border/50 rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="font-semibold">Supprimer l&apos;analyse</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Cette action est irréversible. L&apos;analyse et le rapport seront définitivement supprimés.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ variant: 'outline' }), 'flex-1')}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className={cn(buttonVariants(), 'flex-1 bg-red-600 hover:bg-red-700 text-white border-transparent')}
              >
                {loading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
