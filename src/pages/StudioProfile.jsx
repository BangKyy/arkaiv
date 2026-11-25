import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useParams } from 'react-router'
import { useDirectory } from '../state/directory'
import Button from '../components/Button'
import CardPager from '../components/CardPager'
import PhotoCard from '../components/PhotoCard'
import SectionHeading from '../components/SectionHeading'
import { StepBox } from '../components/LabeledBox'
import { ArchiveBadge, CategoryBadge, CodeBadge } from '../components/RegionalBadge'
import StudioContact from '../components/StudioContact'
import { Tag, TagCategory } from '../components/Tags'
import { ArrowUpRight, Check, Copy } from '../components/icons'
import { categoryName, getArea, googleMapsUrl, instagramUrl } from '../lib/catalog'
import { formatDate, useMediaQuery, usePageMeta } from '../lib/hooks'
import { track } from '../lib/analytics'
import { useIntro } from '../lib/intro'
import { inView, riseGroup } from '../lib/motion'
import NotFound from './NotFound'
import placeholder from '../assets/profile-placeholder.png'
import t from '../i18n/id'

const PHONE_QUERY = '(max-width: 727px)'
// Photo tags from the deck, in the order of the portfolio filter.
const PHOTO_TAGS = ['People', 'Environment', 'Activity', 'Process', 'Work']

/** Projects and tagged photos as portfolio cards. Projects count as "Work". */
function portfolioItems(s) {
  const projects = (s.projects ?? []).map((p) => ({
    key: `project-${p.title}-${p.year}`,
    tag: 'Work',
    label: p.category ? categoryName(p.category) : 'Work',
    image: p.image,
    alt: p.title,
    title: p.title,
    subtitle: p.description || (p.year ? String(p.year) : ''),
    href: p.url,
  }))
  const photos = (s.photos ?? []).map((p) => ({
    key: `photo-${p.src}`,
    tag: p.tag,
    label: p.tag,
    image: p.src,
    alt: p.alt ?? '',
    title: p.title || p.alt || p.tag,
    subtitle: p.caption,
    href: p.url,
  }))
  return [...projects, ...photos]
}

/** The book's six-part order (PRD section 8). Empty parts are left out entirely. */
function buildSections(s, portfolio) {
  const has = {
    about: true,
    people: s.people?.length > 0,
    specialty: s.categories.length > 0,
    approach: s.process?.length > 0 || Boolean(s.approach),
    projects: portfolio.length > 0,
    contact: true,
  }
  return Object.keys(t.profile.sections).filter((id) => has[id])
}

/**
 * Figma "Pages/Detailed Studio": a standalone page per studio (stable URL, QR target).
 * Desktop >= 1100px (110px gutters), tablet 728-1099px (62px), mobile < 728px (32px).
 */
export default function StudioProfile() {
  const { slug } = useParams()
  const { bySlug, ready } = useDirectory()
  const studio = bySlug.get(slug)

  usePageMeta(studio?.name ?? (ready ? t.notFound.title : null), studio?.description)

  useEffect(() => {
    if (studio) track('profile_view', { studio: studio.slug })
  }, [studio])

  // A slug that is not in the archive gets the site's 404 page, once the data is final;
  // while Supabase is still loading the page stays empty rather than flashing a 404.
  if (!studio) return ready ? <NotFound /> : <article className="studio-page" aria-busy="true" />

  const portfolio = portfolioItems(studio)
  const sections = buildSections(studio, portfolio)

  return (
    <article className="studio-page" aria-labelledby="profile-name">
      {/* Keyed so the intro replays, and its split text never meets a re-render. */}
      <Hero key={studio.slug} studio={studio} />
      <div className="studio-page__sections">
        {sections.map((id, i) => (
          <section key={id} className="studio-page__inner studio-page__section" aria-labelledby={`sec-${id}`}>
            <SectionHeading eyebrow={t.profile.sectionEyebrow(i + 1)} id={`sec-${id}`}>
              {t.profile.sections[id]}
            </SectionHeading>
            <motion.div className="studio-page__body" {...inView} variants={riseGroup}>
              <SectionBody id={id} studio={studio} portfolio={portfolio} />
            </motion.div>
          </section>
        ))}
      </div>
    </article>
  )
}

