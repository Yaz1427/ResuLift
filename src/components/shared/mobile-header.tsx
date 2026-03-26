'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Menu, LayoutDashboard, PlusCircle, Settings, LogOut, X } from 'lucide-react'
import { useLang } from '@/components/shared/language-provider'

interface MobileHeaderProps {
  displayName: string | null
  email: string
}

export function MobileHeader({ displayName, email }: MobileHeaderProps) {
  const [open, setOpen] = useState(false)
  const { T } = useLang()

  return (
    <>
      <header className="md:hidden sticky top-0 z-50 flex h-16 items-center border-b border-border/40 bg-background/80 backdrop-blur-sm px-4">
        <button onClick={() => setOpen(true)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="flex items-center gap-2 mx-auto">
          <FileText className="h-5 w-5 text-violet-400" />
          <span className="font-extrabold tracking-tight">ResuLift</span>
        </Link>
        <div className="w-9" />
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute start-0 top-0 bottom-0 w-72 bg-card border-e border-border/40 flex flex-col">
            <div className="flex h-16 items-center justify-between px-6 border-b border-border/40">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-violet-400" />
                <span className="font-extrabold tracking-tight">ResuLift</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {[
                { href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, label: T.myAnalyses },
                { href: '/dashboard/new', icon: <PlusCircle className="h-4 w-4" />, label: T.newAnalysis },
                { href: '/dashboard/settings', icon: <Settings className="h-4 w-4" />, label: T.settings },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-border/40">
              <div className="px-3 py-2 mb-2">
                <div className="text-sm font-medium truncate">{displayName ?? email}</div>
                <div className="text-xs text-muted-foreground truncate">{email}</div>
              </div>
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <LogOut className="h-4 w-4" />
                  {T.signOut}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
