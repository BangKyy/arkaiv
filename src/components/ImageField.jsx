import { useEffect, useId, useRef, useState } from 'react'
import { motion } from 'motion/react'
import Button from './Button'
import { FileFill, Upload } from './icons'
import { ACCEPTED_TYPES, IMAGE_SLOTS, formatBytes, prepareImage } from '../lib/images'
import { useLoading } from '../lib/progress'
import { EASE_OUT } from '../lib/motion'

const ERRORS = {
  type: 'Format harus JPG, PNG, atau WebP.',
  size: 'Ukuran file maksimal 20 MB.',
  compress: 'Gambar ini tidak bisa diperkecil sampai batasnya. Coba gambar lain.',
}

/**
 * Image upload for a studio slot ('logo' or 'cover', see IMAGE_SLOTS), after the Figma
 * "Input/ImageUpload": a dashed drop area with an Upload button and a bullet list of
 * `hints`. The picked file is cropped to the slot's shape and compressed right away, and
 * the preview shows the result; `onChange` gets that prepared image ({ blob, type,
 * width, height, originalBytes, url }, url being its preview) or null. The cover preview
 * marks the area every screen shows.
 */
export default function ImageField({ slot, label, title, hints = [], value, onChange, disabled = false }) {
  const spec = IMAGE_SLOTS[slot]
  const inputRef = useRef(null)
  const id = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  useLoading(busy)

  // Each prepared image carries its own preview URL; release it once it is replaced.
  useEffect(() => () => value && URL.revokeObjectURL(value.url), [value])

  const pick = async (file) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const image = await prepareImage(file, spec)
      onChange({ ...image, url: URL.createObjectURL(image.blob) })
    } catch (err) {
      setError(ERRORS[err.message] ?? 'Gambar tidak bisa dibaca. Coba file lain.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }
  const browse = () => inputRef.current?.click()

  const lowRes = value && value.width < spec.width / 2
  const status = busy
    ? 'Mengompres gambar…'
    : value
      ? `Dikompres: ${formatBytes(value.originalBytes)} → ${formatBytes(value.blob.size)} · ${value.width}×${value.height} px${
          lowRes ? '. Resolusinya rendah, gambar bisa tampak buram.' : ''
        }`
      : ''

  return (
    <div className={`field image-field image-field--${slot} ${error ? 'field--error' : ''}`}>
      <span id={`${id}-label`} className="field__label">
        {label}
      </span>
      <div
        className={`image-field__frame ${value ? 'has-image' : ''} ${dragging ? 'is-dragging' : ''}`}
        aria-busy={busy}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!disabled && !busy) pick(e.dataTransfer.files?.[0])
        }}
      >
        {value ? (
          <>
            {/* Each new image settles in from a slight zoom; the safe area follows. */}
            <motion.img
              key={value.url}
              className="image-field__preview"
              src={value.url}
              alt=""
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
            />
            {spec.safe && (
              <motion.span
                key={`${value.url}-safe`}
                className="image-field__safe"
                style={{ '--safe-x': spec.safe.x, '--safe-y': spec.safe.y }}
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.45 }}
              />
            )}
          </>
        ) : (
          <>
            <div className="image-field__prompt">
              <FileFill size={32} aria-hidden="true" />
              <p className="image-field__title">
                <strong>{title}</strong>
                <span>{busy ? 'Memproses…' : 'Pilih atau seret gambar'}</span>
              </p>
            </div>
            <Button
              size="sm"
              icon={Upload}
              iconPosition="left"
              onClick={browse}
              disabled={disabled || busy}
              aria-describedby={`${id}-label ${id}-hints`}
            >
              Upload
            </Button>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      <p className="field__hint image-field__status" aria-live="polite">
        {error || status}
      </p>
      {hints.length > 0 && (
        <ul id={`${id}-hints`} className="image-field__hints">
          {hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      )}
      {value && (
        <div className="image-field__actions">
          <Button variant="outlined" size="sm" onClick={browse} disabled={disabled || busy}>
            Ganti gambar
          </Button>
          <Button variant="link" size="sm" tone="danger" onClick={() => onChange(null)} disabled={disabled || busy}>
            Hapus
          </Button>
        </div>
      )}
    </div>
  )
}
