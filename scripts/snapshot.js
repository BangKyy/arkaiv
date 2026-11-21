// Build-time JSON snapshot of published studios (PRD section 12, "Data delivery").
// With Supabase configured it overwrites src/data/studios.json; without it, or if
// Supabase is unreachable, the existing snapshot is kept and the build continues.
import { writeFile } from 'node:fs/promises'
import { STUDIO_SELECT, rowToStudio, isListable, byName } from '../src/lib/studioRow.js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.log('snapshot: Supabase not configured, keeping the existing src/data/studios.json')
  process.exit(0)
}

try {
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await client
    .from('studios')
    .select(STUDIO_SELECT)
    .eq('status', 'published')
    .abortSignal(AbortSignal.timeout(15_000))
  if (error) throw error
  const studios = data.map(rowToStudio).filter(isListable).sort(byName)
  if (!studios.length) throw new Error('no published studios returned')
  const out = { sample: false, generatedAt: new Date().toISOString().slice(0, 10), studios }
  await writeFile(new URL('../src/data/studios.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`)
  console.log(`snapshot: wrote ${studios.length} published studios`)
} catch (e) {
  console.warn(`snapshot: Supabase fetch failed (${e.message}); keeping the existing snapshot`)
}
