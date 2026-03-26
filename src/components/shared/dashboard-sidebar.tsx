'use client'

import Link from 'next/link'
import { FileText, LayoutDashboard, PlusCircle, Settings, LogOut, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLang } from '@/components/shared/language-provider'

interface DashboardSidebarProps {
  displayName: string | null
  email: string
}

export function DashboardSidebar({ displayName, email }: DashboardSidebarProps) {
  const { T } = useLang()

  return (
    <aside className="hidden md:flex w-64 flex-col border-e border-border/40 bg-background/80 fixed inset-y-0 start-0">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-border/40">
        <FileText className="h-5 w-5 text-violet-400" />
        <span className="font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>ResuLift</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Home className="h-4 w-4" />
          Accueil
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          {T.myAnalyses}
        </Link>
        <Link
          href="/dashboard/new"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          {T.newAnalysis}
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Settings className="h-4 w-4" />
          {T.settings}
        </Link>
      </nav>

      <div className="p-4 border-t border-border/40">
        <div className="px-3 py-2 mb-2">
          <div className="text-sm font-medium truncate">{displayName ?? email}</div>
          <div className="text-xs text-muted-foreground truncate">{email}</div>
        </div>
        <form action="/api/auth/signout" method="POST">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" type="submit">
            <LogOut className="h-4 w-4" />
            {T.signOut}
          </Button>
        </form>
      </div>
    </aside>
  )
}
