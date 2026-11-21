import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import Button from './Button'
import { SearchField } from './Fields'
import { ArrowUpRight, GridFour, X } from './icons'
import logo from '../assets/logo.svg'
import t from '../i18n/id'

const LINKS = [
  { to: '/', label: t.nav.explore, end: true },
  { to: '/tentang', label: t.nav.about },
]

/**
 * "Organism/Global Header".
 * From 728px (Size=lg; tablet uses 30px side padding): logo, optional search, text links
 * (current page in ink, others muted) and the primary call to action.
 * Below 728px (Size=sm-2): the logo alone, centered, plus a floating dark menu.
 * `menuDock` places that menu at the bottom of the screen ('bottom', as designed) or in
 * the header bar ('bar', for the map, whose bottom edge belongs to the list sheet).
 * `search` (props for SearchField) adds SearchBar=True on wide screens.
 */
export default function GlobalHeader({ search, menuDock = 'bottom' }) {
  const toggleRef = useRef(null)
  const wasOpen = useRef(false)
  const { pathname } = useLocation()
  // The menu is open only on the page where it was opened, so navigating closes it.
  const [openOn, setOpenOn] = useState(null)
  const open = openOn === pathname
  const setOpen = (next) => setOpenOn(next ? pathname : null)

  // Escape closes the menu; closing it returns focus to the menu button.
  useEffect(() => {
    if (open) {
      wasOpen.current = true
      const onKey = (e) => e.key === 'Escape' && setOpenOn(null)
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
    if (wasOpen.current) {
      wasOpen.current = false
      toggleRef.current?.focus()
    }
    return undefined
  }, [open])

  return (
    <header className="global-header">
      <div className="global-header__bar">
        <NavLink to="/" className="global-header__brand" aria-label={`${t.siteName}, ${t.siteTagline}`}>
          <img src={logo} alt="" width="152" height="32" />
        </NavLink>

        {search && <SearchField className="global-header__search" {...search} />}

        <nav aria-label={t.nav.main} className="global-nav">
          <div className="global-nav__links">
            {LINKS.map((l) => (
              <Button key={l.to} as={NavLink} to={l.to} end={l.end} variant="link" size="xl" className="global-nav__link">
                {l.label}
              </Button>
            ))}
          </div>
          <Button as={NavLink} to="/daftar" size="xl" icon={ArrowUpRight}>
            {t.nav.submit}
          </Button>
        </nav>
      </div>

      {/* Size=sm-2 floating menu (hidden from 728px). */}
      <div className={`float-nav float-nav--${menuDock}`}>
        {open ? (
          <nav aria-label={t.nav.main} className="float-nav__panel">
            {[...LINKS, { to: '/daftar', label: t.nav.submitShort }].map((l, i) => (
              <NavLink key={l.to} to={l.to} end={l.end} className="float-nav__link" autoFocus={i === 0}>
                {l.label}
              </NavLink>
            ))}
            <button type="button" className="float-nav__close" aria-label={t.nav.closeMenu} onClick={() => setOpen(false)}>
              <X size={18} aria-hidden="true" focusable="false" />
            </button>
          </nav>
        ) : (
          <button
            ref={toggleRef}
            type="button"
            className="float-nav__toggle"
            aria-label={t.nav.openMenu}
            aria-expanded="false"
            onClick={() => setOpen(true)}
          >
            <GridFour size={18} aria-hidden="true" focusable="false" />
          </button>
        )}
      </div>
    </header>
  )
}
