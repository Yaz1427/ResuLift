import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_placeholder', {
  apiVersion: '2026-02-25.clover',
  typescript: true,
})

export const PRICES = {
  basic: {
    amount: 500, // $5.00 in cents
    label: 'Basic Analysis',
  },
  premium: {
    amount: 1200, // $12.00 in cents
    label: 'Premium Analysis',
  },
} as const
