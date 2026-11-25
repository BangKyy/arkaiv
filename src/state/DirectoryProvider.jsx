import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { DirectoryContext } from './directory'
import { hasSupabase, loadSnapshot, refreshStudios } from '../lib/studios'
import { applyFilters, readFilters, writeFilters } from '../lib/filters'
import { track } from '../lib/analytics'
import { useLoading } from '../lib/progress'

/**
 * One dataset, two views (PRD section 8): the map and the list read the same
 * studios and the same filter state, so a filter set in one shows in the other.
 */
export default function DirectoryProvider({ children }) {
  const [studios, setStudios] = useState(loadSnapshot)
  // True once the studios are final: right away without Supabase, else after the refresh
  // (or its failure). Until then an unknown slug may still arrive, so it is not a 404 yet.
  const [ready, setReady] = useState(!hasSupabase)
  useLoading(!ready)
  const [searchParams, setSearchParams] = useSearchParams()
  const [hoveredSlug, setHoveredSlug] = useState(null)
  // The pin whose summary card is open (US-02). Profiles use the route instead.
  const [selectedSlug, setSelectedSlug] = useState(null)

  useEffect(() => {
    let alive = true
    refreshStudios().then((fresh) => {
      if (!alive) return
      if (fresh) setStudios(fresh)
      setReady(true)
    })
    return () => {
      alive = false
    }
  }, [])

  const filters = useMemo(() => readFilters(searchParams), [searchParams])
  const visible = useMemo(() => applyFilters(studios, filters), [studios, filters])
  const bySlug = useMemo(() => new Map(studios.map((s) => [s.slug, s])), [studios])

  // `patch` holds any of categories, areas and query.
  const updateFilters = useCallback(
    (patch) => {
      setSearchParams((prev) => writeFilters(prev, { ...readFilters(prev), ...patch }), {
        replace: true,
      })
      // Close the summary card if its studio is filtered out.
      setSelectedSlug((slug) =>
        slug && applyFilters(studios, { ...filters, ...patch }).some((s) => s.slug === slug)
          ? slug
          : null,
      )
      if (patch.categories) track('filter_applied', { category: patch.categories.join(',') || 'none' })
      if (patch.areas) track('filter_applied', { area: patch.areas.join(',') || 'none' })
    },
    [setSearchParams, studios, filters],
  )

  const value = useMemo(
    () => ({
      studios,
      ready,
      visible,
      bySlug,
      filters,
      setCategories: (categories) => updateFilters({ categories }),
      setAreas: (areas) => updateFilters({ areas }),
      setQuery: (query) => updateFilters({ query }),
      clearFilters: () => updateFilters({ categories: [], areas: [], query: '' }),
      hoveredSlug,
      setHoveredSlug,
      // Never point at a studio that is filtered out or gone after a data refresh.
      selectedSlug: visible.some((s) => s.slug === selectedSlug) ? selectedSlug : null,
      setSelectedSlug,
    }),
    [studios, ready, visible, bySlug, filters, updateFilters, hoveredSlug, selectedSlug],
  )

  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>
}
