'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/lib/button-variants'
import { FileText, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useLang, LOCALES } from '@/components/shared/language-provider'
import { useState, useRef, useEffect } from 'react'

interface NavbarProps {
  isLoggedIn?: boolean
}

export function Navbar({ isLoggedIn = false }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const { T, locale, setLocale } = useLang()
  const [langOpen, setLangOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.success(T.signOut)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <FileText className="h-5 w-5 text-violet-400" />
          <span className="font-extrabold text-lg tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>ResuLift</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/#how-it-works" className="hover:text-foreground transition-colors">{T.howItWorks}</Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">{T.pricing}</Link>
        </nav>

        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setLangOpen(v => !v)}
              className={cn(
                'flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm text-muted-foreground border border-transparent',
                'hover:text-foreground hover:border-border/50 hover:bg-muted/30 transition-all',
                langOpen && 'border-border/50 bg-muted/30 text-foreground'
              )}
              aria-label="Changer de langue"
            >
              <Globe className="h-4 w-4" />
              <span className="font-medium uppercase text-xs">{locale}</span>
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-border/50 bg-card shadow-xl overflow-hidden z-50">
                {LOCALES.map(l => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => { setLocale(l.value); setLangOpen(false) }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors',
                      locale === l.value
                        ? 'bg-violet-600/10 text-violet-400 font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <span className="text-base leading-none">
                      {l.value === 'fr' ? '🇫🇷' : l.value === 'en' ? '🇬🇧' : '🇸🇦'}
                    </span>
                    {l.label}
                    {locale === l.value && <span className="ml-auto text-violet-400">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                {T.dashboard}
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                {T.signOut}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                {T.signIn}
              </Link>
              <Link href="/signup" className={cn(buttonVariants({ size: 'sm' }), 'bg-violet-600 hover:bg-violet-700 text-white border-transparent')}>
                {T.getStarted}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
