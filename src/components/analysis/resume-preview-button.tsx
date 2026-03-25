'use client'

import { useState } from 'react'
import { FileText, X, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ResumePreviewButtonProps {
  analysisId: string
  filename: string
}

export function ResumePreviewButton({ analysisId, filename }: ResumePreviewButtonProps) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  const isPdf = filename.toLowerCase().endsWith('.pdf')

  async function handleOpen() {
    if (fileUrl) { setOpen(true); return }  // already loaded
    setLoading(true)
    try {
      const res = await fetch(`/api/resume-preview/${analysisId}`)
      if (!res.ok) throw new Error('Impossible de charger le fichier')
      const blob = await res.blob()
      setFileUrl(URL.createObjectURL(blob))
      setOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!fileUrl) return
    const a = document.createElement('a')
    a.href = fileUrl
    a.download = filename
    a.click()
  }

  function handleClose() {
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        disabled={loading}
        className="gap-2"
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <FileText className="h-4 w-4" />
        }
        Mon CV
      </Button>

      {open && fileUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-md bg-muted/50 flex items-center justify-center">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">CV original</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{filename}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Télécharger
              </Button>
              <div className="w-px h-5 bg-border/60 mx-1" />
              <Button size="sm" variant="ghost" onClick={handleClose} className="gap-1.5">
                <X className="h-4 w-4" /> Fermer
              </Button>
            </div>
          </div>

          {/* Viewer */}
          <div className="flex-1 bg-zinc-900 overflow-hidden">
            {isPdf ? (
              <iframe
                src={fileUrl}
                className="w-full h-full border-0"
                title="CV original"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-6">
                <FileText className="h-12 w-12 text-muted-foreground/40" />
                <div>
                  <p className="font-medium">Fichier Word (.docx)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    La prévisualisation des fichiers Word n&apos;est pas disponible dans le navigateur.
                  </p>
                </div>
                <Button onClick={handleDownload} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" /> Télécharger pour ouvrir dans Word
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
