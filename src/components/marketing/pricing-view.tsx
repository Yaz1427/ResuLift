'use client'

import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLang } from '@/components/shared/language-provider'
import { cn } from '@/lib/utils'
import { CheckCircle2, X } from 'lucide-react'

type Feature = { text: string; included?: boolean; isNew?: boolean }

function getFeatures(locale: string): { basic: Feature[]; premium: Feature[] } {
  if (locale === 'en') {
    return {
      basic: [
        { text: 'ATS compatibility score (0-100)', included: true },
        { text: 'Keyword analysis', included: true },
        { text: 'Format & structure check', included: true },
        { text: 'Experience relevance score', included: true },
        { text: 'Skills alignment report', included: true },
        { text: 'Prioritized recommendations', included: true },
        { text: 'Downloadable PDF report', included: true },
        { text: 'AI-rewritten bullet points', included: false },
        { text: 'Missing keyword integration guide', included: false },
        { text: 'Profile gap analysis', included: false },
        { text: 'ATS-optimized resume (.docx)', included: false },
      ],
      premium: [
        { text: 'ATS compatibility score (0-100)' },
        { text: 'Keyword analysis' },
        { text: 'Format & structure check' },
        { text: 'Experience relevance score' },
        { text: 'Skills alignment report' },
        { text: 'Prioritized recommendations' },
        { text: 'Downloadable PDF report' },
        { text: 'AI-rewritten bullet points' },
        { text: 'Missing keyword integration guide' },
        { text: 'Profile gap analysis' },
        { text: 'ATS-optimized resume download (.docx)', isNew: true },
      ],
    }
  }
  if (locale === 'ar') {
    return {
      basic: [
        { text: 'درجة توافق ATS (0-100)', included: true },
        { text: 'تحليل الكلمات المفتاحية', included: true },
        { text: 'فحص التنسيق والبنية', included: true },
        { text: 'درجة ملاءمة الخبرة', included: true },
        { text: 'تقرير توافق المهارات', included: true },
        { text: 'توصيات ذات أولوية', included: true },
        { text: 'تقرير PDF قابل للتنزيل', included: true },
        { text: 'إعادة كتابة النقاط بالذكاء الاصطناعي', included: false },
        { text: 'دليل دمج الكلمات المفتاحية المفقودة', included: false },
        { text: 'تحليل فجوة الملف الشخصي', included: false },
        { text: 'سيرة ذاتية محسّنة للتنزيل (.docx)', included: false },
      ],
      premium: [
        { text: 'درجة توافق ATS (0-100)' },
        { text: 'تحليل الكلمات المفتاحية' },
        { text: 'فحص التنسيق والبنية' },
        { text: 'درجة ملاءمة الخبرة' },
        { text: 'تقرير توافق المهارات' },
        { text: 'توصيات ذات أولوية' },
        { text: 'تقرير PDF قابل للتنزيل' },
        { text: 'إعادة كتابة النقاط بالذكاء الاصطناعي' },
        { text: 'دليل دمج الكلمات المفتاحية المفقودة' },
        { text: 'تحليل فجوة الملف الشخصي' },
        { text: 'سيرة ذاتية محسّنة للتنزيل (.docx)', isNew: true },
      ],
    }
  }
  // fr (default)
  return {
    basic: [
      { text: 'Score de compatibilité ATS (0-100)', included: true },
      { text: 'Analyse des mots-clés', included: true },
      { text: 'Vérification format & structure', included: true },
      { text: "Score de pertinence de l'expérience", included: true },
      { text: "Rapport d'alignement des compétences", included: true },
      { text: 'Recommandations priorisées', included: true },
      { text: 'Rapport PDF téléchargeable', included: true },
      { text: "Bullet points réécrits par l'IA", included: false },
      { text: "Guide d'intégration des mots-clés manquants", included: false },
      { text: 'Analyse des lacunes du profil', included: false },
      { text: 'CV optimisé ATS téléchargeable (.docx)', included: false },
    ],
    premium: [
      { text: 'Score de compatibilité ATS (0-100)' },
      { text: 'Analyse des mots-clés' },
      { text: 'Vérification format & structure' },
      { text: "Score de pertinence de l'expérience" },
      { text: "Rapport d'alignement des compétences" },
      { text: 'Recommandations priorisées' },
      { text: 'Rapport PDF téléchargeable' },
      { text: "Bullet points réécrits par l'IA" },
      { text: "Guide d'intégration des mots-clés manquants" },
      { text: 'Analyse des lacunes du profil' },
      { text: 'CV optimisé ATS téléchargeable (.docx)', isNew: true },
    ],
  }
}

export function PricingView() {
  const { T, locale } = useLang()
  const { basic: basicFeatures, premium: premiumFeatures } = getFeatures(locale)

  return (
    <div className="py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{T.pricingTitle}</h1>
          <p className="text-xl text-muted-foreground">{T.pricingSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Basic */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">Basic</CardTitle>
              <CardDescription>{T.pricingBasicDesc}</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">5€</span>
                <span className="text-muted-foreground ms-2 text-lg">{T.pricePerAnalysis}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {basicFeatures.map(f => (
                  <li key={f.text} className="flex items-start gap-3 text-sm">
                    {f.included
                      ? <CheckCircle2 className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      : <X className="h-4 w-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                    }
                    <span className={f.included ? '' : 'text-muted-foreground/40'}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
                {T.startWithBasic}
              </Link>
            </CardContent>
          </Card>

          {/* Premium */}
          <Card className="border-violet-600 relative overflow-visible mt-4 md:mt-0">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-violet-600 text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                {T.mostPopular}
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <CardDescription>{T.pricingPremiumDesc}</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">12€</span>
                <span className="text-muted-foreground ms-2 text-lg">{T.pricePerAnalysis}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {premiumFeatures.map(f => (
                  <li key={f.text} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span className="flex items-center gap-2">
                      {f.text}
                      {f.isNew && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-violet-600/30 text-violet-300 border-violet-500/40">
                          NEW
                        </Badge>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={cn(buttonVariants(), 'w-full bg-violet-600 hover:bg-violet-700 text-white border-transparent')}>
                {T.startWithPremium}
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>{T.pricingSecure}</p>
          <p className="mt-2">
            {T.pricingQuestions}{' '}
            <Link href="mailto:support@resulift.cv" className="text-violet-400 hover:underline">
              {T.contactUs}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
