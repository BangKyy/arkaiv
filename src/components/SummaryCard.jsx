import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { useDirectory } from '../state/directory'
import { AreaTag, CategoryChips, CodeTab } from './StudioBits'
import { ArrowUpRight, X } from './icons'
import Button from './Button'
import t from '../i18n/id'

/**
 * FR-04 / US-02: short summary of the selected pin, kept to name, categories,
 * area and one line (PRD "Informative" rule). Depth lives in the profile.
 */
export default function SummaryCard({ studio }) {
  const { setSelectedSlug } = useDirectory()
  const cardRef = useRef(null)

  const close = (returnFocus) => {
    setSelectedSlug(null)
    if (returnFocus) {
      document.querySelector(`.pin[data-slug="${CSS.escape(studio.slug)}"]`)?.focus()
    }
  }

  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true })
    const onKey = (e) => {
      if (e.key === 'Escape') close(true)
    }
    const onPointer = (e) => {
      if (cardRef.current?.contains(e.target)) return
      if (e.target.closest?.('.pin, .cluster')) return
      close(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
    // Re-bind only when a different studio is shown.
  }, [studio.slug]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.section
      ref={cardRef}
      id="summary-card"
      className="summary-card"
      tabIndex={-1}
      aria-labelledby="summary-card-title"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <div className="summary-card__top">
        <CodeTab studio={studio} />
        <button
          type="button"
          className="icon-button"
          onClick={() => close(true)}
          aria-label={t.card.close}
        >
          <X size={18} weight="bold" aria-hidden="true" />
        </button>
      </div>
      <h2 id="summary-card-title" className="summary-card__name">
        {studio.name}
      </h2>
      <CategoryChips ids={studio.categories} primary={studio.primaryCategory} />
      <AreaTag id={studio.area} compact />
      <p className="summary-card__line">{studio.description}</p>
      <Button
        as={Link}
        className="summary-card__cta"
        icon={ArrowUpRight}
        to={`/studio/${studio.slug}`}
        onClick={() => setSelectedSlug(null)}
      >
        {t.card.viewProfile}
      </Button>
    </motion.section>
  )
}
