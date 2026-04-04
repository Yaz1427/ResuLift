'use client'

import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error: _error, reset }: ErrorProps) {

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-6 w-6 text-violet-500" />
        <span className="font-bold text-lg">ResuLift</span>
      </div>
      <div className="text-6xl font-bold text-muted-foreground/30">500</div>
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground max-w-sm">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={reset} className="bg-violet-600 hover:bg-violet-700">
        Try Again
      </Button>
    </div>
  )
}
