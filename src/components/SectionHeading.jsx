/**
 * "Section Heading" from the Figma library: a Doto eyebrow over a Mozilla Text headline,
 * closed by an ink rule. Size 'lg' (48px headline) or 'sm' (36px); lg drops to sm on phones.
 */
export default function SectionHeading({
  as: Heading = 'h2',
  eyebrow,
  size = 'lg',
  className = '',
  children,
  ...rest
}) {
  return (
    <header className={`section-heading section-heading--${size} ${className}`}>
      {eyebrow && <p className="section-heading__eyebrow">{eyebrow}</p>}
      <Heading className="section-heading__title" {...rest}>
        {children}
      </Heading>
    </header>
  )
}
