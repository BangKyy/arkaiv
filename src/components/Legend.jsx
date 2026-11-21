import { categories, areas } from '../lib/catalog'
import { CategoryIcon, Info } from './icons'
import t from '../i18n/id'

/** FR-03: explains the pin encoding so color is never the only signal. */
export default function Legend() {
  return (
    <details className="legend">
      <summary>
        <Info size={16} weight="bold" aria-hidden="true" />
        {t.map.legend}
      </summary>
      <div className="legend__body">
        <p>{t.map.legendPin}</p>
        <ul className="legend__list">
          {categories.map((c) => (
            <li key={c.id}>
              <span className="legend__icon">
                <CategoryIcon icon={c.icon} size={14} />
              </span>
              {c.name}
            </li>
          ))}
        </ul>
        <ul className="legend__list legend__list--areas">
          {areas.map((a) => (
            <li key={a.id}>
              <span className="area-tag__code">{a.code}</span> {a.short}
            </li>
          ))}
        </ul>
        <p className="legend__note">{t.map.boundaryNote}</p>
      </div>
    </details>
  )
}
