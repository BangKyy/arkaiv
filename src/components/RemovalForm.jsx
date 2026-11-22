import { useEffect, useRef, useState } from 'react'
import Button from './Button'
import { TextArea, TextField } from './Fields'
import { ArrowUpRight, EnvelopeSimple } from './icons'
import { clearFixedErrors } from '../lib/forms'

const REASON_MAX = 300

function validate(values) {
  const errors = {}
  if (!values.name) errors.name = 'Nama studio wajib diisi.'
  if (!values.role) errors.role = 'Isi hubungan Anda dengan studio.'
  if (!values.email || !/^\S+@\S+\.\S+$/.test(values.email)) errors.email = 'Masukkan email yang valid.'
  return errors
}

/**
 * Removal request, styled like RegisterForm. Validates on submit and hands the values
 * to `onSubmit({ name, role, email, reason })`; sending them anywhere is up to the caller.
 * `onValuesChange` gets the same values while the form is filled in.
 */
export default function RemovalForm({ onSubmit, onValuesChange, submitting = false, studioName = '' }) {
  const formRef = useRef(null)
  const [errors, setErrors] = useState({})

  const readValues = (formEl) => {
    const form = new FormData(formEl)
    return {
      name: form.get('name')?.trim(),
      role: form.get('role')?.trim(),
      email: form.get('email')?.trim(),
      reason: form.get('reason')?.trim(),
    }
  }
  // Reports the values and drops the errors of fields that are now filled in correctly.
  const report = () => {
    const values = readValues(formRef.current)
    onValuesChange?.(values)
    setErrors((prev) => clearFixedErrors(prev, validate(values)))
  }

  // The studio name can arrive prefilled; count it from the start.
  useEffect(() => {
    report()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
