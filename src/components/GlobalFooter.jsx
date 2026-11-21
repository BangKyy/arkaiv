import t from '../i18n/id'

/** "Organism/Global Footer": one centered line; Size=lg on desktop, Size=sm on phones. */
export default function GlobalFooter() {
  return (
    <footer className="global-footer">
      <p>{t.footer}</p>
    </footer>
  )
}
