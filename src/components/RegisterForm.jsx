import { useEffect, useRef, useState } from 'react'
import Button from './Button'
import RegionSelect from './RegionSelect'
import { TagCategory } from './Tags'
import { TextArea, TextField } from './Fields'
import { ArrowUpRight, EnvelopeSimple, InstagramLogo } from './icons'
import { categories } from '../lib/catalog'
import { clearFixedErrors } from '../lib/forms'

const MAX_CATEGORIES = 3
const DESCRIPTION_MAX = 300

function validate(values) {
  const errors = {}
  if (!values.name) errors.name = 'Nama studio wajib diisi.'
  if (!values.address) errors.address = 'Alamat wajib diisi.'
  if (!values.area) errors.area = 'Pilih wilayah studio.'
  if (!values.email || !/^\S+@\S+\.\S+$/.test(values.email)) errors.email = 'Masukkan email yang valid.'
  if (!values.website && !values.instagram) errors.website = 'Isi website atau Instagram (min salah satu).'
  if (!values.categories.length) errors.categories = 'Pilih minimal satu kategori.'
  return errors
}

const Optional = ({ children }) => (
  <>
    {children} <span className="field__optional">(opsional)</span>
  </>
)

/**
 * "Form" (studio registration) from the Figma library: two columns on wide screens
 * (Size=lg), one column on phones (Size=sm). Validates on submit and hands the values
 * to `onSubmit({ name, address, area, email, website, instagram, categories, description })`;
 * sending them anywhere is up to the caller. `onValuesChange` gets the same values while
 * the form is filled in (for the progress checklist).
 */
export default function RegisterForm({ onSubmit, onValuesChange, submitting = false }) {
  const formRef = useRef(null)
  const [area, setArea] = useState('')
  const [picked, setPicked] = useState([])
  const [errors, setErrors] = useState({})

  const togglePick = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((c) => c !== id) : p.length < MAX_CATEGORIES ? [...p, id] : p))

  const readValues = (formEl) => {
    const form = new FormData(formEl)
    return {
      name: form.get('name')?.trim(),
      address: form.get('address')?.trim(),
      area,
      email: form.get('email')?.trim(),
      website: form.get('website')?.trim(),
      instagram: form.get('instagram')?.trim(),
      categories: picked,
      description: form.get('description')?.trim(),
    }
  }
  // Reports the values and drops the errors of fields that are now filled in correctly.
  const report = () => {
    const values = readValues(formRef.current)
    onValuesChange?.(values)
    setErrors((prev) => clearFixedErrors(prev, validate(values)))
  }

  // Region and categories are not inputs, so their changes are reported from here.
  useEffect(() => {
    report()
  }, [area, picked]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e) => {
    e.preventDefault()
    const values = readValues(e.currentTarget)
    const next = validate(values)
    setErrors(next)
    if (Object.keys(next).length) {
      e.currentTarget.querySelector('[aria-invalid="true"]')?.focus()
      return
    }
    onSubmit?.(values)
  }

  return (
    <form ref={formRef} className="register-form" noValidate onSubmit={handleSubmit} onInput={report}>
      <TextField name="name" label="Nama resmi studio*" placeholder="Nama studio" error={errors.name} autoComplete="organization" />
      <TextField name="address" label="Alamat jalan*" placeholder="Jl. ..." error={errors.address} autoComplete="street-address" />
      <div className="register-form__row">
        <RegionSelect label="Wilayah*" name="area" value={area} onChange={setArea} error={errors.area} />
        <TextField
          name="email"
          type="email"
          label="Email*"
          icon={EnvelopeSimple}
          placeholder="nama@studio.com"
          error={errors.email}
          autoComplete="email"
        />
      </div>
      <div className="register-form__row register-form__row--links">
        <TextField
          name="website"
          type="url"
          label={<Optional>Website</Optional>}
          leading="https://"
          placeholder="studio.com"
          error={errors.website}
          className="register-form__website"
        />
        <TextField
          name="instagram"
          label={<Optional>Instagram</Optional>}
          icon={InstagramLogo}
          placeholder="@studio"
          className="register-form__instagram"
        />
      </div>
      <fieldset className="register-form__categories" aria-describedby={errors.categories ? 'register-cat-error' : undefined}>
        <legend className="field__label">Pilih kategori maksimal {MAX_CATEGORIES}*</legend>
        <div className="register-form__tags">
          {categories.map((c) => {
            const on = picked.includes(c.id)
            return (
              <TagCategory
                key={c.id}
                as="button"
                category={c.id}
                variant="outlined-netral"
                aria-pressed={on}
                aria-invalid={errors.categories && !picked.length ? true : undefined}
                disabled={!on && picked.length >= MAX_CATEGORIES}
                onClick={() => togglePick(c.id)}
              />
            )
          })}
        </div>
        {errors.categories && (
          <p id="register-cat-error" className="field__hint register-form__error">
            {errors.categories}
          </p>
        )}
      </fieldset>
      <TextArea
        name="description"
        label={<Optional>Deskripsi</Optional>}
        placeholder="Masukkan deskripsi"
        maxLength={DESCRIPTION_MAX}
      />
      <Button type="submit" size="xl" icon={ArrowUpRight} className="register-form__submit" disabled={submitting}>
        Kirim pengajuan
      </Button>
    </form>
  )
}
