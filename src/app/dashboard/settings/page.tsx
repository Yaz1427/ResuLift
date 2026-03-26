'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { LanguageSwitcher } from '@/components/shared/language-switcher'
import { useLang } from '@/components/shared/language-provider'
import { toast } from 'sonner'
import { Loader2, Camera } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { T } = useLang()

  const [email, setEmail]         = useState('')
  const [fullName, setFullName]   = useState('')
  const [plan, setPlan]           = useState('free')
  const [initials, setInitials]   = useState('?')
  const [analysesCount, setAnalysesCount] = useState<number | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setEmail(user.email ?? '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, plan, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile) {
        const p = profile as { full_name: string | null; plan: string; avatar_url?: string | null }
        setFullName(p.full_name ?? '')
        setPlan(p.plan ?? 'free')
        setAvatarUrl(p.avatar_url ?? null)
        const name = p.full_name ?? user.email ?? '?'
        setInitials(name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase())
      }

      const { count } = await supabase
        .from('analyses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setAnalysesCount(count ?? 0)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (error) {
      toast.error(T.errorSaving ?? 'Error saving')
    } else {
      toast.success(T.profileUpdated ?? 'Profile updated!')
      const name = fullName || email
      setInitials(name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase())
      router.refresh()
    }
    setSaving(false)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') { toast.error(T.unsupportedFormat ?? 'Unsupported format'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error(T.fileTooLarge ?? 'File too large (max 2MB)'); return }

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const ext  = file.type === 'image/png' ? 'png' : 'jpg'
      const path = `${user.id}/avatar.${ext}`

      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const urlWithBust = `${publicUrl}?t=${Date.now()}`

      const { error: dbErr } = await supabase.from('profiles').update({ avatar_url: urlWithBust }).eq('id', user.id)
      if (dbErr) throw dbErr

      setAvatarUrl(urlWithBust)
      toast.success(T.avatarUpdated ?? 'Profile photo updated!')
    } catch {
      toast.error(T.uploadError ?? 'Upload error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-40 rounded bg-muted/50 animate-pulse" />
        <div className="h-48 rounded-lg bg-muted/30 animate-pulse" />
        <div className="h-32 rounded-lg bg-muted/30 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{T.settingsTitle}</h1>
        <p className="text-muted-foreground mt-1">{T.settingsSubtitle}</p>
      </div>

      {/* Profile */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>{T.profile}</CardTitle>
          <CardDescription>{T.profileDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar + stats */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/20 border border-border/40">
            <div className="relative group shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="avatar" className="h-14 w-14 rounded-full object-cover border border-border/50" />
              ) : (
                <div className="h-14 w-14 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold text-lg">
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {uploading ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Camera className="h-4 w-4 text-white" />}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="font-medium">{fullName || email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize text-xs">{plan}</Badge>
                {analysesCount !== null && (
                  <span className="text-xs text-muted-foreground">{analysesCount} {T.totalAnalyses}</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{T.email}</Label>
            <Input value={email} disabled className="bg-muted/30" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">{T.fullName}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder={T.fullName}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700 text-white border-transparent"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {T.saveChanges}
          </Button>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>{T.language}</CardTitle>
          <CardDescription>{T.languageDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher />
        </CardContent>
      </Card>

      <Separator />

      {/* Danger zone */}
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-500">{T.dangerZone}</CardTitle>
          <CardDescription>{T.dangerZoneDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{T.deleteAccount}</p>
              <p className="text-sm text-muted-foreground">{T.deleteAccountDesc} <a href="mailto:support@resulift.cv" className="text-violet-400 hover:underline">support@resulift.cv</a></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const dynamic = 'force-dynamic'
