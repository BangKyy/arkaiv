import { useId } from 'react'
import Button from './Button'
import Checkbox from './Checkbox'
import { TextField } from './Fields'

/**
 * Repeating rows of fields for the admin editor (team members, projects). `fields` is
 * [{ key, label, type: 'text' | 'number' | 'select' | 'checkbox', options, placeholder }];
 * `items` are plain objects keyed the same way. Rows can be added, moved up and removed;
 * their order is the order on the studio page.
 */
export default function ListEditor({ legend, itemLabel, addLabel, fields, items, onChange, errors = {} }) {
  const blank = Object.fromEntries(fields.map((f) => [f.key, f.type === 'checkbox' ? false : '']))
  const update = (i, key, value) => onChange(items.map((item, j) => (j === i ? { ...item, [key]: value } : item)))
  const remove = (i) => onChange(items.filter((_, j) => j !== i))
  const moveUp = (i) => onChange(items.map((item, j) => (j === i - 1 ? items[i] : j === i ? items[i - 1] : item)))

  return (
    <fieldset className="list-editor">
      <legend className="field__label list-editor__legend">{legend}</legend>
      {items.length === 0 && <p className="list-editor__empty">Belum ada.</p>}
      <ol className="list-editor__items">
        {items.map((item, i) => (
          <li key={i} className="list-editor__item">
            <fieldset className="list-editor__row">
              <legend className="list-editor__title">
                {itemLabel} {i + 1}
              </legend>
              <div className="register-form__row">
                {fields.map((f) => (
                  <Field
                    key={f.key}
                    field={f}
                    value={item[f.key]}
                    error={errors[`${i}.${f.key}`]}
                    onChange={(value) => update(i, f.key, value)}
                  />
                ))}
              </div>
              <div className="list-editor__actions">
                {i > 0 && (
                  <Button size="sm" variant="outlined" onClick={() => moveUp(i)}>
                    Naikkan<span className="visually-hidden"> {itemLabel} {i + 1}</span>
                  </Button>
                )}
                <Button size="sm" variant="outlined" tone="danger" onClick={() => remove(i)}>
                  Hapus<span className="visually-hidden"> {itemLabel} {i + 1}</span>
                </Button>
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
      <Button size="sm" variant="outlined" className="list-editor__add" onClick={() => onChange([...items, blank])}>
        + {addLabel}
      </Button>
    </fieldset>
  )
}

function Field({ field: f, value, error, onChange }) {
  const id = useId()
  if (f.type === 'checkbox') {
    return (
      <Checkbox
        className="list-editor__check"
        label={f.label}
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
    )
  }
  if (f.type === 'select') {
    return (
      <div className="field field--input">
        <label className="field__label" htmlFor={id}>
          {f.label}
        </label>
        <div className="field__box">
          <select id={id} className="field__input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">{f.placeholder ?? '—'}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    )
  }
  return (
    <TextField
      label={f.label}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={f.placeholder}
      inputMode={f.type === 'number' ? 'numeric' : undefined}
      error={error}
    />
  )
}
