'use client'

import { useLang, LOCALES } from '@/components/shared/language-provider'
import { cn } from '@/lib/utils'

export function LanguageSwitcher() {
  const { locale, setLocale } = useLang()

  return (
    <div className="flex gap-3">
      {LOCALES.map(l => (
        <button
          key={l.value}
          type="button"
          onClick={() => setLocale(l.value)}
          className={cn(
            'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
            locale === l.value
              ? 'border-violet-600 bg-violet-600/10 text-violet-400'
              : 'border-border/50 text-muted-foreground hover:border-violet-600/30 hover:text-foreground'
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