function Hero({ studio }) {
  const heroRef = useRef(null)
  useIntro(heroRef)
  const outbound = (type) => () => track('outbound_click', { studio: studio.slug, type })
  const links = [
    studio.contact?.email && { type: 'email', label: t.profile.email, href: `mailto:${studio.contact.email}` },
    studio.instagram && { type: 'instagram', label: t.profile.instagram, href: instagramUrl(studio.instagram) },
    studio.website && { type: 'website', label: t.profile.website, href: studio.website },
    { type: 'google_maps', label: t.profile.googleMaps, href: googleMapsUrl(studio) },
  ].filter(Boolean)

  return (
    <header ref={heroRef} className="studio-hero">
      <div className="studio-hero__media">
        <img className="studio-hero__cover" src={studio.cover || placeholder} alt="" data-intro="media" />
        <div className="studio-page__inner">
          <div className="studio-hero__logo" data-intro="pop">
            <img src={studio.logo || placeholder} alt={studio.logo ? `Logo ${studio.name}` : ''} />
          </div>
        </div>
      </div>

      <div className="studio-page__inner studio-hero__body">
        <div className="studio-hero__top" data-intro="rise">
          <div className="studio-hero__badges">
            <CodeBadge code={studio.code} area={studio.area} primaryCategory={studio.primaryCategory} />
            <ArchiveBadge label={t.profile.archive} years={t.profile.archiveYears} />
            <CategoryBadge ids={studio.categories} />
          </div>
          <CopyLinkButton slug={studio.slug} />
        </div>

        <div className="studio-hero__text">
          {studio.lastVerified && (
            <p className="studio-hero__verified" data-intro="rise">{t.profile.lastVerified(formatDate(studio.lastVerified))}</p>
          )}
          <h1 id="profile-name" className="studio-hero__name" tabIndex={-1} data-intro="title">
            {studio.name}
          </h1>
          <p className="studio-hero__lede" data-intro="rise">
            {studio.description}
          </p>
        </div>

        <ul className="studio-hero__links">
          {links.map((l) => (
            <li key={l.type} data-intro="rise">
              <Button
                as="a"
                href={l.href}
                {...(l.type === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                variant="outlined"
                size="xl"
                icon={ArrowUpRight}
                onClick={outbound(l.type)}
              >
                {l.label}
                {l.type !== 'email' && <span className="visually-hidden"> {t.profile.newTab}</span>}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}

function CopyLinkButton({ slug }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return undefined
    const id = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(id)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/studio/${slug}`)
      setCopied(true)
      track('copy_link', { studio: slug })
    } catch {
      // Clipboard can be blocked (permissions, insecure origin); the address bar still works.
    }
  }

  return (
    <Button variant="outlined" size="xl" icon={copied ? Check : Copy} className="studio-hero__copy" onClick={copy}>
      <span aria-live="polite">{copied ? t.profile.copied : t.profile.copyLink}</span>
    </Button>
  )
}

function SectionBody({ id, studio, portfolio }) {
  switch (id) {
    case 'about':
      return <About studio={studio} />
    case 'people':
      return <Team people={studio.people} />
    case 'specialty':
      return (
        <>
          <ul className="studio-page__tags">
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
      )
    case 'approach':
      return (
        <>
          {studio.process?.length > 0 && (
            <ol className="studio-page__boxes studio-page__boxes--steps">
              {studio.process.map((step, i) => (
                <li key={step}>
                  <StepBox label={t.profile.step(i + 1)} watermark={String(i + 1)}>
                    {step}
                  </StepBox>
                </li>
              ))}
            </ol>
          )}
          {studio.approach && <p className="studio-page__note">{studio.approach}</p>}
        </>
      )
    case 'projects':
      return <Portfolio items={portfolio} studio={studio} />
    case 'contact':
      return <StudioContact studio={studio} />
    default:
      return null
  }
}

function About({ studio }) {
  const area = getArea(studio.area)
  const facts = [
    studio.founded && { label: t.profile.founded, value: studio.founded },
    studio.type && { label: t.profile.type, value: studio.type },
    area && { label: t.profile.area, value: area.name },
  ].filter(Boolean)

  return (
    <>
      <ul className="studio-page__boxes">
        {facts.map((f, i) => (
          <li key={f.label}>
            <StepBox label={f.label} watermark={String(i + 1)}>
              {f.value}
            </StepBox>
          </li>
        ))}
      </ul>
      <p className="studio-page__note">{studio.about || studio.description}</p>
    </>
  )
}

function Team({ people }) {
  const isPhone = useMediaQuery(PHONE_QUERY)
  return (
    <CardPager
      className="card-pager--team"
      label={t.profile.team}
      items={people}
      pageSize={isPhone ? 1 : 4}
      getKey={(p) => `${p.name}-${p.role}`}
      renderItem={(p) => (
        <PhotoCard
          image={p.photo}
          alt={p.name}
          title={p.name}
          subtitle={p.role}
          tag={p.internship ? t.profile.internship : null}
        />
      )}
    />
  )
}

function Portfolio({ items, studio }) {
  const isPhone = useMediaQuery(PHONE_QUERY)
  const [filter, setFilter] = useState('all')
  const tags = PHOTO_TAGS.filter((tag) => items.some((item) => item.tag === tag))
  const shown = filter === 'all' ? items : items.filter((item) => item.tag === filter)

  return (
    <div className="studio-page__portfolio">
      {tags.length > 1 && (
        <div className="studio-page__filters" role="group" aria-label="Filter portofolio">
          {['all', ...tags].map((tag) => (
            <Tag
              key={tag}
              as="button"
              label={tag === 'all' ? t.profile.all : tag}
              aria-pressed={filter === tag}
              onClick={() => setFilter(tag)}
            />
          ))}
        </div>
      )}
      <CardPager
        key={filter}
        className="card-pager--portfolio"
        label={t.profile.portfolio}
        items={shown}
        pageSize={isPhone ? 3 : 4}
        getKey={(item) => item.key}
        renderItem={(item) => (
          <PhotoCard
            image={item.image}
            alt={item.alt}
            tag={item.label}
            title={item.title}
            subtitle={item.subtitle}
            href={item.href}
            linkLabel={t.profile.seeMore}
            onLinkClick={() => track('outbound_click', { studio: studio.slug, type: 'portfolio' })}
          />
        )}
      />
    </div>
  )
}
