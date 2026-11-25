import { useState } from 'react'
import Button from './Button'
import ListEditor from './ListEditor'
import RegionSelect from './RegionSelect'
import { TagCategory } from './Tags'
import { TextArea, TextField } from './Fields'
import { ArrowUpRight, EnvelopeSimple, InstagramLogo, WhatsappLogo } from './icons'
import { categories } from '../lib/catalog'
import { clearFixedErrors } from '../lib/forms'

const MAX_CATEGORIES = 3
const DESCRIPTION_MAX = 300

const PEOPLE_FIELDS = [
  { key: 'name', label: 'Nama*' },
  { key: 'role', label: 'Peran', placeholder: 'Creative Director' },
  { key: 'photo', label: 'URL foto', placeholder: 'https://...' },
  { key: 'internship', label: 'Internship', type: 'checkbox' },
]

const PROJECT_FIELDS = [
  { key: 'title', label: 'Judul*' },
  { key: 'year', label: 'Tahun', type: 'number', placeholder: '2026' },
  {
    key: 'category',
    label: 'Kategori',
    type: 'select',
    options: categories.map((c) => ({ value: c.id, label: c.name })),
  },
  { key: 'description', label: 'Deskripsi singkat' },
  { key: 'url', label: 'Tautan "Lihat lebih lanjut"', placeholder: 'https://...' },
  { key: 'image', label: 'URL gambar', placeholder: 'https://...' },
]

/** One entry per non-empty line. */
const lines = (s) =>
  s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

/** Drops empty optional keys so the stored JSON stays small. */
const compact = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== false && v != null))

/** Errors for one list ("people.0.name") keyed as ListEditor expects ("0.name"). */
const prefixed = (errors, list) =>
  Object.fromEntries(
    Object.entries(errors)
      .filter(([k]) => k.startsWith(`${list}.`))
      .map(([k, v]) => [k.slice(list.length + 1), v]),
  )

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

// Rows left completely empty are dropped instead of flagged.
const filledPeople = (people) => people.filter((p) => p.internship || [p.name, p.role, p.photo].some((x) => x.trim()))
const filledProjects = (projects) =>
  projects.filter((p) => p.category || [p.title, p.year, p.description, p.url, p.image].some((x) => x.trim()))

