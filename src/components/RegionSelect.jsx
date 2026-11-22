import { useEffect, useId, useRef, useState } from 'react'
import { CaretDown } from './icons'
import { RegionTag } from './Tags'
import { areas, getArea } from '../lib/catalog'

/**
 * "Dropdown Input/Wilayah": an input field whose list shows one region tag per row;
 * the chosen region is drawn in its region color (State=Actived).
 * Select-only combobox: arrows, Home/End, Enter/Space to choose, Escape to close.
 * A hidden input carries `name` so it submits with a form.
 */
export default function RegionSelect({
  label,
  value,
  onChange,
  placeholder = 'Pilih wilayah',
  hint,
  error,
  name,
  id,
  className = '',
}) {
  const autoId = useId()
  const triggerId = id ?? autoId
  const labelId = `${triggerId}-label`
  const listId = `${triggerId}-list`
  const hintId = error || hint ? `${triggerId}-hint` : undefined
  const optionId = (areaId) => `${triggerId}-opt-${areaId}`

  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  // The active option is outlined only while the list is driven by the keyboard, so
  // hovering a region (or just opening the list) draws no outline.
  const [keyboard, setKeyboard] = useState(false)
  const rootRef = useRef(null)
  const selected = getArea(value)

  const openList = (fromKeyboard) => {
    setActive(Math.max(0, areas.findIndex((a) => a.id === value)))
    setKeyboard(fromKeyboard)
    setOpen(true)
  }
  const choose = (index) => {
    onChange?.(areas[index].id)
    setOpen(false)
  }

  // Close when pressing outside.
  useEffect(() => {
    if (!open) return undefined
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  const onKeyDown = (e) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList(true)
      }
      return
    }
    const last = areas.length - 1
    const moves = {
      ArrowDown: () => setActive((i) => Math.min(last, i + 1)),
      ArrowUp: () => setActive((i) => Math.max(0, i - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(active),
      ' ': () => choose(active),
      Escape: () => setOpen(false),
    }
    if (moves[e.key]) {
      e.preventDefault()
      setKeyboard(true)
      moves[e.key]()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div
      ref={rootRef}
      className={`field field--input field--select ${selected ? 'field--filled' : ''} ${error ? 'field--error' : ''} ${className}`}
    >
      {label && (
        <span id={labelId} className="field__label">
          {label}
        </span>
      )}
      <div className="field__anchor">
        <button
          type="button"
          id={triggerId}
          className="field__box"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={label ? `${labelId} ${triggerId}` : undefined}
          aria-describedby={hintId}
          aria-invalid={error ? true : undefined}
          aria-activedescendant={open ? optionId(areas[active].id) : undefined}
          onClick={() => (open ? setOpen(false) : openList(false))}
          onKeyDown={onKeyDown}
        >
          <span className={`field__value ${selected ? '' : 'is-placeholder'}`}>
            {selected ? selected.name : placeholder}
          </span>
          {/* The arrow stays in the error state too: it is what marks this as a dropdown. */}
          <CaretDown className="field__icon" size={22} aria-hidden="true" focusable="false" />
        </button>
        {open && (
          <ul id={listId} role="listbox" className="region-list" aria-labelledby={label ? labelId : undefined}>
            {areas.map((a, i) => (
              <li
                key={a.id}
                id={optionId(a.id)}
                role="option"
                aria-selected={a.id === value}
                className={`region-list__option ${keyboard && i === active ? 'is-active' : ''}`}
                onPointerEnter={() => {
                  setActive(i)
                  setKeyboard(false)
                }}
                onClick={() => choose(i)}
              >
                <RegionTag id={a.id} bordered={false} variant={a.id === value ? 'initial-black' : 'white'} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {name && <input type="hidden" name={name} value={value ?? ''} />}
      {(error || hint) && (
        <p id={hintId} className="field__hint">
          {typeof error === 'string' ? error : hint}
        </p>
      )}
    </div>
  )
}
