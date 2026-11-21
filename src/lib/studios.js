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

/** Returns fresh studios, or null when Supabase is not configured or unreachable. */
export async function refreshStudios({ timeoutMs = 6000 } = {}) {
  if (!hasSupabase) return null
  try {
    // Loaded lazily so the Supabase client never delays the map or list.
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
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
