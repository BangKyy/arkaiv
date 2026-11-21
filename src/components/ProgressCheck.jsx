import Checkbox from './Checkbox'

/**
 * "Progress Check" from the Figma library (rows are "_Progress Check Base"): a checklist
 * the reader can tick off, each row closed by an ink rule. `items` are
 * `{ id, label, note }`; `note` is the muted suffix such as "(opsional)".
 */
export default function ProgressCheck({ items, className = '', ...rest }) {
  return (
    <ul className={`progress-check ${className}`} {...rest}>
      {items.map((item) => (
        <li key={item.id} className="progress-check__item">
          <Checkbox
            size="md"
            label={
              <>
                {item.label}
                {item.note && <span className="progress-check__note"> {item.note}</span>}
              </>
            }
          />
        </li>
      ))}
    </ul>
  )
}
