'use client'

import Link from 'next/link'
import { useLang } from '@/components/shared/language-provider'

export function DashboardFooter() {
  const { T } = useLang()

  return (
    <footer className="mt-12 border-t border-border/40 px-6 md:px-8 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/60">
        <span>© {new Date().getFullYear()} ResuLift — Powered by Claude AI</span>
        <div className="flex gap-4">
          <Link href="/pricing" className="hover:text-muted-foreground transition-colors">{T.pricing}</Link>
          <Link href="mailto:support@resulift.cv" className="hover:text-muted-foreground transition-colors">{T.footerContact}</Link>
        </div>
      </div>
    </footer>
  )
}
