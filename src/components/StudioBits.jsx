// Small building blocks shared by the list, the summary card and the profile.
import { RegionTag, TagCategory } from './Tags'
import { CategoryIcon } from './icons'
import { accentFor } from '../lib/colors'
import { formatCode, getArea, getCategory } from '../lib/catalog'

/** The studio's code on its accent color, like the tab on a dossier folder. */
export function CodeTab({ studio, className = '' }) {
  const { bg, fg } = accentFor(studio.accent)
  return (
    <span className={`code-tab ${className}`} style={{ background: bg, color: fg }}>
      {formatCode(studio.code)}
    </span>
  )
}

/** The primary category is the tinted "Filled" tag, the others the ink-outlined "Netral" one. */
export function CategoryChips({ ids, primary }) {
  return (
    <ul className="chips">
      {ids.map((id) =>
        getCategory(id) ? (
          <li key={id}>
            <TagCategory category={id} variant={id === primary ? 'filled' : 'outlined-netral'} />
          </li>
        ) : null,
      )}
    </ul>
  )
}

/** Region tag; `compact` drops its outline for dense rows and cards. */
export function AreaTag({ id, compact = false }) {
  return <RegionTag id={id} bordered={!compact} />
}

/**
 * The badge row of the map's short profiles (Figma "CardPreview" and "Map/Sidebar"
 * Pages=Previous): the area code on its region color, then one 12px icon box per category.
 */
export function StudioBadges({ studio }) {
  const area = getArea(studio.area)
  return (
    <div className="studio-badges">
      {area && (
        <span className="studio-badges__code" style={{ '--region': `var(--region-${studio.area})` }}>
          <span className="visually-hidden">{area.name}, </span>
          {area.code}
        </span>
      )}
      {/* The category names follow in text, so the icons are decorative. */}
      {studio.categories.map((id) => (
        <span key={id} className="studio-badges__icon">
          <CategoryIcon icon={getCategory(id)?.icon} size={12} />
        </span>
      ))}
    </div>
  )
}
