import { createClient } from '@supabase/supabase-js'

/**
 * Supabase service-role client (bypasses RLS).
 * Use ONLY in server-side API routes, never in client code.
 */
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service config manquant')
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * Extract the storage path from a Supabase signed URL.
 * Signed URL format: /storage/v1/object/sign/resumes/<userId>/<timestamp>.<ext>
 */
export function extractStoragePath(signedUrl: string): string | null {
  try {
    const url = new URL(signedUrl)
    const match = url.pathname.match(/\/storage\/v1\/object\/sign\/resumes\/(.+)/)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

/**
 * Fetch a resume buffer from Supabase Storage, regenerating a fresh signed URL
 * if the original one has expired (24h expiry).
 */
export async function fetchResumeBuffer(resumeUrl: string): Promise<Buffer> {
  const storagePath = extractStoragePath(resumeUrl)
  if (storagePath) {
    const service = getServiceClient()
    const { data } = await service.storage
      .from('resumes')
      .createSignedUrl(storagePath, 60 * 5)
    if (data?.signedUrl) {
      const res = await fetch(data.signedUrl)
      if (res.ok) return Buffer.from(await res.arrayBuffer())
    }
  }
  // Fallback: try the original URL (might still be valid)
  const res = await fetch(resumeUrl)
  if (!res.ok) throw new Error(`Resume fetch failed: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}
