'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { type Locale, type TranslationKey, t, LOCALES } from '@/lib/i18n'

interface LangContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  T: (typeof t)[Locale]
  dir: 'ltr' | 'rtl'
}

const LangContext = createContext<LangContextValue>({
  locale: 'fr',
  setLocale: () => {},
  T: t.fr,
  dir: 'ltr',
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved && (saved === 'fr' || saved === 'en' || saved === 'ar')) {
      setLocaleState(saved)
    }
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    localStorage.setItem('locale', l)
    // Apply RTL for Arabic
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
  }

  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <LangContext.Provider value={{ locale, setLocale, T: t[locale], dir }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}

export { LOCALES }
