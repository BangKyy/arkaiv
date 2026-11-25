import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useDirectory } from '../state/directory'
import { categoryLine, getArea } from '../lib/catalog'
import { track } from '../lib/analytics'
import { EASE_OUT } from '../lib/motion'
import Button from '../components/Button'
import StudioContact from '../components/StudioContact'
import { StudioBadges } from '../components/StudioBits'
import { Tag, TagCategory } from '../components/Tags'
import { ArrowLeft, ArrowUpRight, SortAscending, SortDescending } from '../components/icons'
import t from '../i18n/id'

const collator = new Intl.Collator('id', { sensitivity: 'base', numeric: true })

/**
 * Figma "Map/Sidebar", FR-06 / US-05. Pages=Default: the same studios as the map as a
 * scannable list, sorted by name. Pages=Previous: the short profile of the studio
 * selected on the map or in the list, with a way back to the list.
 */
export default function StudioListPanel() {
  const { visible, clearFilters, bySlug, selectedSlug } = useDirectory()
  const [desc, setDesc] = useState(false)
  // Set when a list card opens the profile, so focus follows into it.
  const focusProfile = useRef(false)

  const sorted = useMemo(() => {
    const list = [...visible].sort((a, b) => collator.compare(a.name, b.name))
    return desc ? list.reverse() : list
  }, [visible, desc])

  const selected = selectedSlug ? bySlug.get(selectedSlug) : null

  return (
    <section className="sidebar" aria-labelledby="list-heading">
      <h2 id="list-heading" className="visually-hidden">
        {t.list.heading}
      </h2>
      {selected ? (
        <div className="sidebar__body">
          <ShortProfile key={selected.slug} studio={selected} focusRef={focusProfile} />
        </div>
      ) : (
        <>
          <header className="sidebar__head">
            <p className="sidebar__count" aria-live="polite">
              <RollingNumber value={visible.length} />
              <span className="sidebar__shown">{t.list.shown}</span>
            </p>
            <Button
              variant="outlined"
              size="lg"
              icon={desc ? SortAscending : SortDescending}
              iconPosition="left"
              className="sidebar__sort"
              onClick={() => setDesc((d) => !d)}
            >
              <span className="visually-hidden">{t.list.sortLabel} </span>
              {desc ? t.list.sortZa : t.list.sortAz}
            </Button>
          </header>

          <div className="sidebar__body">
            {sorted.length === 0 ? (
              <div className="empty-state" role="status">
                <p>{t.list.empty}</p>
                <Button variant="outlined" size="sm" onClick={clearFilters}>
                  {t.filter.clear}
                </Button>
              </div>
            ) : (
              <ol className="studio-list">
                <AnimatePresence>
                  {sorted.map((s, i) => (
                    <StudioRow key={s.slug} studio={s} index={i} focusRef={focusProfile} />
                  ))}
                </AnimatePresence>
              </ol>
            )}
          </div>
        </>
      )}

      <footer className="sidebar__cta">
        <Button as={Link} to="/daftar" size="sm" icon={ArrowUpRight}>
          {t.list.cta}
        </Button>
      </footer>
    </section>
  )
}

const TABS = ['specialty', 'contact']

