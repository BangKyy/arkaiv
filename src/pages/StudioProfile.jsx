import { useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { useDirectory } from '../state/directory'
import { AreaTag, CategoryChips, CodeTab } from '../components/StudioBits'
import {
  ArrowLeft,
  ArrowUpRight,
  EnvelopeSimple,
  Globe,
  InstagramLogo,
  MapPin,
  WhatsappLogo,
} from '../components/icons'
import { categoryName, getArea, googleMapsUrl, instagramUrl } from '../lib/catalog'
import { accentFor } from '../lib/colors'
import { formatDate, usePageMeta } from '../lib/hooks'
import { track } from '../lib/analytics'
import t from '../i18n/id'

// Photo tags from the deck, placed in the profile section they document.
const PHOTO_SECTION = {
  Environment: 'about',
  Activity: 'about',
  People: 'people',
  Process: 'approach',
  Work: 'projects',
}

/** The book's six-part order (PRD section 8). Empty parts are left out entirely. */
function buildSections(s) {
  const photos = (id) => (s.photos ?? []).filter((p) => PHOTO_SECTION[p.tag] === id)
  const has = {
    // The one-line description is already in the header, so About needs its own text or photos.
    about: Boolean(s.about) || photos('about').length > 0,
    people: s.people?.length > 0 || photos('people').length > 0,
    specialty: s.categories.length > 0,
    approach: Boolean(s.approach) || photos('approach').length > 0,
    projects: s.projects?.length > 0 || photos('projects').length > 0,
    contact: true,
  }
  return Object.keys(t.profile.sections)
    .filter((id) => has[id])
    .map((id) => ({ id, label: t.profile.sections[id], photos: photos(id) }))
}

export default function StudioProfile() {
  const { slug } = useParams()
  const { bySlug } = useDirectory()
  const { search } = useLocation()
  const studio = bySlug.get(slug)

  usePageMeta(studio?.name ?? t.profile.notFound, studio?.description)

  useEffect(() => {
    if (studio) track('profile_view', { studio: studio.slug })
  }, [studio])

  const back = (
    <Link className="back-link" to={{ pathname: '/', search }}>
      <ArrowLeft size={16} weight="bold" aria-hidden="true" />
      {t.profile.back}
    </Link>
  )

  if (!studio) {
    return (
      <section className="panel-section">
        {back}
        <h1 tabIndex={-1}>{t.profile.notFound}</h1>
        <p>{t.profile.notFoundBody}</p>
      </section>
    )
  }

  const sections = buildSections(studio)
  const { bg, fg } = accentFor(studio.accent)

  return (
    <article className="profile" aria-labelledby="profile-name">
      {back}

      <header className="profile__header" style={{ '--accent': bg, '--accent-fg': fg }}>
        {studio.cover && (
          <img className="profile__cover" src={studio.cover} alt="" loading="lazy" />
        )}
        <div className="profile__band">
          <CodeTab studio={studio} />
          {studio.logo && (
            <img className="profile__logo" src={studio.logo} alt={`Logo ${studio.name}`} />
          )}
        </div>
        <h1 id="profile-name" className="profile__name" tabIndex={-1}>
          {studio.name}
        </h1>
        <p className="profile__lede">{studio.description}</p>
        <div className="profile__tags">
          <CategoryChips ids={studio.categories} primary={studio.primaryCategory} />
          <AreaTag id={studio.area} />
        </div>
      </header>

      <nav className="index-tabs" aria-label={t.profile.sectionsNav}>
        <ol>
          {sections.map((sec, i) => (
            <li key={sec.id}>
              <a
                href={`#sec-${sec.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  const el = document.getElementById(`sec-${sec.id}`)
                  el?.scrollIntoView({ block: 'start' })
                  el?.querySelector('h2')?.focus({ preventScroll: true })
                }}
              >
                <span className="index-tabs__num">{String(i + 1).padStart(2, '0')}</span>
                {sec.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((sec, i) => (
        <section key={sec.id} id={`sec-${sec.id}`} className="profile__section">
          <h2 tabIndex={-1}>
            <span className="profile__section-num">{String(i + 1).padStart(2, '0')}</span>
            {sec.label}
          </h2>
          <SectionBody id={sec.id} studio={studio} />
          {sec.photos.length > 0 && <Gallery photos={sec.photos} />}
        </section>
      ))}
    </article>
  )
}

function SectionBody({ id, studio }) {
  switch (id) {
    case 'about':
      return studio.about ? <p>{studio.about}</p> : null
    case 'people':
      return studio.people?.length ? (
        <ul className="people">
          {studio.people.map((p) => (
            <li key={`${p.name}-${p.role}`}>
              <span className="people__name">{p.name}</span>
              {p.role && <span className="people__role">{p.role}</span>}
            </li>
          ))}
        </ul>
      ) : null
    case 'specialty':
      return (
        <>
          <CategoryChips ids={studio.categories} primary={studio.primaryCategory} />
          {studio.specialties?.length > 0 && (
            <ul className="tags">
              {studio.specialties.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          )}
        </>
      )
    case 'approach':
      return studio.approach ? <p>{studio.approach}</p> : null
    case 'projects':
      return studio.projects?.length ? (
        <ul className="projects">
          {studio.projects.map((p) => (
            <li key={`${p.title}-${p.year}`}>
              <span className="projects__title">{p.title}</span>
              <span className="projects__meta">
                {[p.year, p.category && categoryName(p.category)].filter(Boolean).join(' · ')}
              </span>
            </li>
          ))}
        </ul>
      ) : null
    case 'contact':
      return <Contact studio={studio} />
    default:
      return null
  }
}

function External({ href, kind, studio, icon, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="contact__link"
      onClick={() => track('outbound_click', { studio: studio.slug, type: kind })}
    >
      {icon}
      <span>{children}</span>
      <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
      <span className="visually-hidden"> {t.profile.newTab}</span>
    </a>
  )
}

function Contact({ studio }) {
  const { search } = useLocation()
  const area = getArea(studio.area)
  const iconProps = { size: 18, weight: 'bold', 'aria-hidden': true }
  const wa = studio.contact?.whatsapp?.replace(/\D/g, '')

  return (
    <>
      <dl className="facts">
        <div>
          <dt>{t.profile.address}</dt>
          <dd>{studio.address}</dd>
        </div>
        {area && (
          <div>
            <dt>{t.profile.area}</dt>
            <dd>
              {area.name} ({area.code})
            </dd>
          </div>
        )}
      </dl>

      <ul className="contact">
        <li>
          <External href={googleMapsUrl(studio)} kind="google_maps" studio={studio} icon={<MapPin {...iconProps} />}>
            {t.profile.openMaps}
          </External>
        </li>
        {studio.website && (
          <li>
            <External href={studio.website} kind="website" studio={studio} icon={<Globe {...iconProps} />}>
              {studio.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            </External>
          </li>
        )}
        {studio.instagram && (
          <li>
            <External
              href={instagramUrl(studio.instagram)}
              kind="instagram"
              studio={studio}
              icon={<InstagramLogo {...iconProps} />}
            >
              @{studio.instagram.replace(/^@/, '')}
            </External>
          </li>
        )}
        {/* Direct contact is published only with the studio's consent (PRD section 11). */}
        {studio.contact?.email && (
          <li>
            <a className="contact__link" href={`mailto:${studio.contact.email}`}>
              <EnvelopeSimple {...iconProps} />
              <span>{studio.contact.email}</span>
            </a>
          </li>
        )}
        {wa && (
          <li>
            <External href={`https://wa.me/${wa}`} kind="whatsapp" studio={studio} icon={<WhatsappLogo {...iconProps} />}>
              {t.profile.whatsapp}
            </External>
          </li>
        )}
      </ul>

      <p className="profile__meta">
        {studio.lastVerified && (
          <>
            {t.profile.lastVerified}: {formatDate(studio.lastVerified)}
            <br />
          </>
        )}
        <Link to={{ pathname: '/daftar', search: `?koreksi=${studio.slug}` }} state={{ from: search }}>
          {t.profile.report}
        </Link>
      </p>
    </>
  )
}

function Gallery({ photos }) {
  return (
    <ul className="gallery">
      {photos.map((p) => (
        <li key={p.src}>
          <img src={p.src} alt={p.alt ?? ''} loading="lazy" />
        </li>
      ))}
    </ul>
  )
}
