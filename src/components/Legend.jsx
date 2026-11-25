import { categories, areas } from '../lib/catalog'
import { CaretDown, CategoryIcon, Info } from './icons'
import t from '../i18n/id'

/**
 * Figma "Map/Tools/Info": closed, the 162x40 "Keterangan" box; opened (298px), the
 * key to the pins and region labels. FR-03: color is never the only signal.
 */
export default function Legend() {
  return (
    <details className="map-tool legend" data-intro="drop">
      <summary className="legend__summary">
        <span className="legend__title">
          <span className="legend__icon-box">
            <Info size={16} aria-hidden="true" />
          </span>
          {t.map.legend}
        </span>
        <span className="legend__icon-box legend__caret">
          <CaretDown size={16} aria-hidden="true" />
        </span>
      </summary>
      <div className="legend__body">
        <p>{t.map.legendPin}</p>
        <div className="legend__groups">
          <section className="legend__group">
            <h3 className="legend__heading">{t.filter.categories}</h3>
            <ul className="legend__list">
              {categories.map((c) => (
                <li key={c.id}>
                  <CategoryIcon icon={c.icon} size={18} />
                  {c.name}
                </li>
              ))}
            </ul>
          </section>
          <section className="legend__group">
            <h3 className="legend__heading">{t.filter.areas}</h3>
            <ul className="legend__list">
              {areas.map((a) => (
                <li key={a.id}>
                  <span className="legend__code" style={{ '--region': `var(--region-${a.id})` }}>
                    {a.code}
                  </span>
                  {a.name}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </details>
  )
}
