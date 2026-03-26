import { PricingView } from '@/components/marketing/pricing-view'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — ResuLift',
  description: 'Simple pay-per-analysis pricing. No subscription. Pay only when you need it.',
  openGraph: {
    title: 'Pricing — ResuLift',
    description: 'ATS score, keyword analysis and recommendations.',
  },
}

export default function PricingPage() {
  return <PricingView />
}
