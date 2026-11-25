import { motion, useReducedMotion } from 'motion/react'
import check from '../assets/checkbox/check-md.svg'
import { EASE_OUT } from '../lib/motion'

// A row turning done: its box springs and the check draws in from the left.
const boxStates = {
  todo: { scale: 1 },
  done: { scale: [1, 1.25, 1], transition: { duration: 0.45, ease: EASE_OUT } },
}

/**
 * "Progress Check/Regist Studio" from the Figma library: a read-only checklist that
 * follows the form, not something to tick. Done rows get an ink box with a check and ink
 * text; pending rows stay grey. Rows are joined by a rule, long and ink after a done row.
 * `items` are `{ id, label, note, done }`; `note` is a suffix such as "(opsional)".
 */
export default function ProgressCheck({ items, className = '', ...rest }) {
  const reduceMotion = useReducedMotion()
  return (
    <ol className={`progress-check ${className}`} {...rest}>
      {items.map((item) => (
        <li key={item.id} className={`progress-check__item ${item.done ? 'is-done' : ''}`}>
          <span className="progress-check__row">
            <motion.span
              className="progress-check__box"
              aria-hidden="true"
              initial={false}
              animate={item.done ? 'done' : 'todo'}
              variants={boxStates}
            >
              {item.done && (
                <motion.img
                  src={check}
                  alt=""
                  initial={reduceMotion ? false : { clipPath: 'inset(0% 100% 0% 0%)' }}
                  animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                  transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.1 }}
                />
              )}
            </motion.span>
            <span>
              <span className="visually-hidden">{item.done ? 'Selesai: ' : 'Belum: '}</span>
              {item.label}
              {item.note && <> {item.note}</>}
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}
