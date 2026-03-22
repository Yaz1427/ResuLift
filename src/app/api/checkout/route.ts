import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PRICES } from '@/lib/stripe'
import { checkoutSchema } from '@/lib/validations'
import type { Analysis, Payment } from '@/types/database'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input = checkoutSchema.parse(body)
    const price = PRICES[input.analysisType]
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    // Create analysis record (pending)
    const { data: rawAnalysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        type: input.analysisType,
        status: 'pending',
        resume_url: input.resumeUrl,
        resume_filename: input.resumeFilename,
        job_description: input.jobDescription,
        job_title: input.jobTitle ?? null,
        job_company: input.company ?? null,
      } as Omit<Analysis, 'id' | 'created_at' | 'completed_at' | 'ats_score' | 'result'>)
      .select()
      .single()

    if (analysisError || !rawAnalysis) {
      throw new Error('Failed to create analysis record')
    }

    const analysis = rawAnalysis as Analysis

    // Get or create Stripe customer
    const { data: rawProfile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    const profile = rawProfile as { stripe_customer_id: string | null } | null
    let customerId = profile?.stripe_customer_id ?? undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId } as Partial<{ stripe_customer_id: string }>)
        .eq('id', user.id)
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: price.amount,
            product_data: {
              name: `ResuLift ${price.label}`,
              description: `ATS resume analysis${input.jobTitle ? ` for ${input.jobTitle}` : ''}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/dashboard/analysis/${analysis.id}?status=processing`,
      cancel_url: `${appUrl}/dashboard/new`,
      metadata: {
        user_id: user.id,
        analysis_id: analysis.id,
        analysis_type: input.analysisType,
      },
    })

    // Save payment record
    await supabase.from('payments').insert({
      user_id: user.id,
      analysis_id: analysis.id,
      stripe_session_id: session.id,
      amount: price.amount,
      currency: 'usd',
      status: 'pending',
    } as Omit<Payment, 'id' | 'created_at' | 'stripe_payment_intent_id'>)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[checkout] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
