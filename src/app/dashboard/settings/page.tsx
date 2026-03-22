import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { LanguageSwitcher } from '@/components/shared/language-switcher'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Paramètres — ResuLift' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = rawProfile as { full_name: string | null; plan: string } | null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground mt-1">Gérez vos préférences de compte</p>
      </div>

      {/* Profil */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email ?? ''} disabled className="bg-muted/30" />
          </div>
          <div className="space-y-2">
            <Label>Nom complet</Label>
            <Input defaultValue={profile?.full_name ?? ''} placeholder="Votre nom" />
          </div>
          <div className="flex items-center gap-2">
            <Label>Plan</Label>
            <Badge variant="outline" className="capitalize">{profile?.plan ?? 'gratuit'}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Langue */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Langue</CardTitle>
          <CardDescription>Choisissez la langue de l&apos;interface</CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher />
        </CardContent>
      </Card>

      <Separator />

      {/* Zone dangereuse */}
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-500">Zone dangereuse</CardTitle>
          <CardDescription>Actions irréversibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Supprimer le compte</p>
              <p className="text-sm text-muted-foreground">Supprime définitivement votre compte et toutes vos données</p>
            </div>
            <Button variant="destructive" size="sm">Supprimer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const dynamic = 'force-dynamic'
