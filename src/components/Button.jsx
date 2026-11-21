// Button from the Figma library ("Button/Buttons" and "Button/Buttons destructive").
// Hierarchy: primary (filled), outlined, link. Tone: default (ink) or danger (error red).
// Icons are Phosphor at regular weight, which is what the Figma ArrowUpRight instance is.

const ICON_SIZE = { sm: 14, md: 14, lg: 16, xl: 18 }

/**
 * `icon` is a Phosphor component; `iconPosition` is 'left', 'right' or 'only'.
 * Icon-only buttons must get an `aria-label`. Pass `as={Link}` (or 'a') for links;
 * those take `aria-disabled` instead of `disabled`.
 */
export default function Button({
  as: Component = 'button',
  variant = 'primary',
  tone = 'default',
  size = 'md',
  icon: Icon,
  iconPosition = 'right',
  className = '',
  children,
  ...rest
}) {
  const only = Icon && iconPosition === 'only'
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    tone === 'danger' && 'btn--danger',
    only && 'btn--icon-only',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  if (Component === 'button' && rest.type === undefined) rest.type = 'button'

  const icon = Icon && <Icon size={ICON_SIZE[size]} aria-hidden="true" focusable="false" />
  return (
    <Component className={classes} {...rest}>
      {iconPosition === 'left' && icon}
      {only ? icon : children}
      {iconPosition === 'right' && icon}
    </Component>
  )
}
