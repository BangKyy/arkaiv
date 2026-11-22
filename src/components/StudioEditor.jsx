import { useState } from 'react'
import Button from './Button'
import RegionSelect from './RegionSelect'
import { TagCategory } from './Tags'
import { TextArea, TextField } from './Fields'
import { ArrowUpRight, InstagramLogo } from './icons'
import { categories } from '../lib/catalog'

const MAX_CATEGORIES = 3
const DESCRIPTION_MAX = 300

const slugify = (s = '') =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** "studio.com" -> "https://studio.com"; empty stays empty. */
const normalizeUrl = (s) => (s && !/^https?:\/\//i.test(s) ? `https://${s}` : s)

/** "@studio", "instagram.com/studio/" -> "studio". */
const normalizeHandle = (s) =>
  s
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '')

const parseCoords = (s) => {
  const m = s.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
  if (!m) return null
  const [lat, lng] = [Number(m[1]), Number(m[2])]
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null
}

/**
 * The record an approval writes to `studios`, in the RegisterForm style. The admin
 * completes what visitors cannot give (slug, coordinates, status) and checks the rest.
 * `initial` uses the `studios` column names plus `categories` (primary first).
 * Calls `onSubmit({ studio, categories })`; `takenSlugs` blocks duplicate slugs.
 */
