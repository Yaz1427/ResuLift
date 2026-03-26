'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'
import { useLang } from '@/components/shared/language-provider'

export function Footer() {
  const { T } = useLang()

  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-violet-500" />
              <span className="font-bold">ResuLift</span>
            </Link>
            <p className="text-sm text-muted-foreground">{T.footerTagline}</p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">{T.footerProduct}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#how-it-works" className="hover:text-foreground transition-colors">{T.footerHowItWorks}</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground transition-colors">{T.pricing}</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground transition-colors">{T.dashboard}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">{T.footerAccount}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-foreground transition-colors">{T.footerLogin}</Link></li>
              <li><Link href="/signup" className="hover:text-foreground transition-colors">{T.footerSignup}</Link></li>
              <li><Link href="/dashboard/settings" className="hover:text-foreground transition-colors">{T.settings}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">{T.footerCompany}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground transition-colors">{T.footerAbout}</Link></li>
              <li><Link href="/legal" className="hover:text-foreground transition-colors">{T.footerLegal}</Link></li>
              <li><Link href="mailto:support@resulift.cv" className="hover:text-foreground transition-colors">{T.footerContact}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ResuLift. {T.footerRights}
          </p>
          <p className="text-sm text-muted-foreground">{T.footerPowered}</p>
        </div>
      </div>
    </footer>
  )
}
