'use client'

import { useEffect, useState } from 'react'

interface AnalysisStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  atsScore: number | null
}

export function useAnalysisStatus(analysisId: string, initialStatus: string) {
  const [data, setData] = useState<AnalysisStatus>({
    status: initialStatus as AnalysisStatus['status'],
    atsScore: null,
  })

  useEffect(() => {
    if (data.status === 'completed' || data.status === 'failed') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/analysis/${analysisId}/status`)
        if (!res.ok) return
        const json = await res.json()
        setData(json)
        if (json.status === 'completed' || json.status === 'failed') {
          clearInterval(interval)
        }
      } catch {
        // silently retry
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [analysisId, data.status])

  return data
}