export default function StudioEditor({
  initial,
  isNew,
  takenSlugs,
  statusLabel = 'Status setelah disetujui',
  submitLabel,
  submitting,
  onSubmit,
}) {
  const [values, setValues] = useState(() => ({
    name: initial.name ?? '',
    slug: initial.slug ?? slugify(initial.name),
    description: initial.description ?? '',
    address: initial.address ?? '',
    area: initial.area ?? '',
    coords: Number.isFinite(initial.lat) && Number.isFinite(initial.lng) ? `${initial.lat}, ${initial.lng}` : '',
    website: initial.website ?? '',
    instagram: initial.instagram ?? '',
    categories: (initial.categories ?? []).slice(0, MAX_CATEGORIES),
    status: !initial.status || initial.status === 'published' ? 'published' : 'draft',
  }))
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e
    setValues((v) => ({ ...v, [key]: value, ...(key === 'name' && !slugTouched ? { slug: slugify(value) } : {}) }))
  }
  const togglePick = (id) =>
    setValues((v) => {
      const p = v.categories
      const next = p.includes(id) ? p.filter((c) => c !== id) : p.length < MAX_CATEGORIES ? [...p, id] : p
      return { ...v, categories: next }
    })

  const coords = parseCoords(values.coords)
  const mapsSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    coords ? `${coords.lat},${coords.lng}` : `${values.address}, Surabaya`,
  )}`

  const handleSubmit = (e) => {
    e.preventDefault()
    const v = { ...values, name: values.name.trim(), description: values.description.trim(), address: values.address.trim() }
    const next = {}
    if (!v.name) next.name = 'Nama studio wajib diisi.'
    if (isNew) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug)) next.slug = 'Gunakan huruf kecil, angka, dan tanda hubung.'
      else if (takenSlugs?.has(v.slug)) next.slug = 'Slug ini sudah dipakai studio lain.'
    }
    if (!v.description) next.description = 'Deskripsi wajib diisi (tampil di peta dan profil).'
    if (!v.address) next.address = 'Alamat wajib diisi.'
    if (!v.area) next.area = 'Pilih wilayah studio.'
    if (!coords) next.coords = 'Tulis koordinat sebagai "lintang, bujur", mis. -7.2575, 112.7521.'
    if (!v.website.trim() && !v.instagram.trim()) next.website = 'Isi website atau Instagram (min salah satu).'
    if (!v.categories.length) next.categories = 'Pilih minimal satu kategori.'
    setErrors(next)
    if (Object.keys(next).length) {
      e.currentTarget.querySelector('[aria-invalid="true"]')?.focus()
      return
    }
    onSubmit({
      studio: {
        slug: v.slug,
        name: v.name,
        description: v.description,
        primary_category: v.categories[0],
        address: v.address,
        area: v.area,
        lat: coords.lat,
        lng: coords.lng,
        website: normalizeUrl(v.website.trim()),
        instagram: normalizeHandle(v.instagram.trim()),
        status: v.status,
      },
      categories: v.categories,
    })
  }

  return (
    <form className="register-form studio-editor" noValidate onSubmit={handleSubmit}>
      <div className="register-form__row">
        <TextField label="Nama studio*" value={values.name} onChange={set('name')} error={errors.name} />
        <TextField
          label="Slug (URL profil)*"
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true)
            set('slug')(e)
          }}
          leading="/studio/"
          error={errors.slug}
          hint={isNew ? 'Tidak bisa diubah setelah terbit.' : 'Tetap, agar tautan dan kode QR tidak putus.'}
          disabled={!isNew}
        />
      </div>
      <TextArea
        label="Deskripsi*"
        value={values.description}
        onChange={set('description')}
        maxLength={DESCRIPTION_MAX}
        error={errors.description}
        hint={`${values.description.length}/${DESCRIPTION_MAX} karakter`}
      />
      <TextField label="Alamat jalan*" value={values.address} onChange={set('address')} error={errors.address} />
      <div className="register-form__row">
        <RegionSelect label="Wilayah*" value={values.area} onChange={set('area')} error={errors.area} />
        <div className="studio-editor__coords">
          <TextField
            label="Koordinat (lintang, bujur)*"
            value={values.coords}
            onChange={set('coords')}
            placeholder="-7.2575, 112.7521"
            inputMode="decimal"
            error={errors.coords}
          />
          <a href={mapsSearch} target="_blank" rel="noopener noreferrer" className="studio-editor__maps">
            {coords ? 'Cek titik di Google Maps' : 'Cari alamat di Google Maps'}
            <ArrowUpRight size={14} aria-hidden="true" focusable="false" />
            <span className="visually-hidden"> (membuka tab baru)</span>
          </a>
        </div>
      </div>
      <div className="register-form__row">
        <TextField
          label="Website"
          value={values.website}
          onChange={set('website')}
          placeholder="https://studio.com"
          error={errors.website}
        />
        <TextField
          label="Instagram"
          icon={InstagramLogo}
          value={values.instagram}
          onChange={set('instagram')}
          placeholder="@studio"
        />
      </div>
      <fieldset className="register-form__categories">
        <legend className="field__label">Kategori, maksimal {MAX_CATEGORIES}* (yang pertama dipilih jadi kategori utama)</legend>
        <div className="register-form__tags">
          {categories.map((c) => {
            const on = values.categories.includes(c.id)
            return (
              <TagCategory
                key={c.id}
                as="button"
                category={c.id}
                variant={values.categories[0] === c.id ? 'netral' : 'outlined-netral'}
                aria-pressed={on}
                aria-invalid={errors.categories && !values.categories.length ? true : undefined}
                disabled={!on && values.categories.length >= MAX_CATEGORIES}
                onClick={() => togglePick(c.id)}
              >
                {values.categories[0] === c.id && <span className="studio-editor__primary">Utama</span>}
              </TagCategory>
            )
          })}
        </div>
        {errors.categories && <p className="field__hint register-form__error">{errors.categories}</p>}
      </fieldset>
      <fieldset className="choice choice--row">
        <legend className="choice__legend">{statusLabel}</legend>
        <div className="choice__options">
          {[
            { value: 'published', label: 'Terbit di peta' },
            { value: 'draft', label: 'Simpan sebagai draf' },
          ].map((o) => (
            <label key={o.value} className="choice__option">
              <input
                type="radio"
                name="studio-status"
                value={o.value}
                checked={values.status === o.value}
                onChange={() => setValues((v) => ({ ...v, status: o.value }))}
              />
              <span className="btn btn--sm choice__btn">{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Button type="submit" size="xl" icon={ArrowUpRight} className="register-form__submit" disabled={submitting}>
        {submitLabel}
      </Button>
    </form>
  )
}
