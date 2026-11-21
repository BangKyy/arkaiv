import { useDirectory } from '../state/directory'
import { categories } from '../lib/catalog'
import { X } from './icons'
import { Tag, TagCategory } from './Tags'
import t from '../i18n/id'

/** FR-05: multi-select category filter shared by the map and the list. */
export default function CategoryFilter() {
  const { filters, setCategories, clearFilters, studios } = useDirectory()
  const active = new Set(filters.categories)

  const counts = new Map()
  for (const s of studios) for (const c of s.categories) counts.set(c, (counts.get(c) ?? 0) + 1)

  const toggle = (id) => {
    const next = new Set(active)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setCategories(categories.map((c) => c.id).filter((cid) => next.has(cid)))
  }

  return (
    <div className="filter-bar" role="group" aria-label={t.filter.label}>
      <div className="filter-bar__scroll">
        <Tag
          as="button"
          label={t.filter.all}
          aria-pressed={active.size === 0}
          onClick={clearFilters}
        />
        {categories.map((cat) => (
          <TagCategory
            key={cat.id}
            as="button"
            category={cat.id}
            variant="outlined-netral"
            removable={active.has(cat.id)}
            aria-pressed={active.has(cat.id)}
            onClick={() => toggle(cat.id)}
          >
            <span className="chip__count" aria-hidden="true">
              {counts.get(cat.id) ?? 0}
            </span>
          </TagCategory>
        ))}
      </div>
      {active.size > 0 && (
        <button type="button" className="filter-bar__clear" onClick={clearFilters}>
          <X size={14} weight="bold" aria-hidden="true" />
          {t.filter.clear}
          <span className="visually-hidden"> ({t.filter.active(active.size)})</span>
        </button>
      )}
    </div>
  )
}
