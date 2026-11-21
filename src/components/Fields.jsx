// Form fields from the Figma library: "Input/Input Field" (on "_Input Field Base"),
// "Input/Text Area Field" and "Search" (on "_Search Base").
// Figma states map to CSS: Placeholder = empty, Filled = has a value (via :placeholder-shown,
// so inputs always get a placeholder, ' ' by default), Focused = focus,
// Hover (text area, search) = :hover, Disabled = :disabled. `error` is "Destructive".
import { useId } from 'react'
import { Info, MagnifyingGlass, Microphone, Question } from './icons'

function useFieldIds(id, hint, help) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = hint ? `${inputId}-hint` : undefined
  const helpId = help ? `${inputId}-help` : undefined
  const describedBy = [hintId, helpId].filter(Boolean).join(' ') || undefined
  return { inputId, hintId, helpId, describedBy }
}

function FieldFrame({ kind, label, hint, error, disabled, inputId, hintId, className, children }) {
  return (
    <div
      className={`field field--${kind} ${error ? 'field--error' : ''} ${disabled ? 'field--disabled' : ''} ${className}`}
    >
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      {children}
      {(error || hint) && (
        <p id={hintId} className="field__hint">
          {typeof error === 'string' ? error : hint}
        </p>
      )}
    </div>
  )
}

/**
 * Single-line input. Leading content (pick one): `icon` (a Phosphor icon),
 * `leading` (fixed text such as "https://"), or `leadingOptions` (a select such as "+62";
 * control it with `leadingValue` / `onLeadingChange`). `help` adds the help icon with that text.
 * `error` (true or a message) switches to the destructive style.
 */
export function TextField({
  label,
  hint,
  help,
  error,
  icon: Icon,
  leading,
  leadingOptions,
  leadingValue,
  onLeadingChange,
  leadingLabel,
  disabled,
  id,
  className = '',
  ...inputProps
}) {
  const { inputId, hintId, helpId, describedBy } = useFieldIds(id, error || hint, help)
  return (
    <FieldFrame
      kind="input"
      {...{ label, hint, error, disabled, inputId, hintId, className }}
    >
      <div className={`field__box ${leading || leadingOptions ? 'field__box--addon' : ''}`}>
        {leadingOptions ? (
          <select
            className="field__addon field__select"
            value={leadingValue}
            onChange={onLeadingChange}
            disabled={disabled}
            aria-label={leadingLabel}
          >
            {leadingOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ) : (
          leading && (
            <span className="field__addon" aria-hidden="true">
              {leading}
            </span>
          )
        )}
        {Icon && <Icon className="field__icon" size={22} aria-hidden="true" focusable="false" />}
        <input
          id={inputId}
          className="field__input"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...inputProps}
          placeholder={inputProps.placeholder ?? ' '}
        />
        {error ? (
          <Info className="field__icon field__icon--error" size={22} aria-hidden="true" focusable="false" />
        ) : (
          help && (
            <span className="field__help" title={help}>
              <Question className="field__icon" size={22} aria-hidden="true" focusable="false" />
              <span id={helpId} className="visually-hidden">
                {help}
              </span>
            </span>
          )
        )}
      </div>
    </FieldFrame>
  )
}

/** Multi-line input ("Input/Text Area Field"): 200px tall in total, the box takes what is left. */
export function TextArea({ label, hint, error, disabled, id, className = '', ...textareaProps }) {
  const { inputId, hintId, describedBy } = useFieldIds(id, error || hint)
  return (
    <FieldFrame kind="area" {...{ label, hint, error, disabled, inputId, hintId, className }}>
      <div className="field__box">
        <textarea
          id={inputId}
          className="field__input"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...textareaProps}
          placeholder={textareaProps.placeholder ?? ' '}
        />
      </div>
    </FieldFrame>
  )
}

/**
 * "Search": size 'lg' or 'sm'. Passing `onVoiceSearch` adds the microphone action
 * (Figma Icon=Right); `voiceLabel` is its accessible name.
 */
export function SearchField({
  size = 'lg',
  onVoiceSearch,
  voiceLabel = 'Cari dengan suara',
  className = '',
  'aria-label': ariaLabel = 'Cari',
  ...inputProps
}) {
  return (
    <div className={`search search--${size} ${onVoiceSearch ? 'search--action' : ''} ${className}`}>
      <MagnifyingGlass className="search__icon" size={18} weight="bold" aria-hidden="true" focusable="false" />
      <input type="search" className="search__input" aria-label={ariaLabel} {...inputProps} />
      {onVoiceSearch && (
        <button type="button" className="search__action" onClick={onVoiceSearch} aria-label={voiceLabel}>
          <Microphone size={18} weight="bold" aria-hidden="true" focusable="false" />
        </button>
      )}
    </div>
  )
}
