import Link from 'next/link'
import { FileText, Sparkles, Mail } from 'lucide-react'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'À propos — ResuLift',
  description: "Découvrez ResuLift, l'outil d'optimisation de CV ATS propulsé par Claude AI.",
}

export default function AboutPage() {
  return (
    <div className="py-24 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-8 w-8 text-violet-500" />
          <h1 className="text-4xl font-extrabold">À propos de ResuLift</h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
          <p className="text-lg text-foreground/80">
            ResuLift est un outil d&apos;optimisation de CV boosté par l&apos;IA, conçu pour aider les candidats à décrocher plus d&apos;entretiens en améliorant la compatibilité de leur CV avec les systèmes ATS (Applicant Tracking Systems).
          </p>

          <p>
            La majorité des grandes entreprises utilisent des logiciels ATS pour filtrer les candidatures avant même qu&apos;un recruteur humain ne les lise. Ces systèmes éliminent jusqu&apos;à 75% des CV sur la base de critères techniques : mots-clés manquants, mauvais format, sections absentes.
          </p>

          <p>
            ResuLift analyse votre CV contre la description du poste visé, identifie les lacunes, et fournit des recommandations concrètes et actionnables — le tout en quelques secondes.
          </p>

          <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-6 not-prose">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-violet-400" />
              <span className="font-semibold text-foreground">Propulsé par Claude AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              ResuLift utilise <strong className="text-foreground/80">Claude (Anthropic)</strong>, l&apos;un des modèles d&apos;IA les plus avancés au monde, pour analyser et réécrire votre CV avec une précision et une nuance impossible à atteindre avec des algorithmes classiques.
            </p>
          </div>

          <h2 className="text-xl font-bold text-foreground mt-8">Pourquoi ResuLift ?</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>Analyse instantanée — résultats en moins de 20 secondes</li>
            <li>Recommandations spécifiques et actionnables, pas des généralités</li>
            <li>Réécriture des bullet points par l&apos;IA (Premium)</li>
            <li>CV optimisé ATS téléchargeable en .docx (Premium)</li>
            <li>Aucun abonnement — payez uniquement quand vous en avez besoin</li>
          </ul>

          <h2 className="text-xl font-bold text-foreground mt-8">Contact</h2>
          <p>
            Pour toute question, suggestion ou demande de support, contactez-nous à :{' '}
            <a href="mailto:support@resulift.cv" className="text-violet-400 hover:underline">
              support@resulift.cv
            </a>
          </p>
        </div>

        <div className="mt-12 flex gap-4">
          <Link href="/signup" className={cn(buttonVariants(), 'bg-violet-600 hover:bg-violet-700 text-white border-transparent')}>
            Analyser mon CV
          </Link>
          <Link href="/pricing" className={cn(buttonVariants({ variant: 'outline' }))}>
            Voir les tarifs
          </Link>
        </div>
      </div>
    </div>
  )
}
