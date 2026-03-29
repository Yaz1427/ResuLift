import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_REDIRECT_PATHS = ['/dashboard', '/dashboard/new', '/dashboard/settings']

function getSafeRedirectPath(next: string | null): string {
  if (!next) return '/dashboard'
  // Must start with / but NOT // (protocol-relative) and must be an allowed path
  if (next.startsWith('/') && !next.startsWith('//')) {
    const normalized = next.split('?')[0]
    if (ALLOWED_REDIRECT_PATHS.some(p => normalized === p || normalized.startsWith(p + '/'))) {
      return next
    }
  }
  return '/dashboard'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = getSafeRedirectPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
