import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapLibreMap, Marker, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre 6 runs its worker from a separate module file; let Vite ship it and tell MapLibre where.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import boundaries from '../data/surabaya-wilayah.geo.json'
import kecamatan from '../data/surabaya-kecamatan.geo.json'
import city from '../data/surabaya-kota.geo.json'
import { useDirectory } from '../state/directory'
import { getCategory } from '../lib/catalog'
import { boundsOf } from '../lib/geo'
import { track } from '../lib/analytics'
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  MapPinSimpleLine,
  MapTrifold,
  Minus,
  Plus,
} from './icons'
import Button from './Button'
import StudioMarker from './StudioMarker'
import { RegionTag } from './Tags'
import clusterShape from '../assets/markers/cluster.svg'
import t from '../i18n/id'

setWorkerUrl(maplibreWorkerUrl)

const SURABAYA_BOUNDS = boundsOf(city.geometry.coordinates.flat(2))
const MAX_BOUNDS = [
  [112.35, -7.6],
  [113.1, -6.95],
]
const CLUSTER_RADIUS_PX = 40
// Figma "Map-Trigger" Variant=Zoom-out: below this zoom the region labels take their
// small size (8px padding, 10px text).
const DETAIL_ZOOM = 12

// Figma "Map/Tools/TipeMap". "Peta" is a street map from OpenFreeMap (OpenStreetMap
// data, no API key and no per-view fees, PRD section 12), drawn in grey by CSS.
// "Diagram" needs no tile server at all: the city drawn as lines on paper, as on the
// earlier directory prototype. The five wilayah get a faint tint of their region color
// and a solid rule, the 31 kecamatan a thin dashed one, the city a heavier outline.
// It is also the fallback when the street map cannot load.
const STREET_STYLE = 'https://tiles.openfreemap.org/styles/positron'
const INK = '#151515'
const DIAGRAM_STYLE = {
  version: 8,
  sources: {
    wilayah: { type: 'geojson', data: boundaries },
    kecamatan: { type: 'geojson', data: kecamatan },
    city: { type: 'geojson', data: city },
  },
  layers: [
    { id: 'ground', type: 'background', paint: { 'background-color': '#e9e6de' } },
    {
      id: 'wilayah-fill',
      type: 'fill',
      source: 'wilayah',
      paint: {
        // Colors/Region Color (see --region-* in index.css).
        'fill-color': [
          'match',
          ['get', 'id'],
          'pusat',
          '#0e733b',
          'utara',
          '#8d3795',
          'timur',
          '#bf1e2e',
          'selatan',
          '#0489cc',
          '#f1592a',
        ],
        'fill-opacity': 0.07,
      },
    },
    {
      id: 'kecamatan-line',
      type: 'line',
      source: 'kecamatan',
      paint: {
        'line-color': INK,
        'line-width': 0.7,
        'line-dasharray': [2, 3],
        'line-opacity': 0.38,
      },
    },
    {
      id: 'wilayah-line',
      type: 'line',
      source: 'wilayah',
      paint: { 'line-color': INK, 'line-width': 1.5, 'line-opacity': 0.72 },
    },
    { id: 'city-line', type: 'line', source: 'city', paint: { 'line-color': INK, 'line-width': 1.8 } },
  ],
}

