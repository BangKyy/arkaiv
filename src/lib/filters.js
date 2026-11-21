// Filter state lives in the URL query so the map and the list always share it,
// it survives moving between the list and a profile, and filtered views can be shared.
// ?kategori=branding,editorial   (V1.1 will add ?wilayah=...)
import { categories } from './catalog'

const validCategories = new Set(categories.map((c) => c.id))

export function readFilters(searchParams) {
  const raw = searchParams.get('kategori') ?? ''
  const cats = raw.split(',').filter((id) => validCategories.has(id))
  return { categories: cats }
}

export function writeFilters(searchParams, filters) {
  const next = new URLSearchParams(searchParams)
  if (filters.categories.length) next.set('kategori', filters.categories.join(','))
  else next.delete('kategori')
  return next
}

/** Multi-select: a studio matches if it has ANY selected category. */
export function applyFilters(studios, filters) {
  if (!filters.categories.length) return studios
  const wanted = new Set(filters.categories)
  return studios.filter((s) => s.categories.some((c) => wanted.has(c)))
}
