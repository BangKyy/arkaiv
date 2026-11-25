// Shared Framer Motion settings: everything that reacts to scrolling or input (GSAP plays
// the page intros, see lib/intro). MotionConfig reducedMotion="user" in App turns the
// movement off for visitors who ask for less, leaving only the fades.

export const EASE_OUT = [0.22, 1, 0.36, 1]

/** Spread on the outer element: plays its variants once, when a fifth of it is in view. */
export const inView = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, amount: 0.2 },
}

/** A parent that shows its children one after another. */
export const stagger = (gap = 0.1, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
})

/** Fades up into place. */
export const rise = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT } },
}

/** Fades up, then brings its own children in one by one. */
export const riseGroup = {
  hidden: rise.hidden,
  show: { ...rise.show, transition: { ...rise.show.transition, staggerChildren: 0.1 } },
}

/** Unrolls from the left edge (images). */
export const unveil = {
  hidden: { clipPath: 'inset(0% 100% 0% 0%)' },
  show: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 1.1, ease: [0.76, 0, 0.24, 1] } },
}

/** Draws a rule from the left. */
export const draw = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 1, ease: EASE_OUT } },
}
