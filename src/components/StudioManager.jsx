import { useRef, useState } from 'react'
import { Link } from 'react-router'
import Button from './Button'
import StudioEditor from './StudioEditor'
import { SearchField } from './Fields'
import { getArea } from '../lib/catalog'
import {
  STUDIO_STATUS_LABEL,
  deleteStudio,
  formatDateTime,
  friendlyError,
  saveStudio,
  scrollToDetail,
  setStudioStatus,
} from '../lib/admin'

const STATUS_FILTERS = ['all', 'published', 'draft', 'needs_review']

// Same rule as isListable() in studioRow.js: what a studio needs before the map can show it.
const missingForMap = (s) =>
  [
    !(Number.isFinite(s.lat) && Number.isFinite(s.lng)) && 'koordinat',
    !(s.website || s.instagram) && 'website atau Instagram',
    !s.categories?.length && 'kategori',
  ].filter(Boolean)

/**
 * "Studio" tab of /admin: every studio, drafts included. Admins edit, publish, hide,
 * add and delete studios here directly; visitors' requests go through the review tab.
 * `onChanged(message)` reloads the data in the parent.
 */
export default function StudioManager({ studios, onChanged, onSelect }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const detailRef = useRef(null)

  const q = query.trim().toLowerCase()
  const matches = studios.filter((s) => !q || s.name.toLowerCase().includes(q) || s.slug.includes(q))
  const shown = matches.filter((s) => status === 'all' || s.status === status)
  const count = (st) => matches.filter((s) => st === 'all' || s.status === st).length
  const selected = studios.find((s) => s.id === selectedId)

  const select = (id) => {
    setSelectedId(id)
    onSelect?.()
    scrollToDetail(detailRef)
  }

  return (
    <div className="admin__layout">
      <section aria-label="Daftar studio" className="admin__side">
        <div className="admin__side-tools">
          <Button size="md" onClick={() => select('new')} aria-pressed={selectedId === 'new'}>
            + Tambah studio
          </Button>
          <SearchField
            size="sm"
            aria-label="Cari nama atau slug studio"
            placeholder="Cari studio"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <fieldset className="choice choice--row">
            <legend className="visually-hidden">Status studio</legend>
            <div className="choice__options">
              {STATUS_FILTERS.map((v) => (
                <label key={v} className="choice__option">
                  <input type="radio" name="studio-status-filter" checked={status === v} onChange={() => setStatus(v)} />
                  <span className="btn btn--sm choice__btn">
                    {v === 'all' ? 'Semua' : STUDIO_STATUS_LABEL[v]} ({count(v)})
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        {!shown.length && <p className="admin__muted">Tidak ada studio di sini.</p>}
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
                  <span>{getArea(s.area)?.name ?? s.area}</span>
                  <span className={`review-status review-status--${s.status}`}>{STUDIO_STATUS_LABEL[s.status]}</span>
                </span>
                <span className="admin__item-name">{s.name}</span>
                <span className="admin__item-date">/studio/{s.slug}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section ref={detailRef} className="admin__detail" aria-label="Detail studio">
        {selectedId === 'new' ? (
          <NewStudio
            takenSlugs={new Set(studios.map((s) => s.slug))}
            onCreated={(id, name) => {
              setSelectedId(id)
              onChanged(`${name} ditambahkan.`)
            }}
          />
        ) : selected ? (
          <StudioDetail
            key={selected.id}
            studio={selected}
            onChanged={onChanged}
            onDeleted={(name) => {
              setSelectedId(null)
              onChanged(`${name} dihapus permanen.`)
            }}
          />
        ) : (
          <p className="admin__muted">Pilih studio untuk mengubah datanya, atau tambah studio baru.</p>
        )}
      </section>
    </div>
  )
}

function NewStudio({ takenSlugs, onCreated }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async ({ studio, categories }) => {
    setBusy(true)
    setError('')
    try {
      const id = await saveStudio({ studio, categories })
      onCreated(id, studio.name)
    } catch (err) {
      setError(friendlyError(err))
      setBusy(false)
    }
  }

  return (
    <div className="review">
      <header className="review__head">
        <p className="review__kind">Studio</p>
        <h2 className="review__title">Tambah studio</h2>
        <p className="review__meta">Untuk studio yang didata langsung oleh tim, tanpa formulir pendaftaran.</p>
      </header>
      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      <StudioEditor
        initial={{ status: 'draft' }}
        isNew
        takenSlugs={takenSlugs}
        statusLabel="Status"
        submitLabel="Simpan studio"
        submitting={busy}
        onSubmit={save}
      />
    </div>
  )
}

function StudioDetail({ studio: s, onChanged, onDeleted }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const missing = missingForMap(s)
  const published = s.status === 'published'

  const run = async (action, message) => {
    setBusy(true)
    setError('')
    try {
      await action()
      onChanged(message)
    } catch (err) {
      setError(friendlyError(err))
    }
    setBusy(false)
  }

  const togglePublished = () =>
    run(
      () => setStudioStatus(s.id, published ? 'draft' : 'published'),
      published ? `${s.name} disembunyikan dari peta.` : `${s.name} terbit di peta.`,
    )

  const remove = () => {
    if (window.confirm(`Hapus permanen ${s.name} beserta seluruh datanya? Tindakan ini tidak bisa dibatalkan.`)) {
      setBusy(true)
      setError('')
      deleteStudio(s.id).then(
        () => onDeleted(s.name),
        (err) => {
          setError(friendlyError(err))
          setBusy(false)
        },
      )
    }
  }

  return (
    <div className="review">
      <header className="review__head">
        <p className="review__kind">
          Studio{s.code ? ` · ${s.code}` : ''} ·{' '}
          <span className={`review-status review-status--${s.status}`}>{STUDIO_STATUS_LABEL[s.status]}</span>
        </p>
        <h2 className="review__title">{s.name}</h2>
        <p className="review__meta">
          {published ? <Link to={`/studio/${s.slug}`}>/studio/{s.slug}</Link> : <>/studio/{s.slug}</>}
          {s.updated_at && <> · diperbarui {formatDateTime(s.updated_at)}</>}
          {s.source && <> · sumber: {s.source}</>}
        </p>
      </header>

      <div className="review__actions">
        <Button
          size="md"
          variant={published ? 'outlined' : 'primary'}
          disabled={busy || (!published && missing.length > 0)}
          onClick={togglePublished}
        >
          {published ? 'Sembunyikan (jadi draf)' : 'Terbitkan di peta'}
        </Button>
        <Button size="md" tone="danger" disabled={busy} onClick={remove}>
          Hapus permanen
        </Button>
      </div>
      {!published && missing.length > 0 && (
        <p className="review__meta">Belum bisa terbit, lengkapi dulu: {missing.join(', ')}.</p>
      )}

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}

      <section className="review__section review__decide">
        <h3 className="review__label">Ubah data</h3>
        <StudioEditor
          key={s.updated_at}
          initial={s}
          isNew={false}
          statusLabel="Status"
          submitLabel="Simpan perubahan"
          submitting={busy}
          onSubmit={({ studio, categories }) =>
            run(() => saveStudio({ id: s.id, studio, categories }), `Perubahan ${studio.name} disimpan.`)
          }
        />
      </section>
    </div>
  )
}
