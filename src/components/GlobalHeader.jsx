import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import Button from './Button'
import { SearchField } from './Fields'
import { ArrowUpRight, GridFour, X } from './icons'
import logo from '../assets/logo.svg'
import t from '../i18n/id'

const LINKS = [
  { to: '/', label: t.nav.home, end: true },
  { to: '/peta', label: t.nav.explore },
]

const MENU_LINKS = [...LINKS, { to: '/daftar', label: t.nav.submitShort }]

/**
 * "Organism/Global Header".
 * From 728px (Size=lg; tablet uses 30px side padding): logo, optional search, text links
 * (current page in ink, others muted) and the primary call to action.
 * Below 728px (Size=sm-1): logo and a menu button. Open, the menu drops below the bar
 * as full-width outlined links (State=Open), over the page rather than pushing it down.
 * `search` (props for SearchField) adds SearchBar=True: in the bar from 1100px; below
 * that the bar has no room for it, so the header takes the menu form at any width
 * and the search sits at the top of the open menu.
 */
export default function GlobalHeader({ search }) {
  const headerRef = useRef(null)
  const toggleRef = useRef(null)
  const { pathname } = useLocation()
  // The menu is open only on the page where it was opened, so navigating closes it.
  const [openOn, setOpenOn] = useState(null)
  const open = openOn === pathname

  // Escape (back to the menu button) or a tap outside the header closes the menu.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpenOn(null)
      toggleRef.current?.focus()
    }
    const onPointer = (e) => {
      if (!headerRef.current?.contains(e.target)) setOpenOn(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <header ref={headerRef} className={`global-header ${search ? 'global-header--search' : ''}`}>
      <div className="global-header__bar">
        <NavLink to="/" className="global-header__brand" aria-label={`${t.siteName}, ${t.siteTagline}`}>
          <img src={logo} alt="" width="133" height="28" />
        </NavLink>

        {search && <SearchField size="sm" className="global-header__search" {...search} />}

        <nav aria-label={t.nav.main} className="global-nav">
          <div className="global-nav__links">
            {LINKS.map((l) => (
              <Button key={l.to} as={NavLink} to={l.to} end={l.end} variant="link" size="lg" className="global-nav__link">
                {l.label}
              </Button>
            ))}
          </div>
          <Button as={NavLink} to="/daftar" size="lg" icon={ArrowUpRight}>
            {t.nav.submit}
          </Button>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="global-header__toggle"
          aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          {open ? (
            <X size={18} aria-hidden="true" focusable="false" />
          ) : (
            <GridFour size={18} aria-hidden="true" focusable="false" />
          )}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="mobile-menu">
          {search && <SearchField size="sm" {...search} />}
          <nav aria-label={t.nav.main}>
            <ul className="mobile-menu__links">
              {MENU_LINKS.map((l) => (
                <li key={l.to}>
                  <Button
                    as={NavLink}
                    to={l.to}
                    end={l.end}
                    variant="outlined"
                    size="lg"
                    icon={ArrowUpRight}
                    className="mobile-menu__link"
                  >
                    {l.label}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  )
}
