import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-6 w-6 text-violet-500" />
        <span className="font-bold text-lg">ResuLift</span>
      </div>
      <div className="text-6xl font-bold text-muted-foreground/30">404</div>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-muted-foreground max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className={cn(buttonVariants(), 'bg-violet-600 hover:bg-violet-700 text-white border-transparent')}>
        Go Home
      </Link>
    </div>
  )
}
