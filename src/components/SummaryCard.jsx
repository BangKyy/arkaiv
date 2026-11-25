import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { useDirectory } from '../state/directory'
import { StudioBadges } from './StudioBits'
import { categoryLine } from '../lib/catalog'
import { ArrowUpRight, X } from './icons'
import Button from './Button'
import t from '../i18n/id'

/**
 * Figma "Map/Tools/CardPreview" (Variant=Black), FR-04 / US-02: short summary of the
 * selected pin, kept to area, categories, name and one line (PRD "Informative" rule).
 * Depth lives in the profile.
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
    // A pick in the panel, or closing it with its button, keeps focus where it is.
    if (!document.activeElement?.closest('.panel, .panel-toggle')) {
      cardRef.current?.focus({ preventScroll: true })
    }
    const onKey = (e) => {
      if (e.key === 'Escape') close(true)
    }
    // A tap elsewhere closes the card, except on pins and in the panel, which shows
    // the same studio's short profile.
    const onPointer = (e) => {
      if (cardRef.current?.contains(e.target)) return
      if (e.target.closest?.('.pin, .cluster, .panel, .panel-toggle')) return
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
        <StudioBadges studio={studio} />
        <button
          type="button"
          className="summary-card__close"
          onClick={() => close(true)}
          aria-label={t.card.close}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="summary-card__text">
        <p className="summary-card__cats">{categoryLine(studio)}</p>
        <h2 id="summary-card-title" className="summary-card__name">
          {studio.name}
        </h2>
        <p className="summary-card__line">{studio.description}</p>
      </div>
      <Button
        as={Link}
        size="sm"
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
