import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSearchParams } from 'react-router'
import { useDirectory } from '../state/directory'
import { usePageMeta } from '../lib/hooks'
import { track } from '../lib/analytics'
import { useLoading } from '../lib/progress'
import { useIntro } from '../lib/intro'
import { EASE_OUT, inView, rise, stagger } from '../lib/motion'
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
// "Beberapa hal yang harus diselesaikan!": progress only. A row ticks itself once its
// fields in the form are filled (`done` reads the form's current values); rows without
// `done` have no field in the form and stay open.
const hasLinks = (v) => Boolean(v.website || v.instagram)
const CHECKLISTS = {
  new: [
    { id: 'name', label: 'Nama resmi studio', done: (v) => Boolean(v.name) },
    { id: 'address', label: 'Alamat jalan dan wilayah', done: (v) => Boolean(v.address && v.area) },
    { id: 'links', label: 'Website atau Instagram', note: '(min salah satu)', done: hasLinks },
    { id: 'categories', label: 'Satu kategori utama, maksimal dua tambahan', done: (v) => v.categories?.length > 0 },
    { id: 'images', label: 'Unggah logo dan header', note: '(opsional)', done: (v) => Boolean(v.logo && v.cover) },
  ],
  // Corrections use the registration form: the studio's name plus the corrected data.
  correction: [
    { id: 'studio', label: 'Nama studio yang ingin dikoreksi', done: (v) => Boolean(v.name) },
    { id: 'address', label: 'Alamat jalan dan wilayah yang benar', done: (v) => Boolean(v.address && v.area) },
    { id: 'links', label: 'Website atau Instagram', note: '(min salah satu)', done: hasLinks },
    { id: 'categories', label: 'Kategori yang sesuai karya studio', done: (v) => v.categories?.length > 0 },
  ],
  removal: [
    { id: 'studio', label: 'Nama studio yang ingin dihapus', done: (v) => Boolean(v.name) },
    { id: 'role', label: 'Hubungan Anda dengan studio', note: '(pemilik atau perwakilan)', done: (v) => Boolean(v.role) },
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
  useLoading(status === 'sending')
  const heroRef = useRef(null)
  useIntro(heroRef)
  const [values, setValues] = useState({}) // the form's current values, for the checklist
  const kind = readKind(params)
  const checklist = CHECKLISTS[kind].map(({ done, ...item }) => ({ ...item, done: Boolean(done?.(values)) }))
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
      <header ref={heroRef} className="about__hero">
        <div className="about__inner">
          <p className="about__eyebrow" data-intro="eyebrow">
            Formulir
          </p>
          <h1 className="about__title" data-intro="title">
            Daftarkan atau Perbarui{' '}
            <span className="about__title-accent" data-intro="scramble">
              Data Studio.
            </span>
          </h1>
          <p className="about__lede" data-intro="rise">
            Sebelum studio kamu ditampilkan ke peta digital, terdapat peninjauan dari kami. Pastikan
            pilih sesuai kebutuhan dan data yang dimasukan sesuai.
          </p>
        </div>
      </header>

      <div className="about__inner">
        <motion.div className="submit__form" {...inView} variants={rise}>
          <SubmissionLayout kinds={KINDS} kind={kind} onKindChange={setKind} checklist={checklist} title={title}>
            {copy.lede && <p className="page__lede">{copy.lede}</p>}
            {status === 'sent' ? (
              <motion.p
                className="notice"
                role="status"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: EASE_OUT }}
              >
                Terima kasih! Pengajuan kamu sudah masuk antrean tinjauan.
              </motion.p>
            ) : inPage ? (
              <>
                {kind === 'removal' ? (
                  <RemovalForm
                    key={kind}
                    onSubmit={handleSubmit}
                    onValuesChange={setValues}
                    submitting={status === 'sending'}
                    studioName={studio?.name}
                  />
                ) : (
                  <RegisterForm key={kind} onSubmit={handleSubmit} onValuesChange={setValues} submitting={status === 'sending'} />
                )}
                <AnimatePresence>
                  {status === 'error' && (
                    <motion.p
                      className="notice"
                      role="alert"
                      initial={{ opacity: 0, x: 0 }}
                      animate={{ opacity: 1, x: [0, -8, 7, -4, 2, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45 }}
                    >
                      {hasSupabase ? (
                        'Pengajuan belum terkirim. Periksa koneksi lalu coba lagi.'
                      ) : (
                        <>
                          Pengiriman belum tersambung. Atur <code>VITE_SUPABASE_URL</code> dan{' '}
                          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> di file <code>.env</code>.
                        </>
                      )}
                    </motion.p>
                  )}
                </AnimatePresence>
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
        </motion.div>
      </div>

      <section className="about__inner about__section submit__process" aria-labelledby="submit-process">
        <SectionHeading id="submit-process">Proses Peninjauan</SectionHeading>
        <motion.div className="about__criteria" {...inView} variants={stagger(0.12)}>
          {STEPS.map((step, i) => (
            <StepBox key={step.label} label={step.label} watermark={String(i + 1)}>
              {step.text}
            </StepBox>
          ))}
        </motion.div>
        <motion.p className="about__note" {...inView} variants={rise}>
          Koreksi dan penghapusan ditanggapi dalam 7 hari. Kontak pribadi hanya ditampilkan dengan
          persetujuan studio.
        </motion.p>
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
