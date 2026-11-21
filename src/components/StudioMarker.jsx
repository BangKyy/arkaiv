import { CategoryIcon } from './icons'

// Map markers from the Figma library. Every marker is the same two layers as
// "_Base Map Marker": a 40x48 silhouette and a Bold category icon at (11, 10).
//   "Map Marker General":  silhouette in the studio's identity color, black icon.
//   "Map Marker Category": neutral silhouette (ink, paper on hover), icon inverted.
// Both silhouettes are rendered; CSS shows the hover one on hover or when active.
const SILHOUETTES = Object.fromEntries(
  Object.entries(
    import.meta.glob('../assets/markers/*.svg', { eager: true, query: '?url', import: 'default' }),
  ).map(([path, url]) => [path.split('/').pop().replace('.svg', ''), url]),
)

/** `identity` is 1..12 (the studio's accent); without one the neutral category marker is used. */
export default function StudioMarker({ category, identity, className = '' }) {
  const base = identity ? `identity-${String(identity).padStart(2, '0')}` : 'neutral'
  return (
    <span
      className={`marker ${identity ? 'marker--identity' : 'marker--category'} ${className}`}
      aria-hidden="true"
    >
      <img className="marker__shape" src={SILHOUETTES[`${base}-default`]} alt="" width="40" height="48" />
      <img
        className="marker__shape marker__shape--hover"
        src={SILHOUETTES[`${base}-hover`]}
        alt=""
        width="40"
        height="48"
      />
      <CategoryIcon className="marker__icon" icon={category} size={18} variant="bold" />
    </span>
  )
}
