import { NextResponse } from 'next/server'
import { createClient as createSsrClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'resumes'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service config manquant')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(request: Request) {
  try {
    // Auth check via SSR client (needs cookies)
    const supabase = await createSsrClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Le fichier doit faire moins de 5 Mo' }, { status: 400 })
    }

    // Use plain service client (no cookies) for storage operations
    const service = getServiceClient()

    // Create bucket if it doesn't exist
    const { data: buckets, error: listError } = await service.storage.listBuckets()
    if (listError) {
      console.error('[upload] listBuckets error:', listError)
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET)
    if (!bucketExists) {
      const { error: createError } = await service.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      })
      if (createError) {
        console.error('[upload] createBucket error:', createError)
        throw new Error(`Impossible de créer le bucket: ${createError.message}`)
      }
    }

    const ext = file.name.split('.').pop()
    const filename = `${user.id}/${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await service.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) throw new Error(uploadError.message)

    const { data: signedData } = await service.storage
      .from(BUCKET)
      .createSignedUrl(filename, 60 * 60 * 24)

    if (!signedData?.signedUrl) throw new Error('Impossible de générer l\'URL signée')

    return NextResponse.json({ url: signedData.signedUrl, filename })
  } catch (error) {
    console.error('[upload] Error:', error)
    const message = error instanceof Error ? error.message : 'Échec de l\'upload'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
