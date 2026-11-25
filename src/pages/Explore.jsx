import { Suspense, lazy, useRef, useState } from 'react'
import { useOutlet } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useDirectory } from '../state/directory'
import MapFilter from '../components/MapFilter'
import Legend from '../components/Legend'
import MapBoundary from '../components/MapBoundary'
import SummaryCard from '../components/SummaryCard'
import { CaretLineDown, CaretLineLeft, CaretLineRight, CaretLineUp } from '../components/icons'
import { MOBILE_QUERY, useMediaQuery, usePageMeta } from '../lib/hooks'
import t from '../i18n/id'

// MapLibre is the largest dependency. Loading it in its own chunk lets the header,
// filters and studio list paint first; the map follows (PRD performance targets).
const StudioMap = lazy(() => import('../components/StudioMap'))

const DESKTOP_PADDING = { top: 96, left: 48, right: 48, bottom: 48 }
const MOBILE_PADDING = { top: 72, left: 24, right: 24, bottom: 24 }

/**
 * Figma "Pages/Jelajahi Map": the filters over the map, and the studio list in
 * "Map/Sidebar", closed until asked for. From 1100px the panel is a column on the
 * right; below that it covers the filters and map, opened from the tab at the bottom.
 * Profiles are pages of their own (/studio/:slug).
 */
export default function Explore() {
  const { bySlug, selectedSlug, setSelectedSlug } = useDirectory()
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const [panelOpen, setPanelOpen] = useState(false)
  // The studio the map last flew to after a pick in the list.
  const [focusSlug, setFocusSlug] = useState(null)
  const toggleRef = useRef(null)
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
    <div className={`explore ${panelOpen ? 'is-panel-open' : ''}`}>
      <h1 className="visually-hidden">{t.nav.explore}</h1>
      <div className="explore__main">
        <MapFilter />
        <div className="explore__map">
          <MapBoundary>
            <Suspense fallback={<div className="map-wrap map" aria-busy="true" />}>
              <StudioMap
                focusSlug={mapFocus}
                padding={isMobile ? MOBILE_PADDING : DESKTOP_PADDING}
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
            initial={isMobile ? { y: 32, opacity: 0 } : { x: 16, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={isMobile ? { y: 32, opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
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

      {/* Figma "Sidebar/ShowPanel": on desktop the word shows on hover or focus. */}
      <button
        ref={toggleRef}
        type="button"
        className="panel-toggle"
        aria-controls="studio-panel"
        aria-expanded={panelOpen}
        onClick={() => setPanelOpen((o) => !o)}
      >
        <span className="panel-toggle__label">{panelOpen ? t.list.hide : t.list.show}</span>
        <span className="panel-toggle__icon">
          <ToggleIcon size={16} aria-hidden="true" />
        </span>
      </button>
    </div>
  )
}
