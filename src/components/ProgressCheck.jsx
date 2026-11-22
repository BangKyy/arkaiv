import check from '../assets/checkbox/check-md.svg'

/**
 * "Progress Check/Regist Studio" from the Figma library: a read-only checklist that
 * follows the form, not something to tick. Done rows get an ink box with a check and ink
 * text; pending rows stay grey. Rows are joined by a rule, long and ink after a done row.
 * `items` are `{ id, label, note, done }`; `note` is a suffix such as "(opsional)".
 */
export default function ProgressCheck({ items, className = '', ...rest }) {
  return (
    <ol className={`progress-check ${className}`} {...rest}>
      {items.map((item) => (
        <li key={item.id} className={`progress-check__item ${item.done ? 'is-done' : ''}`}>
          <span className="progress-check__row">
            <span className="progress-check__box" aria-hidden="true">
              {item.done && <img src={check} alt="" />}
            </span>
            <span>
              <span className="visually-hidden">{item.done ? 'Selesai: ' : 'Belum: '}</span>
              {item.label}
              {item.note && <> {item.note}</>}
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}
