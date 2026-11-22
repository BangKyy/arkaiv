import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useDirectory } from '../state/directory'
import { usePageMeta } from '../lib/hooks'
import { track } from '../lib/analytics'
import { hasSupabase, sendSubmission } from '../lib/studios'
import { ArrowUpRight } from '../components/icons'
import Button from '../components/Button'
import RegisterForm from '../components/RegisterForm'
import RemovalForm from '../components/RemovalForm'
import SectionHeading from '../components/SectionHeading'
import SubmissionLayout from '../components/SubmissionLayout'
import { StepBox } from '../components/LabeledBox'

// FR-13: every request type (new, correction, removal) goes through an in-page form into
// the Supabase review queue; nothing reaches the map until approved. Only when Supabase is
// not configured and VITE_SUBMISSION_FORM_URL is set does the page link out instead.
// Layout follows the Figma "Pages/Studio Regist Pages" screens (lg, md, sm).
const FORM_URL = import.meta.env.VITE_SUBMISSION_FORM_URL

// Request types; `value` matches submissions.kind in supabase/schema.sql.
const KINDS = [
  { value: 'new', label: 'Daftar baru', param: null },
  { value: 'correction', label: 'Koreksi data', param: 'koreksi' },
  { value: 'removal', label: 'Hapus listing', param: 'hapus' },
]

// "Progress Check/Regist Studio": what to have ready before filling in the form.
const CHECKLISTS = {
  new: [
    { id: 'name', label: 'Nama resmi studio' },
    { id: 'address', label: 'Alamat jalan dan wilayah' },
    { id: 'links', label: 'Website atau Instagram', note: '(min salah satu)' },
    { id: 'categories', label: 'Satu kategori utama, maksimal dua tambahan' },
    { id: 'logo', label: 'Logo yang boleh dipakai di web', note: '(opsional)' },
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
  },
  correction: {
    title: 'Ajukan koreksi data',
    lede: 'Isi data studio yang benar. Permintaan koreksi ditangani dalam 7 hari.',
  },
  removal: {
    title: 'Ajukan penghapusan listing',
    lede: 'Studio dapat meminta datanya dihapus dari direktori. Permintaan penghapusan ditangani dalam 7 hari.',
  },
}

// "Box with inner Labels" Variant=Process step.
const STEPS = [
  { label: 'Diterima', text: 'Pengajuan masuk antrean tinjauan.' },
  { label: 'Diverifikasi', text: 'Alamat, koordinat, tautan, dan kategori dicek.' },
  { label: 'Terbit', text: 'Studio muncul di peta dengan kode dan URL tetap.' },
]

// Profile links carry the studio: `?koreksi=<slug>` or `?hapus=<slug>`.
const STUDIO_PARAM = { correction: 'koreksi', removal: 'hapus' }

/** A profile link (above) or `?jenis=koreksi|hapus` picks the request type. */
function readKind(params) {
  if (params.has('koreksi')) return 'correction'
  if (params.has('hapus')) return 'removal'
  return KINDS.find((k) => k.param && k.param === params.get('jenis'))?.value ?? 'new'
}

export default function Submit() {
  const [params, setParams] = useSearchParams()
  const { bySlug } = useDirectory()
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const kind = readKind(params)
  const studio = STUDIO_PARAM[kind] ? bySlug.get(params.get(STUDIO_PARAM[kind]) ?? '') : undefined
  const copy = COPY[kind]
  const title = studio ? `${kind === 'removal' ? 'Ajukan penghapusan' : 'Ajukan koreksi'} untuk ${studio.name}` : copy.title

  usePageMeta(
    studio ? `${kind === 'removal' ? 'Hapus listing' : 'Koreksi data'} ${studio.name}` : 'Daftarkan studio',
    'Daftarkan studio desain Surabaya atau ajukan koreksi data di Arkaiv.',
  )

  const setKind = (value) => {
    const next = new URLSearchParams()
    const param = KINDS.find((k) => k.value === value)?.param
    if (param) next.set('jenis', param)
    setParams(next, { replace: true })
    setStatus('idle')
  }

  const handleSubmit = async (values) => {
    track('submit_click', { type: kind })
    setStatus('sending')
    try {
      await sendSubmission({ kind, studioSlug: studio?.slug, payload: values })
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  const formHref = FORM_URL ? withParams(FORM_URL, { jenis: KINDS.find((k) => k.value === kind)?.param, studio: studio?.slug }) : null
  // With neither backend configured (development) the form still renders, to match the design.
  const inPage = hasSupabase || !formHref

  return (
    <article className="about about--submit">
      <header className="about__hero">
        <div className="about__inner">
          <p className="about__eyebrow">Formulir</p>
          <h1 className="about__title">
            Daftarkan atau Perbarui <span className="about__title-accent">Data Studio.</span>
          </h1>
          <p className="about__lede">
            Sebelum studio kamu ditampilkan ke peta digital, terdapat peninjauan dari kami. Pastikan
            pilih sesuai kebutuhan dan data yang dimasukan sesuai.
          </p>
        </div>
      </header>

      <div className="about__inner">
        <div className="submit__form">
          <SubmissionLayout kinds={KINDS} kind={kind} onKindChange={setKind} checklist={CHECKLISTS[kind]} title={title}>
            {copy.lede && <p className="page__lede">{copy.lede}</p>}
            {status === 'sent' ? (
              <p className="notice" role="status">
                Terima kasih! Pengajuan kamu sudah masuk antrean tinjauan.
              </p>
            ) : inPage ? (
              <>
                {kind === 'removal' ? (
                  <RemovalForm key={kind} onSubmit={handleSubmit} submitting={status === 'sending'} studioName={studio?.name} />
                ) : (
                  <RegisterForm key={kind} onSubmit={handleSubmit} submitting={status === 'sending'} />
                )}
                {status === 'error' && (
                  <p className="notice" role="alert">
                    {hasSupabase ? (
                      'Pengajuan belum terkirim. Periksa koneksi lalu coba lagi.'
                    ) : (
                      <>
                        Pengiriman belum tersambung. Atur <code>VITE_SUPABASE_URL</code> dan{' '}
                        <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> di file <code>.env</code>.
                      </>
                    )}
                  </p>
                )}
              </>
            ) : (
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
            )}
          </SubmissionLayout>
        </div>
      </div>

      <section className="about__inner about__section submit__process" aria-labelledby="submit-process">
        <SectionHeading id="submit-process">Proses Peninjauan</SectionHeading>
        <div className="about__criteria">
          {STEPS.map((step, i) => (
            <StepBox key={step.label} label={step.label} watermark={String(i + 1)}>
              {step.text}
            </StepBox>
          ))}
        </div>
        <p className="about__note">
          Koreksi dan penghapusan ditanggapi dalam 7 hari. Kontak pribadi hanya ditampilkan dengan
          persetujuan studio.
        </p>
      </section>
    </article>
  )
}

function withParams(url, extra) {
  const pairs = Object.entries(extra).filter(([, v]) => v)
  if (!pairs.length) return url
  const query = pairs.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  return `${url}${url.includes('?') ? '&' : '?'}${query}`
}