const styleFor = (mode) => (mode === 'peta' ? STREET_STYLE : DIAGRAM_STYLE)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
        key: `c:${members
          .map((m) => m.slug)
          .sort()
          .join('|')}`,
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
  const { visible, bySlug, filters, hoveredSlug, setHoveredSlug, selectedSlug, setSelectedSlug } =
    useDirectory()
  const containerRef = useRef(null)
  const mapRef = useRef(null) // for handlers and effects
  const revealedRef = useRef(false)
  const [map, setMap] = useState(null) // set once loaded; used for rendering markers
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [viewTick, setViewTick] = useState(0)
  const [mode, setMode] = useState('peta')
  const modeRef = useRef(mode)

  // Create the map once per attempt (a retry after an error remounts it).
  useEffect(() => {
    const started = performance.now()
    let instance
    let loaded = false
    try {
      instance = new MapLibreMap({
        container: containerRef.current,
        style: styleFor(modeRef.current),
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
    instance.getCanvas().setAttribute('aria-label', t.map.label)

    // Warm the GSAP chunk while the map loads; it is used for the pin reveal only.
    import('gsap')

    instance.on('load', () => {
      loaded = true
      setMap(instance)
      track('map_loaded', { ms: Math.round(performance.now() - started), mode: modeRef.current })
    })
    instance.on('error', () => {
      if (loaded) return
      // The street map is a third-party service; without it the diagram still works.
      if (modeRef.current === 'peta') {
        modeRef.current = 'diagram'
        setMode('diagram')
        instance.setStyle(DIAGRAM_STYLE)
      } else setFailed(true)
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

  const changeMode = (next) => {
    if (next === modeRef.current) return
    modeRef.current = next
    setMode(next)
    mapRef.current?.setStyle(styleFor(next))
    track('map_type', { mode: next })
  }

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

  // viewTick re-renders after every pan or zoom, so this follows the zoom.
  const zoomedOut = map ? map.getZoom() < DETAIL_ZOOM : true
  const dimmed = (areaId) => filters.areas.length > 0 && !filters.areas.includes(areaId)

  const isActive = (slug) => slug === hoveredSlug || slug === selectedSlug || slug === focusSlug

  // MapLibre copies every key it is given, so `duration: undefined` would replace its
  // default and stall the animation: only pass a duration to turn motion off.
  const motion = () => (prefersReducedMotion() ? { duration: 0 } : {})
  const zoomIn = () => mapRef.current?.zoomIn(motion())
  const zoomOut = () => mapRef.current?.zoomOut(motion())
  const resetView = () => mapRef.current?.fitBounds(SURABAYA_BOUNDS, { padding: 32, ...motion() })

  const expandCluster = (members) => {
    mapRef.current?.fitBounds(boundsOf(members.map((m) => [m.lng, m.lat])), {
      padding: 80,
      maxZoom: 16,
      duration: prefersReducedMotion() ? 0 : 700,
    })
  }

  return (
    <div className={`map-wrap map-wrap--${mode}`}>
      <div ref={containerRef} className="map" />

      {map &&
        boundaries.features.map((f) => (
          <MapMarker
            key={f.properties.id}
            map={map}
            lngLat={f.properties.label}
            anchor="center"
          >
            {/* While regions are filtered, the others drop to the white, outlined tag. */}
            <RegionTag
              id={f.properties.id}
              variant={dimmed(f.properties.id) ? 'white' : 'initial-white'}
              bordered={dimmed(f.properties.id)}
              className={`map-region ${zoomedOut ? 'map-region--sm' : ''}`}
              aria-hidden="true"
            />
          </MapMarker>
        ))}

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
              anchor="bottom"
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

      <div className="map-tool map-type" role="group" aria-label={t.map.type}>
        <MapTypeButton
          mode="peta"
          current={mode}
          icon={MapTrifold}
          label={t.map.typeMap}
          onPick={changeMode}
        />
        <MapTypeButton
          mode="diagram"
          current={mode}
          icon={MapPinSimpleLine}
          label={t.map.typeDiagram}
          onPick={changeMode}
        />
      </div>

      {/* Figma "Map/Tools/Zoom": in, out, and back to the whole city. */}
      <div className="map-tool map-zoom">
        <button
          type="button"
          className="map-zoom__button"
          onClick={zoomIn}
          aria-label={t.map.zoomIn}
        >
          <Plus size={22} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="map-zoom__button"
          onClick={zoomOut}
          aria-label={t.map.zoomOut}
        >
          <Minus size={22} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="map-zoom__button"
          onClick={resetView}
          aria-label={t.map.reset}
        >
          <ArrowCounterClockwise size={22} aria-hidden="true" />
        </button>
      </div>

      {mode === 'peta' && <p className="map-attribution">{t.map.attribution}</p>}

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

/** One choice of "Map/Tools/TipeMap": the word on desktop, its icon on smaller screens. */
function MapTypeButton({ mode, current, icon: Icon, label, onPick }) {
  return (
    <button
      type="button"
      className="map-type__option"
      aria-pressed={mode === current}
      aria-label={label}
      onClick={() => onPick(mode)}
    >
      <span className="map-type__label" aria-hidden="true">
        {label}
      </span>
      <Icon className="map-type__icon" size={18} aria-hidden="true" />
    </button>
  )
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
      {/* Figma "Map Marker Category": the neutral ink pin with the category icon. */}
      <StudioMarker category={cat?.icon} />
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
      {/* Figma "Map Marker Category" Variant=Zoom-out: the count in a paper marker. */}
      <img className="cluster__shape" src={clusterShape} alt="" width="44" height="52" />
      <span className="cluster__count">{members.length}</span>
    </button>
  )
}
