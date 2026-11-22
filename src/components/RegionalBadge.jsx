// "Regional Badge" from the Figma library, the three boxes at the top of a profile:
// the studio's book code, the archive edition and its categories. All share
// "_Regional Badge Base": an ink-outlined box, 94px tall, with an optional mini label
// on its top-left edge and a faint Doto watermark.
import { CategoryIcon } from './icons'
import { TagCategory } from './Tags'
import { getCategory } from '../lib/catalog'

/** "P-SUB-01": region prefix in a region-colored chip, the running number below. */
export function CodeBadge({ code, area, primaryCategory }) {
  const match = /^(.*)-(\d+)$/.exec(code ?? '')
  if (!match) return null
  const [, prefix, number] = match
  const icon = getCategory(primaryCategory)?.icon
  return (
    <div className="regional-badge regional-badge--code" style={{ '--region': `var(--region-${area})` }}>
      <span className="regional-badge__label regional-badge__label--region">{prefix}</span>
      {icon && <CategoryIcon icon={icon} size={70} className="regional-badge__icon" />}
      <span className="regional-badge__value">
        <span className="visually-hidden">Kode {prefix} </span>
        {number}
      </span>
    </div>
  )
}

/** The book edition the studio is archived in. */
export function ArchiveBadge({ label, years }) {
  return (
    <div className="regional-badge regional-badge--archive">
      <span className="regional-badge__label">{label}</span>
      <span className="regional-badge__watermark" aria-hidden="true">
        {label}
      </span>
      <span className="regional-badge__value">{years}</span>
    </div>
  )
}

/** Category icons as "Tag/Category" Netral, Icon Only, Size=lg. */
export function CategoryBadge({ ids }) {
  return (
    <ul className="regional-badge regional-badge--categories">
      {ids.map((id) => (
        <li key={id}>
          <TagCategory category={id} variant="netral" type="icon" size="lg" />
        </li>
      ))}
    </ul>
  )
}
