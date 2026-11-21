import { motion, useDragControls } from 'motion/react'
import { CaretDown, CaretUp } from './icons'
import { SNAPS, snapHeights } from './sheet'
import t from '../i18n/id'

/**
 * Mobile list/profile container (FR-14). It moves with transform only and is
 * dragged from its handle, so scrolling the list inside never fights the drag.
 */
export default function BottomSheet({ areaHeight, snap, onSnap, contentRef, children }) {
  const controls = useDragControls()
  const heights = snapHeights(areaHeight)
  const sheetHeight = heights.full
  const yFor = (s) => sheetHeight - heights[s]
  const next = snap === 'full' ? 'peek' : SNAPS[SNAPS.indexOf(snap) + 1]

  return (
    <motion.div
      className="sheet"
      style={{ height: sheetHeight }}
      initial={false}
      animate={{ y: yFor(snap) }}
      transition={{ type: 'spring', stiffness: 420, damping: 42 }}
      drag="y"
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ top: 0, bottom: yFor('peek') }}
      dragElastic={0.04}
      onDragEnd={(_, info) => {
        const current = yFor(snap) + info.offset.y
        const projected = current + info.velocity.y * 0.15
        const nearest = SNAPS.reduce((best, s) =>
          Math.abs(yFor(s) - projected) < Math.abs(yFor(best) - projected) ? s : best,
        )
        onSnap(nearest)
      }}
    >
      <div className="sheet__handle-area" onPointerDown={(e) => controls.start(e)}>
        <button
          type="button"
          className="sheet__handle"
          aria-label={snap === 'full' ? t.list.collapse : t.list.expand}
          aria-expanded={snap !== 'peek'}
          onClick={() => onSnap(next)}
        >
          <span className="sheet__grip" aria-hidden="true" />
          {snap === 'full' ? (
            <CaretDown size={16} weight="bold" aria-hidden="true" />
          ) : (
            <CaretUp size={16} weight="bold" aria-hidden="true" />
          )}
        </button>
      </div>
      {/* Bottom padding keeps the last rows reachable while part of the sheet is off-screen. */}
      <div ref={contentRef} className="sheet__content" style={{ paddingBottom: yFor(snap) + 16 }}>
        {children}
      </div>
    </motion.div>
  )
}
