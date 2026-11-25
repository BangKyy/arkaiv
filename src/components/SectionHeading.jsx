import { motion } from 'motion/react'
import { draw, inView, rise, stagger } from '../lib/motion'

/**
 * "Section Heading" from the Figma library: a Doto eyebrow over a Mozilla Text headline,
 * closed by an ink rule. Size 'lg' (48px headline) or 'sm' (36px); lg drops to sm on phones.
 * Scrolled into view, the text rises and the rule draws itself from the left.
 */
export default function SectionHeading({
  as: Heading = 'h2',
  eyebrow,
  size = 'lg',
  className = '',
  children,
  ...rest
}) {
  const MotionHeading = motion[Heading]
  return (
    <motion.header className={`section-heading section-heading--${size} ${className}`} {...inView} variants={stagger(0.08)}>
      {eyebrow && (
        <motion.p className="section-heading__eyebrow" variants={rise}>
          {eyebrow}
        </motion.p>
      )}
      <MotionHeading className="section-heading__title" variants={rise} {...rest}>
        {children}
      </MotionHeading>
      <motion.span className="section-heading__rule" variants={draw} aria-hidden="true" />
    </motion.header>
  )
}