function validate(v, { isNew, takenSlugs }) {
  const errors = {}
  if (!v.name.trim()) errors.name = 'Nama studio wajib diisi.'
  if (isNew) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug)) errors.slug = 'Gunakan huruf kecil, angka, dan tanda hubung.'
    else if (takenSlugs?.has(v.slug)) errors.slug = 'Slug ini sudah dipakai studio lain.'
  }
  if (!v.description.trim()) errors.description = 'Deskripsi wajib diisi (tampil di peta dan profil).'
  if (!v.address.trim()) errors.address = 'Alamat wajib diisi.'
  if (!v.area) errors.area = 'Pilih wilayah studio.'
  if (!parseCoords(v.coords)) errors.coords = 'Tulis koordinat sebagai "lintang, bujur", mis. -7.2575, 112.7521.'
  if (!v.website.trim() && !v.instagram.trim()) errors.website = 'Isi website atau Instagram (min salah satu).'
  if (!v.categories.length) errors.categories = 'Pilih minimal satu kategori.'
  const founded = v.founded_year.trim()
  if (founded && !(/^\d{4}$/.test(founded) && founded >= 1900 && founded <= 2100)) {
    errors.founded_year = 'Tulis tahun empat angka, mis. 2011.'
  }
  if (v.contact_email.trim() && !/^\S+@\S+\.\S+$/.test(v.contact_email.trim())) {
    errors.contact_email = 'Masukkan email yang valid.'
  }
  filledPeople(v.people).forEach((p, i) => {
    if (!p.name.trim()) errors[`people.${i}.name`] = 'Nama wajib diisi (atau hapus baris ini).'
  })
  filledProjects(v.projects).forEach((p, i) => {
    if (!p.title.trim()) errors[`projects.${i}.title`] = 'Judul wajib diisi (atau hapus baris ini).'
    if (p.year.trim() && !/^\d{4}$/.test(p.year.trim())) errors[`projects.${i}.year`] = 'Tulis tahun empat angka.'
  })
  return errors
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
    // Studio page content (Figma "Pages/Detailed Studio").
    about: initial.about ?? '',
    founded_year: initial.founded_year ? String(initial.founded_year) : '',
    studio_type: initial.studio_type ?? '',
    specialties: (initial.specialties ?? []).join(', '),
    approach: initial.approach ?? '',
    process: (initial.process ?? []).join('\n'),
    people: (initial.people ?? []).map((p) => ({ name: '', role: '', photo: '', internship: false, ...p })),
    projects: (initial.projects ?? []).map((p) => ({
      title: '',
      category: '',
      description: '',
      url: '',
      image: '',
      ...p,
      year: p.year ? String(p.year) : '',
    })),
    contact_email: initial.contact_email ?? '',
    contact_phone: initial.contact_phone ?? '',
    contact_whatsapp: initial.contact_whatsapp ?? '',
    opening_hours: initial.opening_hours ?? '',
    logo_url: initial.logo_url ?? '',
    cover_url: initial.cover_url ?? '',
  }))
  const [slugTouched, setSlugTouched] = useState(!isNew)
  // Errors are set on submit; a field drops its error as soon as it is filled in correctly.
  const [submitErrors, setErrors] = useState({})
  const errors = clearFixedErrors(submitErrors, validate(values, { isNew, takenSlugs }))

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
    const next = validate(v, { isNew, takenSlugs })
    const founded = v.founded_year.trim()
    const people = filledPeople(v.people)
    const projects = filledProjects(v.projects)
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
        about: v.about.trim(),
        founded_year: founded ? Number(founded) : null,
        studio_type: v.studio_type.trim(),
        specialties: v.specialties
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        approach: v.approach.trim(),
        process: lines(v.process),
        people: people.map((p) =>
          compact({ name: p.name.trim(), role: p.role.trim(), photo: normalizeUrl(p.photo.trim()), internship: p.internship }),
        ),
        projects: projects.map((p) =>
          compact({
            title: p.title.trim(),
            year: p.year.trim() ? Number(p.year) : null,
            category: p.category,
            description: p.description.trim(),
            url: normalizeUrl(p.url.trim()),
            image: normalizeUrl(p.image.trim()),
          }),
        ),
        contact_email: v.contact_email.trim(),
        contact_phone: v.contact_phone.trim(),
        contact_whatsapp: v.contact_whatsapp.trim(),
        opening_hours: lines(v.opening_hours).join('\n'),
        logo_url: normalizeUrl(v.logo_url.trim()),
        cover_url: normalizeUrl(v.cover_url.trim()),
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

      <fieldset className="studio-editor__group">
        <legend className="studio-editor__group-title">Halaman studio</legend>
        <p className="studio-editor__group-hint">Bagian yang kosong tidak tampil di halaman studio.</p>
        <div className="register-form__row">
          <TextField
            label="URL logo"
            type="url"
            value={values.logo_url}
            onChange={set('logo_url')}
            placeholder="https://..."
            hint="Persegi 1:1. Dari formulir pendaftaran, terisi otomatis."
          />
          <TextField
            label="URL gambar header"
            type="url"
            value={values.cover_url}
            onChange={set('cover_url')}
            placeholder="https://..."
            hint="Rasio 4:1 (2400×600 px)."
          />
        </div>
        {(values.logo_url || values.cover_url) && (
          <div className="studio-editor__images" aria-hidden="true">
            {values.logo_url && <img className="studio-editor__logo" src={values.logo_url} alt="" />}
            {values.cover_url && <img className="studio-editor__cover" src={values.cover_url} alt="" />}
          </div>
        )}
        <TextArea
          label="Tentang"
          value={values.about}
          onChange={set('about')}
          hint="Catatan di bagian Tentang. Kosong: memakai deskripsi."
        />
        <div className="register-form__row">
          <TextField
            label="Tahun berdiri"
            value={values.founded_year}
            onChange={set('founded_year')}
            inputMode="numeric"
            placeholder="2011"
            error={errors.founded_year}
          />
          <TextField label="Jenis" value={values.studio_type} onChange={set('studio_type')} placeholder="Kantor Perusahaan" />
        </div>
        <TextField
          label="Spesialisasi bebas"
          value={values.specialties}
          onChange={set('specialties')}
          placeholder="identitas visual, packaging"
          hint="Pisahkan dengan koma. Tampil sebagai tag bergaris."
        />
        <ListEditor
          legend="Tim"
          itemLabel="Anggota"
          addLabel="Tambah anggota"
          fields={PEOPLE_FIELDS}
          items={values.people}
          onChange={set('people')}
          errors={prefixed(errors, 'people')}
        />
        <TextArea
          label="Langkah proses"
          value={values.process}
          onChange={set('process')}
          placeholder={'Riset bersama klien\nEksplorasi sketsa'}
          hint="Satu langkah per baris. Tampil sebagai kotak Langkah 1, 2, ..."
        />
        <TextArea
          label="Pendekatan"
          value={values.approach}
          onChange={set('approach')}
          hint="Catatan di bawah langkah proses."
        />
        <ListEditor
          legend="Portofolio"
          itemLabel="Proyek"
          addLabel="Tambah proyek"
          fields={PROJECT_FIELDS}
          items={values.projects}
          onChange={set('projects')}
          errors={prefixed(errors, 'projects')}
        />
      </fieldset>

      <fieldset className="studio-editor__group">
        <legend className="studio-editor__group-title">Kontak langsung</legend>
        <p className="studio-editor__group-hint">Isi hanya dengan persetujuan studio. Tampil di bagian Kontak.</p>
        <div className="register-form__row">
          <TextField
            label="Email"
            type="email"
            icon={EnvelopeSimple}
            value={values.contact_email}
            onChange={set('contact_email')}
            placeholder="nama@studio.com"
            error={errors.contact_email}
          />
          <TextField
            label="Telepon"
            type="tel"
            value={values.contact_phone}
            onChange={set('contact_phone')}
            placeholder="031 123 4567"
          />
        </div>
        <div className="register-form__row">
          <TextField
            label="WhatsApp"
            type="tel"
            icon={WhatsappLogo}
            value={values.contact_whatsapp}
            onChange={set('contact_whatsapp')}
            placeholder="62812..."
          />
        </div>
        <TextArea
          label="Jam operasional"
          value={values.opening_hours}
          onChange={set('opening_hours')}
          placeholder={'Senin - Jumat\n09.00 WIB - 16.00 WIB'}
          hint="Setiap baris tampil di barisnya sendiri."
        />
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
