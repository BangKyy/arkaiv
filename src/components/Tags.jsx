// Tags from the Figma library: "Tag/General", "Tag/Category" and the region tag
// built on "Tag/_Base Category". All share the 11/9/12 padding and 10px gap.
import { CategoryIcon, X } from './icons'
import { getArea, getCategory } from '../lib/catalog'

// Two-letter marks for Type=Initial, as drawn in the library.
const INITIALS = {
  branding: 'BR',
  motion: 'MO',
  illustration: 'IL',
  editorial: 'ED',
  advertising: 'AD',
  uiux: 'UX',
}

/**
 * "Tag/General": a short label that reveals `detail` on hover or focus (Figma State=Hover).
 * Variant 'outlined' | 'filled'. Pass `as="button"` (plus aria-pressed etc.) to make it interactive.
 */
export function Tag({ as: Component = 'span', variant = 'outlined', label, detail, className = '', ...rest }) {
  if (Component === 'button' && rest.type === undefined) rest.type = 'button'
  return (
    <Component className={`tag tag--${variant} ${detail ? 'tag--expands' : ''} ${className}`} {...rest}>
      <span>{label}</span>
      {detail && <span className="tag__detail">{detail}</span>}
    </Component>
  )
}

/**
 * "Tag/Category". `category` is a category id from categories.json.
 * Variant: 'outlined' (category color), 'filled' (category tint, full color on hover),
 * 'outlined-netral' (ink outline) or 'netral' (ink fill, e.g. a selected filter).
 * Type: 'icon' (icon only, keep an accessible name nearby), 'detail' or 'initial'.
 */
export function TagCategory({
  as: Component = 'span',
  category,
  variant = 'outlined',
  type = 'detail',
  removable = false,
  className = '',
  children,
  ...rest
}) {
  const cat = getCategory(category)
  if (!cat) return null
  if (Component === 'button' && rest.type === undefined) rest.type = 'button'
  return (
    <Component
      className={`tag-cat tag-cat--${variant} tag-cat--${type} ${className}`}
      style={{ '--cat': `var(--cat-${category})`, '--cat-info': `var(--cat-${category}-info)` }}
      {...rest}
    >
      {type === 'initial' ? (
        <span className="tag-cat__initial" aria-hidden="true">
          {INITIALS[category]}
        </span>
      ) : (
        <CategoryIcon icon={cat.icon} size={18} />
      )}
      {type === 'icon' ? (
        <span className="visually-hidden">{cat.name}</span>
      ) : (
        <span className="tag-cat__label">{cat.name}</span>
      )}
      {children}
      {removable && <X className="tag-cat__remove" size={18} aria-hidden="true" focusable="false" />}
    </Component>
  )
}

/**
 * Region tag ("Tag/Category" with Region=...): area code chip + area name.
 * Variant: 'white' (paper box, region-colored chip), 'initial-black' or 'initial-white'
 * (region-colored box with an ink or paper chip). `bordered={false}` drops the outline.
 */
export function RegionTag({ id, variant = 'white', bordered = true, className = '' }) {
  const area = getArea(id)
  if (!area) return null
  return (
    <span
      className={`tag-region tag-region--${variant} ${bordered ? 'tag-region--bordered' : ''} ${className}`}
      style={{ '--region': `var(--region-${id})` }}
    >
      <span className="tag-region__code">{area.code}</span>
      <span className="tag-region__name">{area.name}</span>
    </span>
  )
}
