import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapLibreMap, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre 6 runs its worker from a separate module file; let Vite ship it and tell MapLibre where.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import boundaries from '../data/surabaya-wilayah.geo.json'
import { useDirectory } from '../state/directory'
import { getArea, getCategory } from '../lib/catalog'
import { identityIndex } from '../lib/colors'
import { boundsOf } from '../lib/geo'
import { track } from '../lib/analytics'
import { ArrowClockwise } from './icons'
import Button from './Button'
import StudioMarker from './StudioMarker'
import t from '../i18n/id'

setWorkerUrl(maplibreWorkerUrl)

const SURABAYA_BOUNDS =boundsOf(boundaries.features.flatMap((f) => f.geometry.coordinates[0]))
const MAX_BOUNDS = [
  [112.35, -7.6],
  [113.1, -6.95],
]
const CLUSTER_RADIUS_PX = 40

// No tile server and no per-view fees (PRD section 12): the "basemap" is the
// outlined wilayah shape on a muted ground, like the book cover.
const MAP_STYLE = {
  version: 8,
  sources: { wilayah: { type: 'geojson', data: boundaries } },
  layers: [
    { id: 'ground', type: 'background', paint: { 'background-color': '#d9d7d1' } },
    { id: 'wilayah-fill', type: 'fill', source: 'wilayah', paint: { 'fill-color': '#f5f4f0' } },
    {
      id: 'wilayah-line',
      type: 'line',
      source: 'wilayah',
      paint: { 'line-color': '#1f1f1f', 'line-width': 1.25 },
    },
  ],
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function centroid(ring) {
  const pts = ring.slice(0, -1)
  const sum = pts.reduce(([x, y], [px, py]) => [x + px, y + py], [0, 0])
  return [sum[0] / pts.length, sum[1] / pts.length]
}

/** Greedy screen-space clustering (FR-02): nearby pins merge at low zoom. */
function clusterStudios(map, studios) {
  const pts = studios.map((s) => ({ s, p: map.project([s.lng, s.lat]) }))
  const used = new Array(pts.length).fill(false)
  const items = []
  for (let i = 0; i < pts.length; i++) {
    if (used[i]) continue
    used[i] = true
    const group = [pts[i]]
    for (let j = i + 1; j < pts.length; j++) {
      if (used[j]) continue
      if (Math.hypot(pts[i].p.x - pts[j].p.x, pts[i].p.y - pts[j].p.y) < CLUSTER_RADIUS_PX) {
        used[j] = true
        group.push(pts[j])
      }
    }
    if (group.length === 1) {
      const { s } = group[0]
      items.push({ type: 'studio', key: s.slug, studio: s, lngLat: [s.lng, s.lat] })
    } else {
      const members = group.map((g) => g.s)
      items.push({
        type: 'cluster',
        key: `c:${members.map((m) => m.slug).sort().join('|')}`,
        members,
        lngLat: [
          members.reduce((a, s) => a + s.lng, 0) / members.length,
          members.reduce((a, s) => a + s.lat, 0) / members.length,
        ],
      })
    }
  }
  return items
}

export default function StudioMap({ focusSlug, padding }) {
  const { visible, bySlug, hoveredSlug, setHoveredSlug, selectedSlug, setSelectedSlug } =
    useDirectory()
  const containerRef = useRef(null)
  const mapRef = useRef(null) // for handlers and effects
  const revealedRef = useRef(false)
  const [map, setMap] = useState(null) // set once loaded; used for rendering markers
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [viewTick, setViewTick] = useState(0)

  // Create the map once per attempt (a retry after an error remounts it).
  useEffect(() => {
    const started = performance.now()
    let instance
    let loaded = false
    try {
      instance = new MapLibreMap({
        container: containerRef.current,
        style: MAP_STYLE,
        bounds: SURABAYA_BOUNDS,
        fitBoundsOptions: { padding: 32 },
        maxBounds: MAX_BOUNDS,
        minZoom: 9,
        maxZoom: 17,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      })
    } catch {
      // No WebGL, or the map could not start: the list stays usable (PRD empty/error states).
      queueMicrotask(() => setFailed(true))
      return undefined
    }
    mapRef.current = instance
    instance.touchZoomRotate.disableRotation()
    instance.keyboard.disableRotation()
    instance.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    instance.getCanvas().setAttribute('aria-label', t.map.label)

    // Warm the GSAP chunk while the map loads; it is used for the pin reveal only.
    import('gsap')

    instance.on('load', () => {
      loaded = true
      for (const f of boundaries.features) {
        const el = document.createElement('div')
        el.className = 'wilayah-label'
        el.setAttribute('aria-hidden', 'true')
        el.textContent = getArea(f.properties.id)?.code ?? ''
        new Marker({ element: el }).setLngLat(centroid(f.geometry.coordinates[0])).addTo(instance)
      }
      setMap(instance)
      track('map_loaded', { ms: Math.round(performance.now() - started) })
    })
    instance.on('error', () => {
      if (!loaded) setFailed(true)
    })
    instance.on('moveend', () => setViewTick((v) => v + 1))
    instance.on('click', (e) => {
      if (e.originalEvent?.target === instance.getCanvas()) setSelectedSlug(null)
    })

    const ro = new ResizeObserver(() => instance.resize())
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      instance.remove()
      mapRef.current = null
      setMap(null)
    }
  }, [attempt, setSelectedSlug])

  // viewTick re-runs clustering after every pan or zoom.
  const items = useMemo(
    () => (map ? clusterStudios(map, visible) : []),
    [map, visible, viewTick], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // GSAP owns the staggered first reveal of pins (PRD animation split). It never
  // blocks the map: pins are usable immediately, the animation only decorates them.
  useEffect(() => {
    if (!map || revealedRef.current || prefersReducedMotion()) return
    revealedRef.current = true
    import('gsap').then(({ gsap }) => {
      const els = containerRef.current?.querySelectorAll('.pin, .cluster')
      if (!els?.length) return
      gsap.from(els, {
        opacity: 0,
        y: -10,
        scale: 0.6,
        duration: 0.45,
        stagger: 0.035,
        ease: 'back.out(2)',
        clearProps: 'transform,opacity',
      })
    })
  }, [map])

  // FR-08: a studio picked in the list centers the map.
  useEffect(() => {
    if (!map || !focusSlug) return
    const s = bySlug.get(focusSlug)
    if (!s) return
    const opts = { center: [s.lng, s.lat], zoom: Math.max(map.getZoom(), 14), padding }
    if (prefersReducedMotion()) map.jumpTo(opts)
    else map.flyTo({ ...opts, duration: 900 })
  }, [map, focusSlug, bySlug, padding])

  const isActive = (slug) => slug === hoveredSlug || slug === selectedSlug || slug === focusSlug

  const expandCluster = (members) => {
    mapRef.current?.fitBounds(
      boundsOf(members.map((m) => [m.lng, m.lat])),
      { padding: 80, maxZoom: 16, duration: prefersReducedMotion() ? 0 : 700 },
    )
  }

  return (
    <div className="map-wrap">
      <div ref={containerRef} className="map" />

      {map &&
        items.map((item) =>
          item.type === 'studio' ? (
            <MapMarker
              key={item.key}
              map={map}
              lngLat={item.lngLat}
              anchor="bottom"
              raised={isActive(item.studio.slug)}
            >
              <Pin
                studio={item.studio}
                active={isActive(item.studio.slug)}
                expanded={selectedSlug === item.studio.slug}
                onSelect={() => {
                  const next = selectedSlug === item.studio.slug ? null : item.studio.slug
                  setSelectedSlug(next)
                  if (next) track('pin_click', { studio: next })
                }}
                onHover={setHoveredSlug}
              />
            </MapMarker>
          ) : (
            <MapMarker
              key={item.key}
              map={map}
              lngLat={item.lngLat}
              anchor="center"
              raised={item.members.some((m) => isActive(m.slug))}
            >
              <Cluster
                members={item.members}
                active={item.members.some((m) => isActive(m.slug))}
                onExpand={() => expandCluster(item.members)}
              />
            </MapMarker>
          ),
        )}

      {failed && (
        <div className="map-error" role="alert">
          <p className="map-error__title">{t.map.errorTitle}</p>
          <p>{t.map.errorBody}</p>
          <Button
            variant="outlined"
            icon={ArrowClockwise}
            iconPosition="left"
            onClick={() => {
              setFailed(false)
              setAttempt((a) => a + 1)
            }}
          >
            {t.map.retry}
          </Button>
        </div>
      )}
    </div>
  )
}

/** Puts React content on the map at a coordinate; owns its own MapLibre marker. */
function MapMarker({ map, lngLat, anchor, raised, children }) {
  const [el] = useState(() => {
    const div = document.createElement('div')
    div.className = 'marker-host'
    return div
  })
  const markerRef = useRef(null)
  const [lng, lat] = lngLat

  useEffect(() => {
    const marker = new Marker({ element: el, anchor }).setLngLat([lng, lat]).addTo(map)
    markerRef.current = marker
    return () => {
      marker.remove()
      markerRef.current = null
    }
    // Position updates are handled below without re-creating the marker.
  }, [map, el, anchor]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    markerRef.current?.setLngLat([lng, lat])
  }, [lng, lat])

  // Raise highlighted markers above their neighbours.
  useEffect(() => {
    const host = markerRef.current?.getElement()
    if (host) host.style.zIndex = raised ? '3' : '1'
  }, [raised])

  return createPortal(children, el)
}

function Pin({ studio, active, expanded, onSelect, onHover }) {
  const cat = getCategory(studio.primaryCategory)
  return (
    <button
      type="button"
      className={`pin ${active ? 'is-active' : ''}`}
      data-slug={studio.slug}
      aria-label={t.map.pin(studio.name, cat?.name ?? '')}
      aria-expanded={expanded}
      aria-controls={expanded ? 'summary-card' : undefined}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onMouseEnter={() => onHover(studio.slug)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(studio.slug)}
      onBlur={() => onHover(null)}
    >
      <StudioMarker category={cat?.icon} identity={identityIndex(studio.accent)} />
    </button>
  )
}

function Cluster({ members, active, onExpand }) {
  return (
    <button
      type="button"
      className={`cluster ${active ? 'is-active' : ''}`}
      aria-label={t.map.cluster(members.length)}
      onClick={(e) => {
        e.stopPropagation()
        onExpand()
      }}
    >
      {members.length}
    </button>
  )
}
