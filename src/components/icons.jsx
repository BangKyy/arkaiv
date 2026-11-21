// Interface icons come from Phosphor, imported per icon so only these ship.
// Category icons are the custom pack from the Figma library ("Icon Custom Pack"),
// one SVG per category and variant in src/assets/category-icons.
import { Stack } from '@phosphor-icons/react/dist/csr/Stack'
import { GridFour as PhosphorGridFour } from '@phosphor-icons/react/dist/csr/GridFour'

export { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft'
export { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
export { ArrowClockwise } from '@phosphor-icons/react/dist/csr/ArrowClockwise'
export { X } from '@phosphor-icons/react/dist/csr/X'
export { MapPin } from '@phosphor-icons/react/dist/csr/MapPin'
export { Globe } from '@phosphor-icons/react/dist/csr/Globe'
export { InstagramLogo } from '@phosphor-icons/react/dist/csr/InstagramLogo'
export { EnvelopeSimple } from '@phosphor-icons/react/dist/csr/EnvelopeSimple'
export { WhatsappLogo } from '@phosphor-icons/react/dist/csr/WhatsappLogo'
export { CaretUp } from '@phosphor-icons/react/dist/csr/CaretUp'
export { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown'
export { SidebarSimple } from '@phosphor-icons/react/dist/csr/SidebarSimple'
export { Info } from '@phosphor-icons/react/dist/csr/Info'
export { Question } from '@phosphor-icons/react/dist/csr/Question'
export { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
export { Microphone } from '@phosphor-icons/react/dist/csr/Microphone'

/** The header's menu icon is GridFour at fill weight (as in the Figma header). */
export function GridFour(props) {
  return <PhosphorGridFour weight="fill" {...props} />
}

// Keyed "<category>-<variant>", e.g. "branding-bold".
const CATEGORY_ICONS = Object.fromEntries(
  Object.entries(
    import.meta.glob('../assets/category-icons/*.svg', { eager: true, query: '?url', import: 'default' }),
  ).map(([path, url]) => [path.split('/').pop().replace('.svg', ''), url]),
)

/**
 * Decorative by default: always pair it with the category name or an aria-label nearby.
 * The pack's SVGs are single-color, so they are drawn as a mask in `currentColor`
 * and follow the text color (e.g. on a pressed, ink-filled chip).
 * Variants: 'regular' | 'bold' | 'filled' | 'minimal'.
 */
export function CategoryIcon({ icon, size = 16, variant = 'bold', className = '', style, ...rest }) {
  const url = CATEGORY_ICONS[`${icon}-${variant}`]
  if (!url) {
    return (
      <Stack className={className} size={size} weight="bold" aria-hidden="true" focusable="false" {...rest} />
    )
  }
  return (
    <span
      className={`category-icon ${className}`}
      style={{ '--icon': `url("${url}")`, width: size, height: size, ...style }}
      aria-hidden="true"
      {...rest}
    />
  )
}
