// "Box with inner labels" from the Figma library: an ink-outlined box whose label sits
// in a dark tab on its top-left edge. Variants: Process step (text on the lighter
// surface, with an optional large Doto watermark), Category (lg: two columns, sm: one)
// and Region (one row per region tag).
import { CategoryIcon } from './icons'
import { RegionTag } from './Tags'
import { areas, categories } from '../lib/catalog'

export default function LabeledBox({ label, watermark, className = '', children }) {
  return (
    <section className={`labeled-box ${watermark !== undefined ? 'labeled-box--step' : ''} ${className}`}>
      <h3 className="labeled-box__label">{label}</h3>
      {children}
      {watermark && (
        <span className="labeled-box__watermark" aria-hidden="true">
          {watermark}
        </span>
      )}
    </section>
  )
}

/** Process step: a short statement with a watermark letter, e.g. label "Kriteria A", watermark "A". */
export function StepBox({ label, watermark, children }) {
  return (
    <LabeledBox label={label} watermark={watermark}>
      <p className="labeled-box__text">{children}</p>
    </LabeledBox>
  )
}

/** All categories with their icons. `size` 'lg' (two columns) or 'sm' (one column). */
export function CategoryBox({ label = 'Kategori', size = 'lg' }) {
  return (
    <LabeledBox label={label} className={`labeled-box--list labeled-box--cat-${size}`}>
      <ul className="labeled-box__list">
        {categories.map((c) => (
          <li key={c.id} className="labeled-box__row">
            <CategoryIcon icon={c.icon} size={18} />
            {c.name}
          </li>
        ))}
      </ul>
    </LabeledBox>
  )
}

/** All regions as rows of region tags. */
export function RegionBox({ label = 'Wilayah' }) {
  return (
    <LabeledBox label={label} className="labeled-box--list">
      <ul className="labeled-box__list labeled-box__list--regions">
        {areas.map((a) => (
          <li key={a.id}>
            <RegionTag id={a.id} bordered={false} className="labeled-box__region" />
          </li>
        ))}
      </ul>
    </LabeledBox>
  )
}
