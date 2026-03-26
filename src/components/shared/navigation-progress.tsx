'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { usePathname } from 'next/navigation'

// ─── Inner component (needs Suspense because usePathname can suspend) ─────────
function ProgressBar() {
  const pathname   = usePathname()
  const [width, setWidth]     = useState(0)
  const [visible, setVisible] = useState(false)
  const prevRef  = useRef(pathname)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Navigation complete: pathname changed → fill to 100 % then fade out
  useEffect(() => {
    if (pathname === prevRef.current) return
    prevRef.current = pathname

    if (timerRef.current) clearInterval(timerRef.current)
    setWidth(100)
    const t = setTimeout(() => setVisible(false), 250)
    return () => clearTimeout(t)
  }, [pathname])

  // Intercept clicks on internal <a> tags → start the bar
  useEffect(() => {
    function start() {
      if (timerRef.current) clearInterval(timerRef.current)
      setVisible(true)
      setWidth(15)

      // Crawl to ~85 % while waiting for the server
      let w = 15
      timerRef.current = setInterval(() => {
        // Slow down as we approach 85 %
        const step = (85 - w) * 0.12
        w = Math.min(w + Math.max(step, 0.5), 85)
        setWidth(w)
        if (w >= 85 && timerRef.current) clearInterval(timerRef.current)
      }, 150)
    }

    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest('a[href]')
      if (!a) return

      const href = a.getAttribute('href') ?? ''
      // Skip external, hash, mailto, tel links and same-page links
      if (
        !href ||
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href === pathname
      ) return

      start()
    }

    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [pathname])

  return (
    <div
      aria-hidden
      style={{
        position:   'fixed',
        top:        0,
        left:       0,
        height:     '2px',
        width:      `${width}%`,
        background: '#7C3AED',
        zIndex:     99999,
        pointerEvents: 'none',
        boxShadow:  '0 0 6px rgba(124,58,237,0.8)',
        transition: visible
          ? 'width 0.15s ease'          // growing: fast
          : 'width 0.15s ease, opacity 0.25s ease 0.1s', // fading out: with delay
        opacity: visible ? 1 : 0,
      }}
    />
  )
}

// ─── Public export — Suspense boundary required by usePathname ────────────────
export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  )
}
