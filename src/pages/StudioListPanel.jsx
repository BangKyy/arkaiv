import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useDirectory } from '../state/directory'
import { AreaTag, CategoryChips, CodeTab } from '../components/StudioBits'
import { usePageMeta } from '../lib/hooks'
import { track } from '../lib/analytics'
import Button from '../components/Button'
import t from '../i18n/id'

/** FR-06 / US-05: the same studios as the map, as a scannable A-Z list. */
export default function StudioListPanel() {
  const { visible, studios, clearFilters } = useDirectory()
  usePageMeta(null)

  return (
    <section className="panel-section" aria-labelledby="list-heading">
      <header className="panel-head">
        <h1 id="list-heading" tabIndex={-1}>
          {t.list.heading}
        </h1>
        <p className="panel-head__count" aria-live="polite">
          {t.list.count(visible.length, studios.length)}
        </p>
      </header>

      {visible.length === 0 ? (
        <div className="empty-state" role="status">
          <p>{t.list.empty}</p>
          <Button variant="outlined" onClick={clearFilters}>
            {t.filter.clear}
          </Button>
        </div>
      ) : (
        <ol className="studio-list">
          <AnimatePresence initial={false}>
            {visible.map((s) => (
              <StudioRow key={s.slug} studio={s} />
            ))}
          </AnimatePresence>
        </ol>
      )}
    </section>
  )
}

function StudioRow({ studio }) {
  const { hoveredSlug, setHoveredSlug, selectedSlug } = useDirectory()
  const { search } = useLocation()
  const ref = useRef(null)
  const selected = selectedSlug === studio.slug
  const active = selected || hoveredSlug === studio.slug

  // Selecting a pin brings its row into view (FR-06 "and vice versa").
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
    <motion.li
      ref={ref}
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={`studio-row ${active ? 'is-active' : ''}`}
    >
      <Link
        to={{ pathname: `/studio/${studio.slug}`, search }}
        className="studio-row__link"
        onMouseEnter={() => setHoveredSlug(studio.slug)}
        onMouseLeave={() => setHoveredSlug(null)}
        onFocus={() => setHoveredSlug(studio.slug)}
        onBlur={() => setHoveredSlug(null)}
        onClick={() => track('list_click', { studio: studio.slug })}
      >
        <CodeTab studio={studio} />
        <span className="studio-row__name">{studio.name}</span>
        <span className="studio-row__meta">
          <CategoryChips ids={studio.categories} primary={studio.primaryCategory} />
          <AreaTag id={studio.area} compact />
        </span>
      </Link>
    </motion.li>
  )
}
