// Data delivery (PRD section 12): the build ships a JSON snapshot of published studios,
// so the directory renders instantly and keeps working if Supabase is slow or paused.
// When Supabase is configured, the app refreshes from it after first paint.
import snapshot from '../data/studios.json'
import { STUDIO_SELECT, rowToStudio, isListable, byName } from './studioRow'

export const isSample = Boolean(snapshot.sample)

export function loadSnapshot() {
  return snapshot.studios.filter(isListable).sort(byName)
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY)

// Loaded lazily so the Supabase client never delays the map or list.
async function getClient() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
}

/** Returns fresh studios, or null when Supabase is not configured or unreachable. */
export async function refreshStudios({ timeoutMs = 6000 } = {}) {
  if (!hasSupabase) return null
  try {
    const client = await getClient()
    const query = client
      .from('studios')
      .select(STUDIO_SELECT)
      .eq('status', 'published')
      .abortSignal(AbortSignal.timeout(timeoutMs))
    const { data, error } = await query
    if (error || !data?.length) return null
    return data.map(rowToStudio).filter(isListable).sort(byName)
  } catch {
    return null
  }
}

const MEDIA_BUCKET = 'studio-media'
const IMAGE_KEYS = { logo: 'logo_url', cover: 'cover_url' }

/**
 * Uploads a compressed image (lib/images) to the public studio-media bucket, where
 * visitors may only add files under submissions/. Returns its public URL.
 */
async function uploadSubmissionImage(client, image, slot) {
  const ext = image.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `submissions/${crypto.randomUUID()}/${slot}.${ext}`
  const { error } = await client.storage
    .from(MEDIA_BUCKET)
    .upload(path, image.blob, { contentType: image.type, cacheControl: '31536000', upsert: false })
  if (error) throw error
  return client.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
}

/**
 * FR-13: queues a request in `submissions` (always pending, never read back; see
 * supabase/schema.sql). `kind` is 'new' | 'correction' | 'removal'. Images in the
 * payload (`logo`, `cover`) are uploaded first and sent as `logo_url` / `cover_url`.
 * Throws on failure.
 */
export async function sendSubmission({ kind, studioSlug, payload, timeoutMs = 10000 }) {
  if (!hasSupabase) throw new Error('Supabase is not configured')
  const client = await getClient()
  const data = { ...payload }
  for (const [slot, key] of Object.entries(IMAGE_KEYS)) {
    const image = data[slot]
    delete data[slot]
    if (image) data[key] = await uploadSubmissionImage(client, image, slot)
  }
  const { error } = await client
    .from('submissions')
    .insert({ kind, studio_slug: studioSlug ?? null, payload: data })
    .abortSignal(AbortSignal.timeout(timeoutMs))
  if (error) throw error
}
