// Validates src/data/studios.json against the PRD data rules (sections 8 and 11).
// Runs before every build; errors stop the build, warnings do not.
import { readFile } from 'node:fs/promises'
import { areaForPoint } from '../src/lib/geo.js'

const read = async (p) => JSON.parse(await readFile(new URL(`../src/data/${p}`, import.meta.url), 'utf8'))

const [snapshot, categories, areas, boundaries] = await Promise.all([
  read('studios.json'),
  read('categories.json'),
  read('areas.json'),
  read('surabaya-wilayah.geo.json'),
])

const categoryIds = new Set(categories.map((c) => c.id))
const areaById = new Map(areas.map((a) => [a.id, a]))
const accentKeys = new Set(Array.from({ length: 12 }, (_, i) => `c${String(i + 1).padStart(2, '0')}`))
const STALE_DAYS = 365

const errors = []
const warnings = []
const seenSlugs = new Set()
const seenCodes = new Set()

for (const s of snapshot.studios) {
  const id = s.slug || s.name || '(unnamed)'
  const err = (msg) => errors.push(`${id}: ${msg}`)
  const warn = (msg) => warnings.push(`${id}: ${msg}`)

  for (const f of ['name', 'slug', 'description', 'address', 'area', 'primaryCategory', 'status']) {
    if (!s[f]) err(`missing required field "${f}"`)
  }
  if (s.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.slug)) err('slug must be lowercase, URL-safe')
  if (seenSlugs.has(s.slug)) err('duplicate slug')
  seenSlugs.add(s.slug)

  if (s.description?.length > 300) err(`description is ${s.description.length} chars (max 300)`)

  if (!Array.isArray(s.categories) || s.categories.length === 0) err('needs at least one category')
  else {
    if (s.categories.length > 3) err('one primary category plus up to two others (max 3)')
    for (const c of s.categories) if (!categoryIds.has(c)) err(`unknown category "${c}"`)
    if (!s.categories.includes(s.primaryCategory)) err('primaryCategory must be in categories')
  }

  const area = areaById.get(s.area)
  if (!area) err(`unknown area "${s.area}"`)

  if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) err('missing coordinates')
  else {
    const derived = areaForPoint(s.lng, s.lat, boundaries)
    if (!derived) warn('coordinates fall outside the drawn Surabaya boundary')
    else if (area && derived !== s.area) err(`area is "${s.area}" but coordinates fall in "${derived}"`)
  }

  if (s.code) {
    if (seenCodes.has(s.code)) err(`duplicate code ${s.code}`)
    seenCodes.add(s.code)
    if (area && !s.code.startsWith(`${area.code}-`)) err(`code ${s.code} does not match area ${area.code}`)
  } else warn('no studio code yet (area code + running number)')

  if (!s.website && !s.instagram) err('needs a website or an Instagram handle')
  if (s.website && !/^https?:\/\//.test(s.website)) err('website must be a full URL')
  if (s.instagram && /[/\s]/.test(s.instagram)) err('store Instagram as a handle, not a URL')

  if (s.accent && !accentKeys.has(s.accent)) err(`accent "${s.accent}" is not one of c01..c12`)
  if (!['draft', 'published', 'needs_review'].includes(s.status)) err(`unknown status "${s.status}"`)

  if (!s.source) warn('no source recorded')
  if (!s.lastVerified) warn('no last verified date')
  else if ((Date.now() - Date.parse(s.lastVerified)) / 86_400_000 > STALE_DAYS) {
    warn(`last verified ${s.lastVerified}: older than 12 months, should be "needs_review"`)
  }
}

for (const w of warnings) console.warn(`  warn  ${w}`)
for (const e of errors) console.error(`  error ${e}`)
const published = snapshot.studios.filter((s) => s.status === 'published').length
console.log(
  `check-data: ${snapshot.studios.length} studios (${published} published), ` +
    `${errors.length} errors, ${warnings.length} warnings${snapshot.sample ? ' [SAMPLE DATA]' : ''}`,
)
if (errors.length) process.exit(1)
