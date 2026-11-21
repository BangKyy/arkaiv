// Maps a Supabase `studios` row (see supabase/schema.sql) to the shape the app uses.
// Pure module with no imports, so both the browser and scripts/snapshot.js can use it.

export const STUDIO_SELECT = '*, studio_categories(category_id)'

export function rowToStudio(row) {
  const extra = (row.studio_categories ?? []).map((r) => r.category_id)
  const categories = [row.primary_category, ...extra.filter((c) => c !== row.primary_category)]
  return {
    slug: row.slug,
    code: row.code ?? '',
    name: row.name,
    description: row.description ?? '',
    about: row.about ?? '',
    categories,
    primaryCategory: row.primary_category,
    specialties: row.specialties ?? [],
    address: row.address ?? '',
    area: row.area,
    lat: Number(row.lat),
    lng: Number(row.lng),
    website: row.website ?? '',
    instagram: row.instagram ?? '',
    contact: { email: row.contact_email ?? '', whatsapp: row.contact_whatsapp ?? '' },
    accent: row.accent ?? '',
    logo: row.logo_url ?? null,
    cover: row.cover_url ?? null,
    people: row.people ?? [],
    approach: row.approach ?? '',
    projects: row.projects ?? [],
    photos: row.photos ?? [],
    status: row.status,
    source: row.source ?? '',
    lastVerified: row.last_verified ?? '',
  }
}

/** Only published studios with coordinates and at least one public link are shown. */
export function isListable(s) {
  return (
    s.status === 'published' &&
    Number.isFinite(s.lat) &&
    Number.isFinite(s.lng) &&
    Boolean(s.website || s.instagram) &&
    s.categories.length > 0
  )
}

export const byName = (a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' })
