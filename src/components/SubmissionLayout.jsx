import { useId, useState } from 'react'
import ProgressCheck from './ProgressCheck'
import SectionHeading from './SectionHeading'
import { CaretDown } from './icons'

/**
 * "Form" page organism from the Figma library.
 * lg: a sidebar (request type + checklist), an ink rule, then the heading and `children`.
 * md / sm: everything stacked; the checklist folds under a dark bar; on sm the request
 * types stack full width. Sizes follow the layout's own width (container queries).
 *
 * `kinds` are `{ value, label }`; the choice is a radio group, so arrow keys move it.
 */
export default function SubmissionLayout({
  kinds,
  kind,
  onKindChange,
  kindLabel = 'Pilih sesuai kebutuhan kamu',
  checklist,
  checklistTitle = 'Beberapa hal yang harus diselesaikan!',
  title,
  children,
}) {
  const id = useId()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="submission">
      <div className="submission__inner">
        <aside className="submission__side">
          <fieldset className="choice">
            <legend className="choice__legend">{kindLabel}</legend>
            <div className="choice__options">
              {kinds.map((k) => (
                <label key={k.value} className="choice__option">
                  <input
                    type="radio"
                    name={`${id}-kind`}
                    value={k.value}
                    checked={kind === k.value}
                    onChange={() => onKindChange(k.value)}
                  />
                  <span className="btn btn--sm choice__btn">{k.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {checklist?.length > 0 && (
            <section className={`submission__checklist ${collapsed ? 'is-collapsed' : ''}`}>
              <h2 className="submission__checklist-title">
                <span className="submission__checklist-static">{checklistTitle}</span>
                <button
                  type="button"
                  className="submission__checklist-toggle"
                  aria-expanded={!collapsed}
                  aria-controls={`${id}-checklist`}
                  onClick={() => setCollapsed((c) => !c)}
                >
                  {checklistTitle}
                  <CaretDown size={22} aria-hidden="true" focusable="false" />
                </button>
              </h2>
              <ProgressCheck id={`${id}-checklist`} items={checklist} className="submission__progress" />
            </section>
          )}
        </aside>

        <div className="submission__main">
          <SectionHeading className="submission__heading">
            {title}
          </SectionHeading>
          {children}
        </div>
      </div>
    </div>
  )
}
