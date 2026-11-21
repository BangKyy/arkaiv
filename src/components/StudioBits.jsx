// Small building blocks shared by the list, the summary card and the profile.
import { RegionTag, TagCategory } from './Tags'
import { accentFor } from '../lib/colors'
import { formatCode, getCategory } from '../lib/catalog'

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
