import t from '../i18n/id'

/**
 * "Organism/Global Footer": one centered line under an ink rule.
 * Size 'auto' is Size=lg, switching to Size=sm on phones; 'sm' keeps Size=sm everywhere
 * (the map's narrow list panel).
 */
export default function GlobalFooter({ size = 'auto' }) {
  return (
    <footer className={`global-footer global-footer--${size}`}>
      <p>{t.footer}</p>
    </footer>
  )
}
