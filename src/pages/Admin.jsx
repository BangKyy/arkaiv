import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { usePageMeta } from '../lib/hooks'
import { useLoading } from '../lib/progress'
import { hasSupabase } from '../lib/studios'
import {
  KIND_LABEL,
  STATUS_LABEL,
  formatDateTime,
  getAdminClient,
  isAdmin,
  listStudios,
  listSubmissions,
  scrollToDetail,
  signIn,
  signOut,
} from '../lib/admin'
import { ArrowClockwise, ArrowUpRight, EnvelopeSimple } from '../components/icons'
import Button from '../components/Button'
import { TextField } from '../components/Fields'
import SubmissionReview from '../components/SubmissionReview'
import StudioManager from '../components/StudioManager'

// Admin dashboard. "Pengajuan": every request from the registration, correction and
// removal forms waits here as `pending` until an admin approves or rejects it; only
// approval changes the directory. "Studio": admins edit, publish, hide, add and delete
// studios directly. Not linked from the site and kept out of search engines.

export default function Admin() {
  usePageMeta('Admin')
  useNoIndex()
  const auth = useAdminAuth()
  useLoading(auth.phase === 'loading')

  return (
    <article className="about about--admin">
      <header className="about__hero">
        <div className="about__inner">
          <p className="about__eyebrow">Arkaiv</p>
          <h1 className="about__title">
            Dasbor <span className="about__title-accent">Admin.</span>
          </h1>
        </div>
      </header>
      <div className="about__inner admin">
        {auth.phase === 'unconfigured' && (
          <p className="notice" role="status">
            Supabase belum diatur. Isi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> di
            file <code>.env</code>.
          </p>
        )}
        {auth.phase === 'loading' && <p className="admin__muted">Memeriksa sesi…</p>}
        {auth.phase === 'signedOut' && <LoginForm />}
        {auth.phase === 'denied' && (
          <div className="admin__login">
            <p className="notice" role="alert">
              Akun {auth.email} tidak punya akses admin.
            </p>
            <Button variant="outlined" size="lg" onClick={signOut}>
              Keluar
            </Button>
          </div>
        )}
        {auth.phase === 'error' && (
          <p className="notice notice--error" role="alert">
            Tidak bisa memeriksa akses: {auth.message}
          </p>
        )}
        {auth.phase === 'ready' && <Dashboard email={auth.email} />}
      </div>
    </article>
  )
}

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.append(meta)
    return () => meta.remove()
  }, [])
}

/** loading | unconfigured | signedOut | denied | error | ready */
function useAdminAuth() {
  const [session, setSession] = useState(undefined)
  const [check, setCheck] = useState({ userId: null, phase: 'loading' })

  useEffect(() => {
    if (!hasSupabase) return undefined
    let sub
    getAdminClient().then((client) => {
      client.auth.getSession().then(({ data }) => setSession(data.session))
      // No Supabase calls inside this callback (supabase-js can deadlock); the effect below does them.
      sub = client.auth.onAuthStateChange((_event, next) => setSession(next)).data.subscription
    })
    return () => sub?.unsubscribe()
  }, [])

  const userId = session?.user?.id
  useEffect(() => {
    if (!userId) return
    let live = true
    isAdmin()
      .then((ok) => live && setCheck({ userId, phase: ok ? 'ready' : 'denied' }))
      .catch((err) => live && setCheck({ userId, phase: 'error', message: err.message }))
    return () => {
      live = false
    }
  }, [userId])

  if (!hasSupabase) return { phase: 'unconfigured' }
  if (session === undefined) return { phase: 'loading' }
  if (!session) return { phase: 'signedOut' }
  const email = session.user.email
  return check.userId === userId ? { ...check, email } : { phase: 'loading' }
}

function LoginForm() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      await signIn(form.get('email').trim(), form.get('password'))
    } catch (err) {
      setError(err?.message?.includes('Invalid login') ? 'Email atau kata sandi salah.' : 'Gagal masuk. Coba lagi.')
      setBusy(false)
    }
  }

  return (
    <form className="register-form admin__login" onSubmit={handleSubmit}>
      <TextField name="email" type="email" label="Email" icon={EnvelopeSimple} autoComplete="username" required />
      <TextField name="password" type="password" label="Kata sandi" autoComplete="current-password" required />
      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="xl" icon={ArrowUpRight} className="register-form__submit" disabled={busy}>
        Masuk
      </Button>
    </form>
  )
}

const STATUS_FILTERS = ['pending', 'approved', 'rejected', 'all']
const KIND_FILTERS = ['all', 'new', 'correction', 'removal']

