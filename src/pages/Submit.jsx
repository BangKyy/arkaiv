import { useSearchParams } from 'react-router'
import { useDirectory } from '../state/directory'
import { usePageMeta } from '../lib/hooks'
import { track } from '../lib/analytics'
import { ArrowUpRight } from '../components/icons'
import Button from '../components/Button'
import SubmissionLayout from '../components/SubmissionLayout'

// FR-13: submissions and corrections go through an external form for the MVP.
// Everything lands in a review queue; nothing reaches the map until approved.
// The in-app RegisterForm (components/RegisterForm) can replace the link once
// public submissions have a bot check (see supabase/schema.sql).
const FORM_URL = import.meta.env.VITE_SUBMISSION_FORM_URL

// Request types; `value` matches submissions.kind in supabase/schema.sql.
const KINDS = [
  { value: 'new', label: 'Daftar baru', param: null },
  { value: 'correction', label: 'Koreksi data', param: 'koreksi' },
  { value: 'removal', label: 'Hapus listing', param: 'hapus' },
]

// "Progress Check/Regist Studio": what to have ready before opening the form.
const CHECKLISTS = {
  new: [
    { id: 'name', label: 'Nama resmi studio' },
    { id: 'address', label: 'Alamat jalan dan wilayah' },
    { id: 'links', label: 'Website atau Instagram', note: '(min salah satu)' },
    { id: 'categories', label: 'Satu kategori utama, maksimal dua tambahan' },
    { id: 'description', label: 'Deskripsi singkat', note: '(maksimal 300 karakter)' },
    { id: 'media', label: 'Logo, foto studio, dan kontak yang boleh dipakai di web', note: '(opsional)' },
  ],
  correction: [
    { id: 'studio', label: 'Nama studio yang ingin dikoreksi' },
    { id: 'what', label: 'Bagian data yang perlu diperbaiki' },
    { id: 'fix', label: 'Data yang benar', note: '(sertakan sumbernya bila ada)' },
  ],
  removal: [
    { id: 'studio', label: 'Nama studio yang ingin dihapus' },
    { id: 'role', label: 'Hubungan Anda dengan studio', note: '(pemilik atau perwakilan)' },
  ],
}

const COPY = {
  new: {
    title: 'Yuk, Lengkapi Formulirnya!',
    lede: 'Studio dan agensi kreatif yang berbasis di Surabaya dapat mendaftar melalui formulir. Setiap pengajuan ditinjau sebelum tampil di peta.',
  },
  correction: {
    title: 'Ajukan koreksi data',
    lede: 'Beri tahu kami bagian mana yang perlu diperbaiki. Permintaan koreksi ditangani dalam 7 hari.',
  },
  removal: {
    title: 'Ajukan penghapusan listing',
    lede: 'Studio dapat meminta datanya dihapus dari direktori. Permintaan penghapusan ditangani dalam 7 hari.',
  },
}

/** `?koreksi=<slug>` (from a profile) or `?jenis=koreksi|hapus` pick the request type. */
function readKind(params) {
  if (params.has('koreksi')) return 'correction'
  return KINDS.find((k) => k.param && k.param === params.get('jenis'))?.value ?? 'new'
}

export default function Submit() {
  const [params, setParams] = useSearchParams()
  const { bySlug } = useDirectory()
  const kind = readKind(params)
  const studio = kind === 'correction' ? bySlug.get(params.get('koreksi') ?? '') : undefined
  const copy = COPY[kind]
  const title = studio ? `Ajukan koreksi untuk ${studio.name}` : copy.title

  usePageMeta(
    studio ? `Koreksi data ${studio.name}` : 'Daftarkan studio',
    'Daftarkan studio desain Surabaya atau ajukan koreksi data di Arkaiv.',
  )

  const setKind = (value) => {
    const next = new URLSearchParams()
    const param = KINDS.find((k) => k.value === value)?.param
    if (param) next.set('jenis', param)
    setParams(next, { replace: true })
  }

  const formHref = FORM_URL ? withParams(FORM_URL, { jenis: KINDS.find((k) => k.value === kind)?.param, studio: studio?.slug }) : null

  return (
    <article className="page page--wide">
      <SubmissionLayout kinds={KINDS} kind={kind} onKindChange={setKind} checklist={CHECKLISTS[kind]} title={title}>
        <p className="page__lede">{copy.lede}</p>
        {formHref ? (
          <Button
            as="a"
            size="xl"
            icon={ArrowUpRight}
            href={formHref}
            target="_blank"
            rel="noopener noreferrer"
            className="submission__cta"
            onClick={() => track('submit_click', { type: kind })}
          >
            Buka formulir
            <span className="visually-hidden"> (membuka tab baru)</span>
          </Button>
        ) : (
          <p className="notice" role="status">
            Formulir belum tersedia. Atur <code>VITE_SUBMISSION_FORM_URL</code> di file{' '}
            <code>.env</code> untuk menautkannya.
          </p>
        )}
      </SubmissionLayout>
    </article>
  )
}

function withParams(url, extra) {
  const pairs = Object.entries(extra).filter(([, v]) => v)
  if (!pairs.length) return url
  const query = pairs.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  return `${url}${url.includes('?') ? '&' : '?'}${query}`
}
