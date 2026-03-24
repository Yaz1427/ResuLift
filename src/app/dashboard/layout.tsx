import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/shared/dashboard-sidebar'
import { MobileHeader } from '@/components/shared/mobile-header'

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
        <MobileHeader
          displayName={profileData?.full_name ?? null}
          email={user.email ?? ''}
        />

        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
