import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — ResuLift',
  description: 'Simple pay-per-use pricing. No subscriptions.',
}

const basicFeatures = [
  { text: 'ATS compatibility score (0-100)', included: true },
  { text: 'Keyword match analysis', included: true },
  { text: 'Format & structure check', included: true },
  { text: 'Experience relevance score', included: true },
  { text: 'Skills alignment report', included: true },
  { text: 'Prioritized recommendations', included: true },
  { text: 'Downloadable PDF report', included: true },
  { text: 'AI-rewritten bullet points', included: false },
  { text: 'Missing keyword integration guide', included: false },
  { text: 'Profile gap analysis', included: false },
]

const premiumFeatures = [
  { text: 'ATS compatibility score (0-100)', included: true },
  { text: 'Keyword match analysis', included: true },
  { text: 'Format & structure check', included: true },
  { text: 'Experience relevance score', included: true },
  { text: 'Skills alignment report', included: true },
  { text: 'Prioritized recommendations', included: true },
  { text: 'Downloadable PDF report', included: true },
  { text: 'AI-rewritten bullet points', included: true },
  { text: 'Missing keyword integration guide', included: true },
  { text: 'Profile gap analysis', included: true },
]

export default function PricingPage() {
  return (
    <div className="py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-muted-foreground">
            No subscriptions. No hidden fees. Pay only when you need an analysis.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">Basic</CardTitle>
              <CardDescription>Perfect for a quick ATS check</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">$5</span>
                <span className="text-muted-foreground ml-2 text-lg">/ analysis</span>
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
                Get Basic Analysis →
              </Link>
            </CardContent>
          </Card>

          <Card className="border-violet-600 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-violet-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                MOST POPULAR
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <CardDescription>Full optimization with AI rewrites</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">$12</span>
                <span className="text-muted-foreground ml-2 text-lg">/ analysis</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {premiumFeatures.map(f => (
                  <li key={f.text} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    {f.text}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={cn(buttonVariants(), 'w-full bg-violet-600 hover:bg-violet-700 text-white border-transparent')}>
                Get Premium Analysis →
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Secure payment powered by Stripe • 256-bit SSL encryption</p>
          <p className="mt-2">Questions? <Link href="mailto:support@resulift.com" className="text-violet-400 hover:underline">Contact us</Link></p>
        </div>
      </div>
    </div>
  )
}
