import { useEffect, useId, useRef } from 'react'
import checkSm from '../assets/checkbox/check-sm.svg'
import checkMd from '../assets/checkbox/check-md.svg'
import minusSm from '../assets/checkbox/minus-sm.svg'
import minusMd from '../assets/checkbox/minus-md.svg'
import checkSmDisabled from '../assets/checkbox/check-sm-disabled.svg'
import checkMdDisabled from '../assets/checkbox/check-md-disabled.svg'
import minusSmDisabled from '../assets/checkbox/minus-sm-disabled.svg'
import minusMdDisabled from '../assets/checkbox/minus-md-disabled.svg'

const GLYPHS = {
  sm: { check: checkSm, minus: minusSm },
  md: { check: checkMd, minus: minusMd },
  'sm-disabled': { check: checkSmDisabled, minus: minusSmDisabled },
  'md-disabled': { check: checkMdDisabled, minus: minusMdDisabled },
}

/**
 * Checkbox from the Figma library: a native input (keyboard, forms, screen readers)
 * under the drawn box. Works controlled (`checked` + `onChange`) or uncontrolled
 * (`defaultChecked`). `label` and `hint` are the design's text and supporting text.
 */
export default function Checkbox({
  size = 'sm',
  label,
  hint,
  indeterminate = false,
  disabled = false,
  className = '',
  id,
  ...rest
}) {
  const inputRef = useRef(null)
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = hint ? `${inputId}-hint` : undefined
  const glyphs = GLYPHS[disabled ? `${size}-disabled` : size]

  // `indeterminate` exists only as a DOM property, never as an attribute.
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <label
      className={`checkbox checkbox--${size} ${hint ? 'checkbox--hint' : ''} ${className}`}
      htmlFor={inputId}
    >
      <span className="checkbox__control">
        <input
          ref={inputRef}
          id={inputId}
          type="checkbox"
          className="checkbox__input"
          disabled={disabled}
          aria-describedby={hintId}
          {...rest}
        />
        <span className="checkbox__box" aria-hidden="true">
          <img className="checkbox__check" src={glyphs.check} alt="" />
          <img className="checkbox__minus" src={glyphs.minus} alt="" />
        </span>
      </span>
      {(label || hint) && (
        <span className="checkbox__text">
          {label && <span className="checkbox__label">{label}</span>}
          {hint && (
            <span id={hintId} className="checkbox__hint">
              {hint}
            </span>
          )}
        </span>
      )}
    </label>
  )
}
