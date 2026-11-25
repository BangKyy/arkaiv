import { useId } from 'react'
import { useDirectory } from '../state/directory'
import { areas, categories } from '../lib/catalog'
import { RegionTag, Tag, TagCategory } from './Tags'
import t from '../i18n/id'

/**
 * Figma "Filter Data Map" (FR-05): a category row and a region row, both multi-select.
 * "Semua" is pressed while its row has no selection, and clears the row.
 * Row labels show on desktop; narrower screens scroll each row sideways.
 */
export default function MapFilter() {
  const { filters, setCategories, setAreas, studios } = useDirectory()

  const counts = new Map()
  for (const s of studios) for (const c of s.categories) counts.set(c, (counts.get(c) ?? 0) + 1)

  // Keeps the catalog order, so the URL reads the same however the chips were pressed.
  const toggle = (all, selected, id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return all.map((x) => x.id).filter((x) => next.has(x))
  }

  return (
    <div className="map-filter" role="group" aria-label={t.filter.label}>
      <FilterRow label={t.filter.categories}>
        <Tag
          as="button"
          label={t.filter.all}
          aria-label={t.filter.allCategories}
          aria-pressed={filters.categories.length === 0}
          onClick={() => setCategories([])}
        />
        {categories.map((cat) => (
          <TagCategory
            key={cat.id}
            as="button"
            category={cat.id}
            variant="outlined-netral"
            aria-pressed={filters.categories.includes(cat.id)}
            onClick={() => setCategories(toggle(categories, filters.categories, cat.id))}
          >
            <span className="tag-count">{counts.get(cat.id) ?? 0}</span>
          </TagCategory>
        ))}
      </FilterRow>
      <FilterRow label={t.filter.areas}>
        <Tag
          as="button"
          label={t.filter.all}
          aria-label={t.filter.allAreas}
          aria-pressed={filters.areas.length === 0}
          onClick={() => setAreas([])}
        />
        {areas.map((area) => (
          <RegionTag
            key={area.id}
            as="button"
            id={area.id}
            aria-pressed={filters.areas.includes(area.id)}
            onClick={() => setAreas(toggle(areas, filters.areas, area.id))}
          />
        ))}
      </FilterRow>
    </div>
  )
}

function FilterRow({ label, children }) {
  const id = useId()
  return (
    <div className="map-filter__row" role="group" aria-labelledby={id}>
      <span id={id} className="map-filter__label">
        {label}
      </span>
      <div className="map-filter__tags">{children}</div>
    </div>
  )
}
