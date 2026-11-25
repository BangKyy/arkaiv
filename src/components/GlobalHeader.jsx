import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import Button from './Button'
import { SearchField } from './Fields'
import { ArrowUpRight, GridFour, X } from './icons'
import logo from '../assets/logo.svg'
import t from '../i18n/id'
import { EASE_OUT } from '../lib/motion'

const LINKS = [
  { to: '/', label: t.nav.home, end: true },
  { to: '/peta', label: t.nav.explore },
]

const MENU_LINKS = [...LINKS, { to: '/daftar', label: t.nav.submitShort }]

// The open menu drops in, then its links follow one by one.
const menuStates = {
  closed: { opacity: 0, y: -12, transition: { duration: 0.18, ease: 'easeIn' } },
  open: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT, staggerChildren: 0.06, delayChildren: 0.08 } },
}
const linkStates = {
  closed: { opacity: 0, x: -12 },
  open: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_OUT } },
}

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
          {/* The icon turns as it swaps between menu and close. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? 'close' : 'menu'}
              className="global-header__toggle-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {open ? (
                <X size={18} aria-hidden="true" focusable="false" />
              ) : (
                <GridFour size={18} aria-hidden="true" focusable="false" />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="mobile-menu"
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuStates}
          >
            {search && <SearchField size="sm" {...search} />}
            <nav aria-label={t.nav.main}>
              <ul className="mobile-menu__links">
                {MENU_LINKS.map((l) => (
                  <motion.li key={l.to} variants={linkStates}>
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
                  </motion.li>
                ))}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
