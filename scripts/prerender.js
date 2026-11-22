// Prerenders static entry pages after `vite build` (PRD section 12, "Routing").
// Every studio gets dist/studio/<slug>/index.html with its own title, description
// and share tags, plus readable content for crawlers. React replaces that content
// on load, so the page behaves exactly like the client-side route.
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const dist = new URL('../dist/', import.meta.url)
const SITE_URL = (process.env.VITE_SITE_URL ?? '').replace(/\/$/, '')
const SITE = 'Arkaiv'
const TAGLINE = 'Direktori Studio Desain Surabaya'

const template = await readFile(new URL('index.html', dist), 'utf8')
const { studios } = JSON.parse(await readFile(new URL('../src/data/studios.json', import.meta.url), 'utf8'))
const categories = JSON.parse(await readFile(new URL('../src/data/categories.json', import.meta.url), 'utf8'))
const areas = JSON.parse(await readFile(new URL('../src/data/areas.json', import.meta.url), 'utf8'))
const catName = (id) => categories.find((c) => c.id === id)?.name ?? id
const areaOf = (id) => areas.find((a) => a.id === id)

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// `noindex` pages (404, admin) get no canonical or og:url and stay out of search results.
function render({ path, title, description, image, body, noindex = false }) {
  const fullTitle = title ? `${title} · ${SITE}` : `${SITE} · ${TAGLINE}`
  const abs = (p) => (SITE_URL ? `${SITE_URL}${p}` : p)
  const head = [
    noindex && `<meta name="robots" content="noindex" />`,
    SITE_URL && !noindex && `<link rel="canonical" href="${esc(abs(path))}" />`,
    `<meta property="og:site_name" content="${SITE}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="id_ID" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    SITE_URL && !noindex && `<meta property="og:url" content="${esc(abs(path))}" />`,
    image && `<meta property="og:image" content="${esc(image.startsWith('http') ? image : abs(image))}" />`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
  ]
    .filter(Boolean)
    .join('\n    ')

  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace('<!--prerender:head-->', head)
    .replace('<!--prerender:body-->', body)
}

async function write(path, html) {
  const dir = new URL(`.${path}`, dist)
  await mkdir(dir, { recursive: true })
  await writeFile(new URL('index.html', dir), html)
}

const pages = []
const published = studios.filter((s) => s.status === 'published')

for (const s of published) {
  const path = `/studio/${s.slug}/`
  const area = areaOf(s.area)
  const links = [
    s.website && `<li><a href="${esc(s.website)}">${esc(s.website)}</a></li>`,
    s.instagram && `<li><a href="https://www.instagram.com/${esc(s.instagram.replace(/^@/, ''))}/">@${esc(s.instagram.replace(/^@/, ''))}</a></li>`,
  ]
    .filter(Boolean)
    .join('')
  const body = `<article><p>${esc(s.code ?? '')}</p><h1>${esc(s.name)}</h1><p>${esc(s.description)}</p><p>${esc(
    s.categories.map(catName).join(', '),
  )}</p><p>${esc(s.address)}${area ? `, ${esc(area.name)}` : ''}</p><ul>${links}</ul></article>`
  await write(path, render({ path, title: s.name, description: s.description, image: s.cover, body }))
  pages.push(path)
}

const DESCRIPTION =
  'Peta direktori studio desain dan agensi kreatif di Surabaya. Temukan studio berdasarkan lokasi dan spesialisasi.'

const staticPages = [
  { path: '/daftar/', title: 'Daftarkan studio', description: 'Daftarkan studio desain Surabaya atau ajukan koreksi data di Arkaiv.' },
]
for (const p of staticPages) {
  await write(p.path, render({ ...p, body: `<h1>${esc(p.title)}</h1><p>${esc(p.description)}</p>` }))
  pages.push(p.path)
}

// Map: share tags plus a crawlable list of every studio link.
const mapBody = `<h1>Jelajahi peta</h1><ul>${published
  .map((s) => `<li><a href="/studio/${esc(s.slug)}">${esc(s.name)}</a></li>`)
  .join('')}</ul>`
await write('/peta/', render({ path: '/peta/', title: 'Jelajahi peta', description: DESCRIPTION, body: mapBody }))
pages.push('/peta/')

// Home: the About page (Figma "Home Page").
const home = render({
  path: '/',
  title: '',
  description: DESCRIPTION,
  body: `<h1>Arsip hidup studio desain di Surabaya.</h1><p>${esc(DESCRIPTION)}</p><p><a href="/peta">Jelajahi peta</a></p>`,
})
await writeFile(new URL('index.html', dist), home)
// Old About address: the app redirects to /, the static copy keeps it from 404ing on hosts without a SPA fallback.
await write('/tentang/', home)

// Static hosts (Vercel, Netlify, GitHub Pages) answer unknown addresses with dist/404.html
// and a 404 status. It is the app shell, so the router still runs: it shows the Figma 404
// page, and studios added in Supabase after the build still open.
await writeFile(
  new URL('404.html', dist),
  render({
    path: '/404',
    title: 'Halaman tidak ditemukan',
    description: DESCRIPTION,
    body: '<h1>Halaman tidak ditemukan</h1><p><a href="/">Kembali ke beranda</a></p>',
    noindex: true,
  }),
)
// The admin dashboard is client-only; this shell lets /admin load with a 200.
await write('/admin/', render({ path: '/admin/', title: 'Admin', description: DESCRIPTION, body: '', noindex: true }))

if (SITE_URL) {
  const urls = ['/', ...pages].map((p) => `  <url><loc>${esc(SITE_URL + p)}</loc></url>`).join('\n')
  await writeFile(
    new URL('sitemap.xml', dist),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  )
  await writeFile(new URL('robots.txt', dist), `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${SITE_URL}/sitemap.xml\n`)
}

console.log(`prerender: ${published.length} studio pages, ${staticPages.length + 1} static pages${SITE_URL ? ', sitemap.xml' : ' (set VITE_SITE_URL for canonical URLs and a sitemap)'}`)
