import { useState } from 'react'
import Button from './Button'
import { TextArea, TextField } from './Fields'
import { ArrowUpRight, EnvelopeSimple } from './icons'

const REASON_MAX = 300

/**
 * Removal request, styled like RegisterForm. Validates on submit and hands the values
 * to `onSubmit({ name, role, email, reason })`; sending them anywhere is up to the caller.
 */
export default function RemovalForm({ onSubmit, submitting = false, studioName = '' }) {
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const values = {
      name: form.get('name')?.trim(),
      role: form.get('role')?.trim(),
      email: form.get('email')?.trim(),
      reason: form.get('reason')?.trim(),
    }
    const next = {}
    if (!values.name) next.name = 'Nama studio wajib diisi.'
    if (!values.role) next.role = 'Isi hubungan Anda dengan studio.'
    if (!values.email || !/^\S+@\S+\.\S+$/.test(values.email)) next.email = 'Masukkan email yang valid.'
    setErrors(next)
    if (Object.keys(next).length) {
      e.currentTarget.querySelector('[aria-invalid="true"]')?.focus()
      return
    }
    onSubmit?.(values)
  }

  return (
    <form className="register-form" noValidate onSubmit={handleSubmit}>
      <TextField
        name="name"
        label="Nama studio yang ingin dihapus*"
        placeholder="Nama studio"
        defaultValue={studioName}
        error={errors.name}
        autoComplete="organization"
      />
      <div className="register-form__row">
        <TextField name="role" label="Hubungan Anda dengan studio*" placeholder="Pemilik atau perwakilan" error={errors.role} />
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
      <TextArea
        name="reason"
        label={
          <>
            Alasan <span className="field__optional">(opsional)</span>
          </>
        }
        placeholder="Ceritakan alasan penghapusan"
        maxLength={REASON_MAX}
      />
      <Button type="submit" size="xl" icon={ArrowUpRight} className="register-form__submit" disabled={submitting}>
        Kirim permintaan
      </Button>
    </form>
  )
}