function Dashboard({ email }) {
  const [params] = useSearchParams()
  const tab = params.get('tab') === 'studio' ? 'studio' : 'pengajuan'
  const [data, setData] = useState({ submissions: [], studios: [], loaded: false })
  const [loadError, setLoadError] = useState('')
  const [flash, setFlash] = useState('')

  const load = useCallback(
    () =>
      Promise.all([listSubmissions(), listStudios()]).then(
        ([submissions, studios]) => {
          setData({ submissions, studios, loaded: true })
          setLoadError('')
        },
        (err) => setLoadError(err.message),
      ),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  const onChanged = async (message) => {
    setFlash(message)
    await load()
  }
  const pending = data.submissions.filter((s) => s.status === 'pending').length

  return (
    <>
      <div className="admin__bar">
        <p className="admin__muted">
          Masuk sebagai <strong>{email}</strong>
        </p>
        <div className="admin__bar-actions">
          <Button variant="outlined" size="md" icon={ArrowClockwise} iconPosition="left" onClick={load}>
            Muat ulang
          </Button>
          <Button variant="outlined" size="md" onClick={signOut}>
            Keluar
          </Button>
        </div>
      </div>

      <nav className="admin__tabs" aria-label="Bagian admin">
        <Link to="/admin" aria-current={tab === 'pengajuan' ? 'page' : undefined} onClick={() => setFlash('')}>
          Pengajuan <span className="admin__tab-count">{pending} menunggu</span>
        </Link>
        <Link to="/admin?tab=studio" aria-current={tab === 'studio' ? 'page' : undefined} onClick={() => setFlash('')}>
          Studio <span className="admin__tab-count">{data.studios.length}</span>
        </Link>
      </nav>

      {loadError && (
        <p className="notice notice--error" role="alert">
          Gagal memuat data: {loadError}
        </p>
      )}
      {flash && (
        <p className="notice" role="status">
          {flash}
        </p>
      )}
      {!data.loaded && !loadError && <p className="admin__muted">Memuat…</p>}

      {data.loaded &&
        (tab === 'studio' ? (
          <StudioManager studios={data.studios} onChanged={onChanged} onSelect={() => setFlash('')} />
        ) : (
          <SubmissionsTab
            submissions={data.submissions}
            studios={data.studios}
            onReviewed={(decision) =>
              onChanged(decision === 'approved' ? 'Pengajuan disetujui dan data studio diperbarui.' : 'Pengajuan ditolak.')
            }
            onSelect={() => setFlash('')}
          />
        ))}
    </>
  )
}

function SubmissionsTab({ submissions, studios, onReviewed, onSelect }) {
  const [status, setStatus] = useState('pending')
  const [kind, setKind] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const detailRef = useRef(null)

  const byKind = submissions.filter((s) => kind === 'all' || s.kind === kind)
  const shown = byKind.filter((s) => status === 'all' || s.status === status)
  const count = (st) => byKind.filter((s) => st === 'all' || s.status === st).length
  const selected = submissions.find((s) => s.id === selectedId)

  const select = (id) => {
    setSelectedId(id)
    onSelect()
    scrollToDetail(detailRef)
  }

  return (
    <>
      <div className="admin__filters">
        <FilterGroup
          legend="Status"
          name="status"
          value={status}
          onChange={setStatus}
          options={STATUS_FILTERS.map((v) => ({ value: v, label: `${v === 'all' ? 'Semua' : STATUS_LABEL[v]} (${count(v)})` }))}
        />
        <FilterGroup
          legend="Jenis"
          name="kind"
          value={kind}
          onChange={setKind}
          options={KIND_FILTERS.map((v) => ({ value: v, label: v === 'all' ? 'Semua jenis' : KIND_LABEL[v] }))}
        />
      </div>

      <div className="admin__layout">
        <section aria-label="Daftar pengajuan" className="admin__side">
          {!shown.length && <p className="admin__muted">Tidak ada pengajuan di sini.</p>}
          <ul className="admin__list">
            {shown.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="admin__item"
                  aria-current={s.id === selectedId ? 'true' : undefined}
                  onClick={() => select(s.id)}
                >
                  <span className="admin__item-top">
                    <span>{KIND_LABEL[s.kind]}</span>
                    <span className={`review-status review-status--${s.status}`}>{STATUS_LABEL[s.status]}</span>
                  </span>
                  <span className="admin__item-name">{s.payload?.name || 'Tanpa nama'}</span>
                  <span className="admin__item-date">{formatDateTime(s.created_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section ref={detailRef} className="admin__detail" aria-label="Detail pengajuan">
          {selected ? (
            <SubmissionReview
              key={`${selected.id}-${selected.status}`}
              submission={selected}
              studios={studios}
              onReviewed={onReviewed}
            />
          ) : (
            <p className="admin__muted">Pilih pengajuan untuk melihat detail dan meninjaunya.</p>
          )}
        </section>
      </div>
    </>
  )
}

function FilterGroup({ legend, name, value, onChange, options }) {
  return (
    <fieldset className="choice choice--row">
      <legend className="choice__legend">{legend}</legend>
      <div className="choice__options">
        {options.map((o) => (
          <label key={o.value} className="choice__option">
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            <span className="btn btn--sm choice__btn">{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
