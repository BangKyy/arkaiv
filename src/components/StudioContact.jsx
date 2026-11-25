import { getArea, googleMapsUrl, instagramUrl } from '../lib/catalog'
import { track } from '../lib/analytics'
import t from '../i18n/id'

/** `span`: 'full' takes the whole row, 'phone' only on phones (Figma Contact sm). */
function ContactItem({ label, href, external = false, span, onClick, children }) {
  return (
    <div className={`contact-card__item ${span ? `contact-card__item--${span}` : ''}`}>
      <dt>{label}</dt>
      <dd>
        {href ? (
          <a href={href} onClick={onClick} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {children}
            {external && <span className="visually-hidden"> {t.profile.newTab}</span>}
          </a>
        ) : (
          children
        )}
      </dd>
    </div>
  )
}

/**
 * Figma "Contact": links out to the studio's website, Instagram, direct contacts and
 * Google Maps. Used on the profile page and in the map panel's short profile.
 */
export default function StudioContact({ studio, className = '' }) {
  const outbound = (type) => () => track('outbound_click', { studio: studio.slug, type })
  const area = getArea(studio.area)
  const handle = studio.instagram?.replace(/^@/, '')
  // Direct contact is published only with the studio's consent (PRD section 11).
  const { email, phone, whatsapp } = studio.contact ?? {}
  const wa = whatsapp?.replace(/\D/g, '')

  return (
    <dl className={`contact-card ${className}`}>
      {studio.website && (
        <ContactItem
          label={t.profile.website}
          href={studio.website}
          external
          span={handle ? undefined : 'full'}
          onClick={outbound('website')}
        >
          {studio.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
        </ContactItem>
      )}
      {handle && (
        <ContactItem
          label={t.profile.instagram}
          href={instagramUrl(handle)}
          external
          span={studio.website ? undefined : 'full'}
          onClick={outbound('instagram')}
        >
          @{handle}
        </ContactItem>
      )}
      {email && (
        <ContactItem label={t.profile.email} href={`mailto:${email}`} span="phone">
          {email}
        </ContactItem>
      )}
      {phone && (
        <ContactItem label={t.profile.phone} href={`tel:${phone.replace(/[^\d+]/g, '')}`} span="phone">
          {phone}
        </ContactItem>
      )}
      {wa && (
        <ContactItem label={t.profile.whatsapp} href={`https://wa.me/${wa}`} external span="phone" onClick={outbound('whatsapp')}>
          {whatsapp}
        </ContactItem>
      )}
      <ContactItem
        label={t.profile.address}
        href={googleMapsUrl(studio)}
        external
        span="full"
        onClick={outbound('google_maps')}
      >
        {[studio.address, area?.name].filter(Boolean).join(', ')}
      </ContactItem>
      {studio.hours && (
        <ContactItem label={t.profile.hours} span="full">
          {studio.hours.split('\n').map((line) => (
            <span key={line} className="contact-card__line">
              {line}
            </span>
          ))}
        </ContactItem>
      )}
    </dl>
  )
}
