import { Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useMatch, useOutlet } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useDirectory } from '../state/directory'
import CategoryFilter from '../components/CategoryFilter'
import Legend from '../components/Legend'
import MapBoundary from '../components/MapBoundary'
import SummaryCard from '../components/SummaryCard'
import BottomSheet from '../components/BottomSheet'
import { snapHeights } from '../components/sheet'
import { SidebarSimple } from '../components/icons'
import { MOBILE_QUERY, useMediaQuery } from '../lib/hooks'
import t from '../i18n/id'

// MapLibre is the largest dependency. Loading it in its own chunk lets the header,
// filters and studio list paint first; the map follows (PRD performance targets).
const StudioMap = lazy(() => import('../components/StudioMap'))

/**
 * Explore (home) and Studio profile share this layout: the map stays mounted
 * while the side panel (desktop) or bottom sheet (mobile) switches between
 * the list and a profile. Map-first: nothing sits in front of the map except
 * the slim header and the filters (PRD section 9).
 */
export default function Explore() {
  const { bySlug, selectedSlug } = useDirectory()
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const profileMatch = useMatch('/studio/:slug')
  const focusSlug = profileMatch?.params.slug ?? null
  const { pathname } = useLocation()
  const outlet = useOutlet()

  const [panelOpen, setPanelOpen] = useState(true)
  // A profile opened by direct link or QR code starts with the sheet half open.
  const [snap, setSnap] = useState(() => (focusSlug ? 'half' : 'peek'))
  const bodyRef = useRef(null)
  const panelRef = useRef(null)
  const [areaHeight, setAreaHeight] = useState(600)

  useLayoutEffect(() => {
    const el = bodyRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(([entry]) => setAreaHeight(entry.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Opening a profile shows the panel and raises the sheet (adjusted during render,
  // React's recommended pattern for state that follows a changing value).
  const [prevFocus, setPrevFocus] = useState(focusSlug)
  if (focusSlug !== prevFocus) {
    setPrevFocus(focusSlug)
    if (focusSlug) {
      setPanelOpen(true)
      if (snap !== 'full') setSnap('half')
    }
  }

  // After navigating between list and profile, start at the top and move focus
  // to the new heading so keyboard and screen-reader users land in the right place.
  const firstRender = useRef(true)
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    panel.scrollTop = 0
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    panel.querySelector('h1')?.focus({ preventScroll: true })
  }, [pathname])

  const sheetVisible = isMobile ? snapHeights(areaHeight)[snap] : 0
  const mapPadding = useMemo(
    () =>
      isMobile
        ? { top: 24, left: 24, right: 24, bottom: sheetVisible + 24 }
        : { top: 48, left: 48, right: 48, bottom: 48 },
    [isMobile, sheetVisible],
  )

  const selected = selectedSlug ? bySlug.get(selectedSlug) : null

  const panelContent = (
    <motion.div
      key={pathname}
      className="panel__inner"
      initial={{ opacity: 0, x: isMobile ? 0 : -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {outlet}
    </motion.div>
  )

  return (
    <div className="explore" style={{ '--sheet-visible': `${sheetVisible}px` }}>
      <CategoryFilter />
      <div className="explore__body" ref={bodyRef}>
        {!isMobile && (
          <aside
            id="studio-panel"
            ref={panelRef}
            className={`panel ${panelOpen ? '' : 'is-collapsed'}`}
            aria-label={t.list.panelToggle}
            hidden={!panelOpen}
          >
            {panelContent}
          </aside>
        )}

        <div className="explore__map">
          <MapBoundary>
            <Suspense fallback={<div className="map-wrap map" aria-busy="true" />}>
              <StudioMap focusSlug={focusSlug} padding={mapPadding} />
            </Suspense>
          </MapBoundary>
          {!isMobile && (
            <button
              type="button"
              className="panel-toggle"
              aria-controls="studio-panel"
              aria-expanded={panelOpen}
              onClick={() => setPanelOpen((o) => !o)}
            >
              <SidebarSimple size={18} weight="bold" aria-hidden="true" />
              <span>{panelOpen ? t.list.collapse : t.list.expand}</span>
            </button>
          )}
          <Legend />
          <AnimatePresence>
            {selected && <SummaryCard key={selected.slug} studio={selected} />}
          </AnimatePresence>
        </div>

        {isMobile && (
          <BottomSheet areaHeight={areaHeight} snap={snap} onSnap={setSnap} contentRef={panelRef}>
            {panelContent}
          </BottomSheet>
        )}
      </div>
    </div>
  )
}
