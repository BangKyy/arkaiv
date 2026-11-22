import Button from './Button'
import { ArrowUpRight } from './icons'
import placeholder from '../assets/profile-placeholder.png'

/**
 * Figma "Photo Card": a photo over a paper caption, ink-outlined. Category=Profile is a
 * team member (name, role, optional "Internship" tag); Category=Porto & Dokum adds a
 * category tag and an optional "Lihat lebih lanjut" link. Missing photos fall back to
 * the library's default avatar.
 */
export default function PhotoCard({ image, alt = '', tag, title, subtitle, href, linkLabel, onLinkClick }) {
  return (
    <article className="photo-card">
      <div className="photo-card__media">
        <img src={image || placeholder} alt={image ? alt : ''} loading="lazy" />
        {tag && <span className="tag tag--filled photo-card__tag">{tag}</span>}
      </div>
      <div className="photo-card__body">
        <div className="photo-card__text">
          <h3 className="photo-card__title">{title}</h3>
          {subtitle && <p className="photo-card__subtitle">{subtitle}</p>}
        </div>
        {href && (
          <Button
            as="a"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            variant="link"
            size="xl"
            icon={ArrowUpRight}
            className="photo-card__link"
            onClick={onLinkClick}
          >
            {linkLabel}
            <span className="visually-hidden"> {title} (membuka tab baru)</span>
          </Button>
        )}
      </div>
    </article>
  )
}
