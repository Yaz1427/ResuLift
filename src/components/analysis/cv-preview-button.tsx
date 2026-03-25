'use client'

import { useState, useEffect } from 'react'
import { Loader2, Eye, FileDown, FileText, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CVPreviewButtonProps {
  analysisId: string
}

export function CVPreviewButton({ analysisId }: CVPreviewButtonProps) {
  const [loading, setLoading]   = useState<'preview' | 'docx' | null>(null)
  const [pdfUrl, setPdfUrl]     = useState<string | null>(null)
  const [pdfBlob, setPdfBlob]   = useState<Blob | null>(null)
  const [pdfName, setPdfName]   = useState('CV_Optimise.pdf')
  const [iframeOk, setIframeOk] = useState(true)

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl) }
  }, [pdfUrl])

  async function handlePreview() {
    setLoading('preview')
    try {
      const res = await fetch('/api/generate-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, format: 'pdf' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur de génération')
      }

      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="(.+?)"/)
      const filename = match?.[1] ?? 'CV_Optimise.pdf'

      const url = URL.createObjectURL(blob)
      setPdfBlob(blob)
      setPdfUrl(url)
      setPdfName(filename)
      setIframeOk(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      setLoading(null)
    }
  }

  function downloadPdf() {
    if (!pdfUrl) return
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = pdfName
    a.click()
    toast.success('CV téléchargé en PDF !')
  }

  async function downloadDocx() {
    setLoading('docx')
    try {
      const res = await fetch('/api/generate-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, format: 'docx' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur')
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="(.+?)"/)
      const filename = match?.[1] ?? 'CV_Optimise.docx'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CV téléchargé en DOCX !')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(null)
    }
  }

  function closePreview() {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfUrl(null)
    setPdfBlob(null)
  }

  return (
    <>
      <Button
        onClick={handlePreview}
        disabled={loading !== null}
        className="bg-violet-600 hover:bg-violet-700 text-white border-transparent gap-2"
      >
        {loading === 'preview' ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Génération en cours...</>
        ) : (
          <><Eye className="h-4 w-4" /> Aperçu du CV optimisé</>
        )}
      </Button>

      {/* Full-screen preview overlay */}
      {pdfUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-md bg-violet-600/15 flex items-center justify-center">
                <FileText className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">CV optimisé ATS</p>
                <p className="text-xs text-muted-foreground">{pdfName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={downloadPdf}
                className="gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" /> PDF
              </Button>
              <Button
                size="sm"
                onClick={downloadDocx}
                disabled={loading === 'docx'}
                className="bg-violet-600 hover:bg-violet-700 text-white border-transparent gap-1.5"
              >
                {loading === 'docx'
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> DOCX...</>
                  : <><FileDown className="h-3.5 w-3.5" /> DOCX</>
                }
              </Button>
              <div className="w-px h-5 bg-border/60 mx-1" />
              <Button size="sm" variant="ghost" onClick={closePreview} className="gap-1.5">
                <X className="h-4 w-4" /> Fermer
              </Button>
            </div>
          </div>

          {/* PDF viewer */}
          <div className="flex-1 bg-zinc-900 overflow-hidden">
            {iframeOk ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title="Aperçu CV optimisé"
                onError={() => setIframeOk(false)}
              />
            ) : (
              /* Fallback si l'iframe ne supporte pas le PDF (mobile) */
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-6">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground text-sm max-w-xs">
                  La prévisualisation inline n'est pas supportée sur cet appareil.
                  Téléchargez le PDF pour le visualiser.
                </p>
                <Button onClick={downloadPdf} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white border-transparent">
                  <FileText className="h-4 w-4" /> Télécharger le PDF
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
