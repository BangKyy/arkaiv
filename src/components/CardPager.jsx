import { useState } from 'react'
import { ArrowLeft, ArrowRight } from './icons'

/**
 * A grid of cards shown a page at a time, with the Figma "Card Scroll Bar" under it:
 * one segment per page (the current one long and dark) and arrow buttons built on
 * "Tag/General" Variant=Icon Only. The bar is left out when everything fits on one page.
 * `pageSize` follows the layout (e.g. 4 on desktop, 1 on phones); the grid itself is CSS.
 */
export default function CardPager({ items, pageSize, getKey, renderItem, label, className = '' }) {
  const [rawPage, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(items.length / pageSize))
  // Widening the window can leave fewer pages than the one being viewed.
  const page = Math.min(rawPage, pages - 1)
  const shown = items.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className={`card-pager ${className}`}>
      <ul className="card-pager__grid">
        {shown.map((item, i) => (
          <li key={getKey(item, page * pageSize + i)}>{renderItem(item)}</li>
        ))}
      </ul>
      {pages > 1 && (
        <div className="card-pager__bar">
          <div className="card-pager__track" aria-hidden="true">
            {Array.from({ length: pages }, (_, i) => (
              <span key={i} className={`card-pager__segment ${i === page ? 'is-current' : ''}`} />
            ))}
          </div>
          <p className="visually-hidden" aria-live="polite">
            {label}: halaman {page + 1} dari {pages}
          </p>
          <div className="card-pager__arrows">
            <button
              type="button"
              className="tag card-pager__arrow"
              aria-label={`${label} sebelumnya`}
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ArrowLeft size={18} aria-hidden="true" focusable="false" />
            </button>
            <button
              type="button"
              className="tag card-pager__arrow"
              aria-label={`${label} berikutnya`}
              disabled={page === pages - 1}
              onClick={() => setPage(page + 1)}
            >
              <ArrowRight size={18} aria-hidden="true" focusable="false" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
