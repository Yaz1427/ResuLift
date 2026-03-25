import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifs — ResuLift',
  description: "Tarification simple à l'usage. Pas d'abonnement. Payez uniquement quand vous en avez besoin.",
  openGraph: {
    title: 'Tarifs — ResuLift',
    description: "Tarification simple à l'usage. Score ATS, analyse de mots-clés et recommandations.",
  },
}

const basicFeatures = [
  { text: "Score de compatibilité ATS (0-100)", included: true },
  { text: "Analyse des mots-clés", included: true },
  { text: "Vérification format & structure", included: true },
  { text: "Score de pertinence de l'expérience", included: true },
  { text: "Rapport d'alignement des compétences", included: true },
  { text: "Recommandations priorisées", included: true },
  { text: "Rapport PDF téléchargeable", included: true },
  { text: "Bullet points réécrits par l'IA", included: false },
  { text: "Guide d'intégration des mots-clés manquants", included: false },
  { text: "Analyse des lacunes du profil", included: false },
  { text: "CV optimisé ATS téléchargeable (.docx)", included: false },
]

const premiumFeatures: { text: string; isNew?: boolean }[] = [
  { text: "Score de compatibilité ATS (0-100)" },
  { text: "Analyse des mots-clés" },
  { text: "Vérification format & structure" },
  { text: "Score de pertinence de l'expérience" },
  { text: "Rapport d'alignement des compétences" },
  { text: "Recommandations priorisées" },
  { text: "Rapport PDF téléchargeable" },
  { text: "Bullet points réécrits par l'IA" },
  { text: "Guide d'intégration des mots-clés manquants" },
  { text: "Analyse des lacunes du profil" },
  { text: "CV optimisé ATS téléchargeable (.docx)", isNew: true },
]

export default function PricingPage() {
  return (
    <div className="py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Tarification simple et transparente</h1>
          <p className="text-xl text-muted-foreground">
            Pas d&apos;abonnement. Pas de frais cachés. Payez uniquement quand vous en avez besoin.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">Basic</CardTitle>
              <CardDescription>Idéal pour une vérification ATS rapide</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">5€</span>
                <span className="text-muted-foreground ml-2 text-lg">/ analyse</span>
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
                Commencer avec Basic →
              </Link>
            </CardContent>
          </Card>

          <Card className="border-violet-600 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-violet-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                LE PLUS POPULAIRE
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <CardDescription>Optimisation complète avec réécriture par l&apos;IA</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">12€</span>
                <span className="text-muted-foreground ml-2 text-lg">/ analyse</span>
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
                Commencer avec Premium →
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Paiement sécurisé par Stripe &bull; Chiffrement SSL 256 bits</p>
          <p className="mt-2">Des questions ? <Link href="mailto:support@resulift.cv" className="text-violet-400 hover:underline">Contactez-nous</Link></p>
        </div>
      </div>
    </div>
  )
}
