// Admin dashboard data (/admin). Uses its own Supabase client that keeps the admin's
// session, separate from the anonymous client in studios.js, so the public map never
// runs with admin rights (which would also show draft studios).
// The route guard in the UI is a convenience; RLS and review_submission() enforce access.
import { hasSupabase } from './studios'

export const KIND_LABEL = { new: 'Daftar baru', correction: 'Koreksi data', removal: 'Hapus listing' }
export const STATUS_LABEL = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' }
export const STUDIO_STATUS_LABEL = { published: 'Terbit', draft: 'Draf', needs_review: 'Perlu tinjauan' }

export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

/** On one-column layouts the detail sits under the list; bring it into view. */
export function scrollToDetail(ref) {
  requestAnimationFrame(() => {
    if (window.matchMedia('(max-width: 999px)').matches) ref.current?.scrollIntoView({ block: 'start' })
  })
}

/** Database errors in words an admin can act on. */
export function friendlyError(err) {
  const msg = err?.message ?? ''
  if (msg.includes('studios_slug_key')) return 'Slug ini sudah dipakai studio lain.'
  if (msg.includes('studios_has_public_link')) return 'Isi website atau Instagram (min salah satu).'
  if (msg.includes('studios_founded_year_check')) return 'Tahun berdiri harus antara 1900 dan 2100.'
  if (msg.includes('already reviewed')) return 'Pengajuan ini sudah ditinjau admin lain. Muat ulang daftar.'
  if (msg.includes('Choose the studio')) return 'Pilih studio yang dimaksud pengajuan ini.'
  if (msg.includes('Studio not found')) return 'Studio ini sudah tidak ada. Muat ulang daftar.'
  if (msg.includes('Admins only') || err?.code === '42501') return 'Sesi admin tidak berlaku. Masuk ulang.'
  return `Gagal menyimpan: ${msg || 'periksa koneksi lalu coba lagi.'}`
}

let clientPromise

export function getAdminClient() {
  if (!hasSupabase) throw new Error('Supabase is not configured')
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, storageKey: 'arkaiv-admin-auth' },
    }),
  )
  return clientPromise
}

export async function signIn(email, password) {
  const client = await getAdminClient()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  const client = await getAdminClient()
  await client.auth.signOut()
}

export async function isAdmin() {
  const client = await getAdminClient()
  const { data, error } = await client.rpc('is_admin')
  if (error) throw error
  return data === true
}

export async function listSubmissions() {
  const client = await getAdminClient()
  const { data, error } = await client
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return data
}

/** Every studio, drafts included, with the columns the review editor works on. */
export async function listStudios() {
  const client = await getAdminClient()
  const { data, error } = await client
    .from('studios')
    .select(
      'id, slug, code, name, description, primary_category, address, area, lat, lng, website, instagram, status, source, last_verified, updated_at, ' +
        'about, founded_year, studio_type, specialties, approach, process, people, projects, ' +
        'contact_email, contact_phone, contact_whatsapp, opening_hours, logo_url, cover_url, studio_categories(category_id)',
    )
    .order('name')
  if (error) throw error
  return data.map(({ studio_categories: extra, ...s }) => ({
    ...s,
    categories: [s.primary_category, ...extra.map((r) => r.category_id).filter((c) => c !== s.primary_category)],
  }))
}

/**
 * Approves or rejects one submission; on approval the change is applied in the same
 * transaction (see review_submission in supabase/schema.sql). Throws on failure.
 */
export async function reviewSubmission({ id, decision, note, studioId, studio, categories }) {
  const client = await getAdminClient()
  const { error } = await client.rpc('review_submission', {
    p_id: id,
    p_decision: decision,
    p_note: note || null,
    p_studio_id: studioId ?? null,
    p_studio: studio ?? null,
    p_categories: categories ?? null,
  })
  if (error) throw error
}

/** Creates (no `id`) or updates a studio and its categories; returns its id. */
export async function saveStudio({ id, studio, categories }) {
  const client = await getAdminClient()
  const { data, error } = await client.rpc('save_studio', {
    p_id: id ?? null,
    p_studio: studio,
    p_categories: categories,
  })
  if (error) throw error
  return data
}

export async function setStudioStatus(id, status) {
  const client = await getAdminClient()
  const { error } = await client.from('studios').update({ status }).eq('id', id)
  if (error) throw error
}

/** Permanent: also removes its categories; submissions keep their slug for the record. */
export async function deleteStudio(id) {
  const client = await getAdminClient()
  const { error } = await client.from('studios').delete().eq('id', id)
  if (error) throw error
}
