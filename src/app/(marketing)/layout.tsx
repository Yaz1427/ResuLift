import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { createClient } from '@/lib/supabase/server'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar isLoggedIn={!!user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export const dynamic = 'force-dynamic'
