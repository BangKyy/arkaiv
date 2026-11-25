// "Box with inner labels" from the Figma library: an ink-outlined box whose label sits
// in a dark tab on its top-left edge. Variants: Process step (text on the lighter
// surface, with an optional large Doto watermark), Category (lg: two columns, sm: one)
// and Region (one row per region tag).
// Boxes take Framer Motion props, so a parent can bring them in one by one; the
// watermark then slides up from the box's bottom edge.
import { motion } from 'motion/react'
import { CategoryIcon } from './icons'
import { RegionTag } from './Tags'
import { areas, categories } from '../lib/catalog'
import { EASE_OUT, rise } from '../lib/motion'

// Box variants: `rise`, and on `show` the watermark follows once the box is in.
const box = { ...rise, show: { ...rise.show, transition: { ...rise.show.transition, when: 'beforeChildren' } } }
const watermarkIn = {
  hidden: { y: 80 },
  show: { y: 0, transition: { duration: 0.9, ease: EASE_OUT } },
}

export default function LabeledBox({ label, watermark, className = '', children, ...rest }) {
  return (
    <motion.section
      className={`labeled-box ${watermark !== undefined ? 'labeled-box--step' : ''} ${className}`}
      variants={box}
      {...rest}
    >
      <h3 className="labeled-box__label">{label}</h3>
      {children}
      {watermark && (
        <motion.span className="labeled-box__watermark" variants={watermarkIn} aria-hidden="true">
          {watermark}
        </motion.span>
      )}
    </motion.section>
  )
}

/** Process step: a short statement with a watermark letter, e.g. label "Kriteria A", watermark "A". */
export function StepBox({ label, watermark, children, ...rest }) {
  return (
    <LabeledBox label={label} watermark={watermark} {...rest}>
      <p className="labeled-box__text">{children}</p>
    </LabeledBox>
  )
}

/** All categories with their icons. `size` 'lg' (two columns) or 'sm' (one column). */
export function CategoryBox({ label = 'Kategori', size = 'lg', ...rest }) {
  return (
    <LabeledBox label={label} className={`labeled-box--list labeled-box--cat-${size}`} {...rest}>
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
export function RegionBox({ label = 'Wilayah', ...rest }) {
  return (
    <LabeledBox label={label} className="labeled-box--list" {...rest}>
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
