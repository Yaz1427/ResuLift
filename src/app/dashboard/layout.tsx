import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/lib/button-variants'
import { FileText, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardSidebar } from '@/components/shared/dashboard-sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const profileData = profile as { full_name: string | null; email: string } | null

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        displayName={profileData?.full_name ?? null}
        email={user.email ?? ''}
      />

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-border/40 bg-background/80 backdrop-blur-sm px-4">
          <Link href="/" className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-400" />
            <span className="font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>ResuLift</span>
          </Link>
          <div className="ml-auto">
            <Link href="/dashboard/new" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              <PlusCircle className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
