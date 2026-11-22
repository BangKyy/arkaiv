import { useState } from 'react'
import { Link } from 'react-router'
import Button from './Button'
import StudioEditor from './StudioEditor'
import { TextArea } from './Fields'
import { categoryName, getArea } from '../lib/catalog'
import { KIND_LABEL, STATUS_LABEL, formatDateTime, friendlyError, reviewSubmission } from '../lib/admin'

// Payload keys from RegisterForm and RemovalForm, in display order.
const FIELDS = [
  ['name', 'Nama studio'],
  ['address', 'Alamat'],
  ['area', 'Wilayah'],
  ['website', 'Website'],
  ['instagram', 'Instagram'],
  ['categories', 'Kategori'],
  ['description', 'Deskripsi'],
  ['role', 'Hubungan dengan studio'],
  ['email', 'Email pengaju'],
  ['reason', 'Alasan'],
]
// Fields a correction can change, compared against the current record.
const COMPARABLE = ['name', 'address', 'area', 'website', 'instagram', 'categories', 'description']

const show = (key, v) => {
  if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '—'
  if (key === 'categories') return v.map(categoryName).join(', ')
  if (key === 'area') return getArea(v)?.name ?? v
  if (key === 'website') return String(v).replace(/^https?:\/\//i, '').replace(/\/$/, '')
  if (key === 'instagram') return `@${String(v).replace(/^@/, '')}`
  return String(v)
}
const same = (a, b) => show('x', a).toLowerCase() === show('x', b).toLowerCase()

/**
 * Detail and decision for one submission. Nothing changes in `studios` until the admin
 * approves here; approval and the change run as one transaction (review_submission).
 */
export default function SubmissionReview({ submission: sub, studios, onReviewed }) {
  const linked = studios.find((s) => s.id === sub.studio_id) ?? studios.find((s) => s.slug === sub.studio_slug)
  const [targetId, setTargetId] = useState(linked?.id ?? '')
  const [note, setNote] = useState('')
  const [removal, setRemoval] = useState('unpublish')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const target = studios.find((s) => s.id === targetId)
  const p = sub.payload ?? {}
  const pending = sub.status === 'pending'

  const decide = async (decision, extra = {}) => {
    setBusy(true)
    setError('')
    try {
      await reviewSubmission({ id: sub.id, decision, note, ...extra })
      onReviewed(decision)
    } catch (err) {
      setError(friendlyError(err))
      setBusy(false)
    }
  }

  const reject = () => {
    if (window.confirm('Tolak pengajuan ini? Data studio tidak akan berubah.')) decide('rejected')
  }
  const approveRemoval = () => {
    const text =
      removal === 'delete'
        ? `Hapus permanen ${target.name} beserta seluruh datanya? Tindakan ini tidak bisa dibatalkan.`
        : `Sembunyikan ${target.name} dari peta (status kembali ke draf)?`
    if (window.confirm(text)) decide('approved', { studioId: target.id, studio: { removal } })
  }

  // The editor starts from the current record and takes every value the studio sent.
  const requested = Object.fromEntries(COMPARABLE.filter((k) => show(k, p[k]) !== '—').map((k) => [k, p[k]]))
  const initial = sub.kind === 'new' ? requested : target && { ...target, ...requested }

  return (
    <div className="review">
      <header className="review__head">
        <p className="review__kind">
          {KIND_LABEL[sub.kind]} · <span className={`review-status review-status--${sub.status}`}>{STATUS_LABEL[sub.status]}</span>
        </p>
        <h2 className="review__title">{p.name || 'Tanpa nama'}</h2>
        <p className="review__meta">
          Masuk {formatDateTime(sub.created_at)}
          {sub.studio_slug && (
            <>
              {' '}· dari profil <code>/studio/{sub.studio_slug}</code>
            </>
          )}
        </p>
      </header>

      {sub.kind === 'correction' && target ? (
        <section className="review__section">
          <h3 className="review__label">Perubahan yang diminta</h3>
          <div className="review__table-wrap">
            <table className="review__table">
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Sekarang</th>
                  <th scope="col">Diajukan</th>
                </tr>
              </thead>
              <tbody>
                {COMPARABLE.map((k) => {
                  const changed = k in requested && !same(show(k, target[k]), show(k, p[k]))
                  return (
                    <tr key={k} className={changed ? 'is-changed' : ''}>
                      <th scope="row">{FIELDS.find(([key]) => key === k)[1]}</th>
                      <td>{show(k, target[k])}</td>
                      <td>
                        {show(k, p[k])}
                        {changed && <span className="visually-hidden"> (berubah)</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {p.email && <p className="review__meta">Email pengaju: {p.email}</p>}
        </section>
      ) : (
        <section className="review__section">
          <h3 className="review__label">Data yang diajukan</h3>
          <dl className="review__facts">
            {FIELDS.filter(([k]) => k in p).map(([k, label]) => (
              <div key={k}>
                <dt>{label}</dt>
                <dd>{show(k, p[k])}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {!pending && (
        <section className="review__section">
          <h3 className="review__label">Hasil tinjauan</h3>
          <p className="review__meta">
            {STATUS_LABEL[sub.status]} {formatDateTime(sub.reviewed_at)}
            {linked && linked.status === 'published' && (
              <>
                {' '}· <Link to={`/studio/${linked.slug}`}>Lihat profil</Link>
              </>
            )}
          </p>
          {sub.review_note && <p className="review__note">{sub.review_note}</p>}
        </section>
      )}

      {pending && (
        <section className="review__section review__decide">
          <h3 className="review__label">Tinjau</h3>

          {sub.kind !== 'new' && (
            <div className="field field--input">
              <label className="field__label" htmlFor={`target-${sub.id}`}>
                Studio yang dimaksud*
              </label>
              <div className="field__box">
                <select
                  id={`target-${sub.id}`}
                  className="field__input review__select"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                >
                  <option value="">Pilih studio…</option>
                  {studios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.slug}){s.status === 'published' ? '' : ' · draf'}
                    </option>
                  ))}
                </select>
              </div>
              {sub.studio_slug && !linked && (
                <p className="field__hint">Studio “{sub.studio_slug}” tidak ditemukan. Pilih secara manual.</p>
              )}
            </div>
          )}

          <TextArea
            label="Catatan tinjauan (internal)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Mis. alamat dicek lewat Google Maps, Instagram aktif"
            maxLength={500}
          />

          {sub.kind === 'removal' && target && (
            <fieldset className="choice choice--row">
              <legend className="choice__legend">Cara menghapus</legend>
              <div className="choice__options">
                {[
                  { value: 'unpublish', label: 'Sembunyikan (jadi draf)' },
                  { value: 'delete', label: 'Hapus permanen' },
                ].map((o) => (
                  <label key={o.value} className="choice__option">
                    <input
                      type="radio"
                      name={`removal-${sub.id}`}
                      value={o.value}
                      checked={removal === o.value}
                      onChange={() => setRemoval(o.value)}
                    />
                    <span className="btn btn--sm choice__btn">{o.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {error && (
            <p className="notice notice--error" role="alert">
              {error}
            </p>
          )}

          {initial && sub.kind !== 'removal' && (
            <>
              <h3 className="review__label">
                {sub.kind === 'new' ? 'Lengkapi data studio sebelum disetujui' : 'Data setelah koreksi'}
              </h3>
              <StudioEditor
                key={targetId}
                initial={initial}
                isNew={sub.kind === 'new'}
                takenSlugs={new Set(studios.map((s) => s.slug))}
                submitting={busy}
                submitLabel={sub.kind === 'new' ? 'Setujui & simpan studio' : 'Setujui & simpan koreksi'}
                onSubmit={({ studio, categories }) =>
                  decide('approved', { studioId: target?.id, studio, categories })
                }
              />
            </>
          )}

          <div className="review__actions">
            {sub.kind === 'removal' && (
              <Button size="xl" tone="danger" disabled={busy || !target} onClick={approveRemoval}>
                Setujui penghapusan
              </Button>
            )}
            <Button variant="outlined" size="xl" disabled={busy} onClick={reject}>
              Tolak pengajuan
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
