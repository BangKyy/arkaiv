// Filter state lives in the URL query so the map and the list always share it,
// it survives moving between the list and a profile, and filtered views can be shared.
// ?kategori=branding,editorial&wilayah=pusat,timur&q=studio
import { areas, categories, categoryName, getArea } from './catalog'

const validCategories = new Set(categories.map((c) => c.id))
const validAreas = new Set(areas.map((a) => a.id))

const list = (raw, valid) => (raw ?? '').split(',').filter((id) => valid.has(id))

export function readFilters(searchParams) {
  return {
    categories: list(searchParams.get('kategori'), validCategories),
    areas: list(searchParams.get('wilayah'), validAreas),
    query: searchParams.get('q') ?? '',
  }
}

export function writeFilters(searchParams, filters) {
  const next = new URLSearchParams(searchParams)
  const set = (key, value) => (value ? next.set(key, value) : next.delete(key))
  set('kategori', filters.categories.join(','))
  set('wilayah', filters.areas.join(','))
  set('q', filters.query)
  return next
}

const normalize = (text) => text.toLocaleLowerCase('id').trim()

/** What a search can match: the studio's name, code, categories and area. */
const searchText = (s) =>
  normalize(
    [
      s.name,
      s.code,
      ...s.categories.map(categoryName),
      getArea(s.area)?.name,
      getArea(s.area)?.code,
    ].join(' '),
  )

/**
 * Multi-select rows: a studio matches a row if it has ANY selected value, and must match
 * every row that has a selection. The search must match as a whole phrase.
 */
export function applyFilters(studios, { categories: cats = [], areas: ars = [], query = '' }) {
  const wantedCats = new Set(cats)
  const wantedAreas = new Set(ars)
  const q = normalize(query)
  if (!wantedCats.size && !wantedAreas.size && !q) return studios
  return studios.filter(
    (s) =>
      (!wantedCats.size || s.categories.some((c) => wantedCats.has(c))) &&
      (!wantedAreas.size || wantedAreas.has(s.area)) &&
      (!q || searchText(s).includes(q)),
  )
}
