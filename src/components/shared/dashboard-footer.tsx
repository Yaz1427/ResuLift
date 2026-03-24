import Link from 'next/link'

export function DashboardFooter() {
  return (
    <footer className="mt-12 border-t border-border/40 px-6 md:px-8 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/60">
        <span>© {new Date().getFullYear()} ResuLift — Fait avec Claude AI</span>
        <div className="flex gap-4">
          <Link href="/pricing" className="hover:text-muted-foreground transition-colors">Tarifs</Link>
          <Link href="mailto:support@resulift.cv" className="hover:text-muted-foreground transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  )
}