/** Figma "Map/Sidebar" Pages=Previous: badges, name, line, and Spesialisasi / Kontak tabs. */
function ShortProfile({ studio, focusRef }) {
  const { setSelectedSlug } = useDirectory()
  const [tab, setTab] = useState('specialty')
  const backRef = useRef(null)
  const id = useId()

  useEffect(() => {
    if (!focusRef.current) return
    focusRef.current = false
    backRef.current?.focus({ preventScroll: true })
  }, [focusRef])

  // Arrow keys move between the tabs (WAI-ARIA tabs pattern).
  const onTabKey = (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    if (!step) return
    const next = TABS[(TABS.indexOf(tab) + step + TABS.length) % TABS.length]
    setTab(next)
    document.getElementById(`${id}-${next}`)?.focus()
  }

  return (
    <article className="sidebar-profile" aria-labelledby={`${id}-name`}>
      <div className="sidebar-profile__intro">
        <button
          ref={backRef}
          type="button"
          className="sidebar-profile__back"
          onClick={() => setSelectedSlug(null)}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {t.list.back}
        </button>
        <StudioBadges studio={studio} />
        <div className="sidebar-profile__text">
          <p className="sidebar-profile__cats">{categoryLine(studio)}</p>
          <h3 id={`${id}-name`} className="sidebar-profile__name">
            {studio.name}
          </h3>
          <p className="sidebar-profile__line">{studio.description}</p>
        </div>
        <Button
          as={Link}
          to={`/studio/${studio.slug}`}
          icon={ArrowUpRight}
          className="sidebar-profile__more"
          onClick={() => track('direct_click', { studio: studio.slug })}
        >
          {t.list.more}
        </Button>
      </div>

      <div className="sidebar-profile__tabs" role="tablist" aria-label={studio.name}>
        {TABS.map((key) => (
          <button
            key={key}
            id={`${id}-${key}`}
            type="button"
            role="tab"
            className="sidebar-profile__tab"
            aria-selected={tab === key}
            aria-controls={`${id}-${key}-panel`}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            onKeyDown={onTabKey}
          >
            {t.profile.sections[key]}
          </button>
        ))}
      </div>
      <div
        id={`${id}-${tab}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-${tab}`}
        className="sidebar-profile__panel"
      >
        <h4 className="sidebar-profile__heading">{t.profile.sections[tab]}</h4>
        {tab === 'specialty' ? (
          <>
            <ul className="sidebar-profile__tags">
              {studio.categories.map((c) => (
                <li key={c}>
                  <TagCategory category={c} variant="netral" />
                </li>
              ))}
              {studio.specialties?.map((tag) => (
                <li key={tag}>
                  <Tag label={tag} />
                </li>
              ))}
            </ul>
            <p className="studio-page__note">{t.profile.specialtyNote}</p>
          </>
        ) : (
          <StudioContact studio={studio} className="contact-card--compact" />
        )}
      </div>
    </article>
  )
}

/** Figma "Sidebar/Card": region bar and code, name, categories, "Lihat profil singkat". */
/**
 * The studio count rolls to its new value: the old number leaves upward and the new one
 * comes up from below (down and up when it shrinks). Screen readers get the plain number.
 */
function RollingNumber({ value }) {
  // Which way it rolls, worked out when the value changes.
  const [roll, setRoll] = useState({ value, direction: 1 })
  if (roll.value !== value) setRoll({ value, direction: value > roll.value ? 1 : -1 })
  const { direction } = roll

  return (
    <span className="sidebar__number">
      <span className="visually-hidden">{value}</span>
      <span className="sidebar__roll" aria-hidden="true">
        <AnimatePresence initial={false} mode="popLayout" custom={direction}>
          <motion.span
            key={value}
            custom={direction}
            className="sidebar__roll-value"
            variants={{
              enter: (d) => ({ y: `${d * 100}%`, opacity: 0 }),
              still: { y: '0%', opacity: 1 },
              leave: (d) => ({ y: `${d * -100}%`, opacity: 0 }),
            }}
            initial="enter"
            animate="still"
            exit="leave"
            transition={{ duration: 0.35, ease: EASE_OUT }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  )
}

function StudioRow({ studio, index, focusRef }) {
  const { hoveredSlug, setHoveredSlug, selectedSlug } = useDirectory()
  const { showOnMap } = useOutletContext()
  const ref = useRef(null)
  const selected = selectedSlug === studio.slug
  const active = selected || hoveredSlug === studio.slug
  const area = getArea(studio.area)

  // Selecting a pin brings its row into view (FR-06 "and vice versa").
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
    <motion.li
      ref={ref}
      layout="position"
      // Rows cascade in from the right as the list opens (capped, so a long list does
      // not keep anyone waiting); a filtered-out row just fades.
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{
        duration: 0.4,
        ease: EASE_OUT,
        delay: Math.min(index, 12) * 0.035,
        layout: { duration: 0.3, ease: EASE_OUT },
      }}
      className={`studio-row ${active ? 'is-active' : ''}`}
      style={{ '--region': `var(--region-${studio.area})` }}
    >
      <button
        type="button"
        className="studio-row__card"
        aria-expanded={selected}
        onMouseEnter={() => setHoveredSlug(studio.slug)}
        onMouseLeave={() => setHoveredSlug(null)}
        onFocus={() => setHoveredSlug(studio.slug)}
        onBlur={() => setHoveredSlug(null)}
        onClick={() => {
          // The card is replaced by the profile, so it never gets its mouseleave.
          setHoveredSlug(null)
          focusRef.current = true
          showOnMap(studio.slug)
          track('list_click', { studio: studio.slug })
        }}
      >
        {area && (
          <span className="studio-row__code">
            <span className="visually-hidden">{area.name}, </span>
            {area.code}
          </span>
        )}
        <span className="studio-row__text">
          <span className="studio-row__name">{studio.name}</span>
          <span className="studio-row__cats">{categoryLine(studio)}</span>
        </span>
        <span className="studio-row__more">
          {t.list.shortProfile}
          <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </button>
    </motion.li>
  )
}
