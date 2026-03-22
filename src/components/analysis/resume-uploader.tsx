'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useLang } from '@/components/shared/language-provider'

interface ResumeUploaderProps {
  onFileAccepted: (file: File) => void
  uploading?: boolean
}

export function ResumeUploader({ onFileAccepted, uploading = false }: ResumeUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { T } = useLang()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier doit faire moins de 5 Mo')
      return
    }

    setSelectedFile(file)
    onFileAccepted(file)
  }, [onFileAccepted])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
          isDragActive ? 'border-violet-500 bg-violet-500/5' : 'border-border/50 hover:border-violet-500/50 hover:bg-muted/20',
          uploading && 'opacity-50 cursor-not-allowed',
          selectedFile && 'border-green-500/50 bg-green-500/5'
        )}
      >
        <input {...getInputProps()} />
        {selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <div>
              <p className="font-medium text-green-500">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {(selectedFile.size / 1024).toFixed(0)} Ko
              </p>
            </div>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setSelectedFile(null) }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-2"
            >
              <X className="h-3 w-3" /> {T.removeFile}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {isDragActive ? (
              <>
                <Upload className="h-10 w-10 text-violet-500 animate-bounce" />
                <p className="text-violet-500 font-medium">{T.dragDrop}</p>
              </>
            ) : (
              <>
                <FileText className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">{T.dragDrop}</p>
                  <p className="text-sm text-muted-foreground mt-1">{T.orBrowse}</p>
                </div>
                <p className="text-xs text-muted-foreground">{T.fileInfo}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
