import categoriesData from '../data/categories.json'
import areasData from '../data/areas.json'

export const categories = [...categoriesData].sort((a, b) => a.sort - b.sort)
export const areas = areasData

const categoryById = new Map(categories.map((c) => [c.id, c]))
const areaById = new Map(areas.map((a) => [a.id, a]))

export const getCategory = (id) => categoryById.get(id)
export const getArea = (id) => areaById.get(id)
export const categoryName = (id) => categoryById.get(id)?.name ?? id

/** "Branding · UI/UX": a studio's categories as one line. */
export const categoryLine = (studio) => studio.categories.map(categoryName).join(' · ')

/** "P-SUB-01" -> "P-SUB 01" (the book's label style). */
export const formatCode = (code) => (code ? code.replace(/-(\d+)$/, ' $1') : '')

export const instagramUrl = (handle) =>
  handle ? `https://www.instagram.com/${handle.replace(/^@/, '')}/` : ''

export const googleMapsUrl = (studio) =>
  `https://www.google.com/maps/search/?api=1&query=${studio.lat},${studio.lng}`
