import { Suspense, lazy, useRef, useState } from 'react'
import { useOutlet } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useDirectory } from '../state/directory'
import MapFilter from '../components/MapFilter'
import Legend from '../components/Legend'
import MapBoundary from '../components/MapBoundary'
import SummaryCard from '../components/SummaryCard'
import { CaretLineDown, CaretLineLeft, CaretLineRight, CaretLineUp } from '../components/icons'
import { MOBILE_QUERY, useMediaQuery, usePageMeta } from '../lib/hooks'
import { Loading } from '../lib/progress'
import { useIntro } from '../lib/intro'
import t from '../i18n/id'

// MapLibre is the largest dependency. Loading it in its own chunk lets the header,
// filters and studio list paint first; the map follows (PRD performance targets).
const StudioMap = lazy(() => import('../components/StudioMap'))

const DESKTOP_PADDING = { top: 96, left: 48, right: 48, bottom: 48 }
const MOBILE_PADDING = { top: 72, left: 24, right: 24, bottom: 24 }

// The panel, its button, the map's view and the tools beside it all move as one: the
// same duration and ease-in-out curve (CSS uses it too, see .explore in index.css).
const PANEL_WIDTH = 330
// Open, the button straddles the panel's edge by this much (Figma left: -20px).
const TOGGLE_OVERLAP = 20
const PANEL_MOTION = { duration: 0.55, ease: [0.65, 0, 0.35, 1] }
// Desktop: the column slides in over the map's right side while the map's view eases
// left by the same amount (StudioMap `inset`), so nothing is squeezed or redrawn at a
// new size. Below 1100px: the panel is a sheet that slides up over the map.
const panelStates = {
  desktop: {
    closed: { x: '100%' },
    open: { x: '0%' },
  },
  mobile: {
    closed: { y: '100%' },
    open: { y: '0%' },
  },
}

/**
 * Figma "Pages/Jelajahi Map": the filters over the map, and the studio list in
 * "Map/Sidebar", closed until asked for. From 1100px the panel is a column on the
 * right; below that it covers the filters and map, opened from the tab at the bottom.
 * Profiles are pages of their own (/studio/:slug).
 */
export default function Explore() {
  const { bySlug, selectedSlug, setSelectedSlug } = useDirectory()
  const isMobile = useMediaQuery(MOBILE_QUERY)
  // The map's view moves outside Motion, so reduced motion is honored here for all of it.
  const reduceMotion = useReducedMotion()
  const panelMotion = reduceMotion ? { duration: 0 } : PANEL_MOTION
  const [panelOpen, setPanelOpen] = useState(false)
  // The studio the map last flew to after a pick in the list.
  const [focusSlug, setFocusSlug] = useState(null)
  const toggleRef = useRef(null)
  // Opening: the filter chips slide in row by row, the map tools settle (lib/intro).
  const pageRef = useRef(null)
  useIntro(pageRef)
  usePageMeta(t.nav.explore)

  // A pick in the list selects the studio and centers the map on it; where the panel
  // covers the map it closes, so the pin and its summary card are in view.
  const showOnMap = (slug) => {
    setSelectedSlug(slug)
    setFocusSlug(slug)
    if (isMobile) setPanelOpen(false)
  }
  const outlet = useOutlet({ showOnMap })

  const selected = selectedSlug ? bySlug.get(selectedSlug) : null
  // Closing the card or picking another pin ends the list's focus request.
  const mapFocus = focusSlug === selectedSlug ? focusSlug : null

  const ToggleIcon = isMobile
    ? panelOpen
      ? CaretLineDown
      : CaretLineUp
    : panelOpen
      ? CaretLineRight
      : CaretLineLeft

  return (
    <div ref={pageRef} className={`explore ${panelOpen ? 'is-panel-open' : ''}`}>
      <h1 className="visually-hidden">{t.nav.explore}</h1>
      <div className="explore__main">
        <MapFilter />
        <div className="explore__map">
          <MapBoundary>
            <Suspense
              fallback={
                <Loading>
                  <div className="map-wrap map" aria-busy="true" />
                </Loading>
              }
            >
              <StudioMap
                focusSlug={mapFocus}
                padding={isMobile ? MOBILE_PADDING : DESKTOP_PADDING}
                inset={panelOpen && !isMobile ? PANEL_WIDTH : 0}
                insetMotion={panelMotion}
              />
            </Suspense>
          </MapBoundary>
          <Legend />
          <AnimatePresence>
            {/* With the panel open the selected studio shows there as a short profile;
                the card on the map is for when the panel is closed. */}
            {selected && !panelOpen && <SummaryCard key={selected.slug} studio={selected} />}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {panelOpen && (
          <motion.aside
            key="panel"
            id="studio-panel"
            className="panel"
            aria-label={t.list.panelToggle}
            variants={panelStates[isMobile ? 'mobile' : 'desktop']}
            initial="closed"
            animate="open"
            exit="closed"
            transition={panelMotion}
            onKeyDown={(e) => {
              if (e.key !== 'Escape' || !isMobile) return
              setPanelOpen(false)
              toggleRef.current?.focus()
            }}
          >
            {outlet}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Figma "Sidebar/ShowPanel": on desktop the words slide open on hover or focus.
          Desktop: the button rides the panel's edge, on the panel's own transition, so
          the two start in the same frame. Below 1100px it travels from the tab to the
          top of the sheet: `layout` glides it there (Smart Animate), "position" keeping
          its size out of it so nothing stretches. */}
      <motion.button
        ref={toggleRef}
        type="button"
        className="panel-toggle"
        data-intro="rise"
        layout={isMobile ? 'position' : false}
        animate={{ x: panelOpen && !isMobile ? -(PANEL_WIDTH - TOGGLE_OVERLAP) : 0 }}
        transition={isMobile ? { layout: panelMotion, x: { duration: 0 } } : panelMotion}
        aria-controls="studio-panel"
        aria-expanded={panelOpen}
        onClick={() => setPanelOpen((o) => !o)}
      >
        <span className="panel-toggle__label">
          <span className="panel-toggle__label-text">{panelOpen ? t.list.hide : t.list.show}</span>
        </span>
        <span className="panel-toggle__icon">
          <ToggleIcon size={16} aria-hidden="true" />
        </span>
      </motion.button>
    </div>
  )
}
