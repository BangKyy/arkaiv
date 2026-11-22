import { Link, useLocation } from 'react-router'
import { usePageMeta } from '../lib/hooks'
import Button from '../components/Button'
import { ArrowUpRight } from '../components/icons'
import fourLg from '../assets/404/four-lg.svg'
import fourSm from '../assets/404/four-sm.svg'
import t from '../i18n/id'

// Official arkaiv address for problem reports; VITE_CONTACT_EMAIL overrides it.
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'directory.arkaiv@gmail.com'

// Figma "Pages/Error 404" ("404 Error", Size lg on desktop and tablet, sm on phones).
export default function NotFound() {
  usePageMeta(t.notFound.title)
  const { pathname, search } = useLocation()

  // The email names the missing address so the report can be acted on.
  const reportHref = `mailto:${CONTACT_EMAIL}?${new URLSearchParams({
    subject: t.notFound.reportSubject,
    body: t.notFound.reportBody(`${window.location.origin}${pathname}${search}`),
  })
    .toString()
    .replaceAll('+', '%20')}`

  return (
    <article className="error-404">
      <Illustration />
      <div className="error-404__text">
        <h1 className="error-404__title">{t.notFound.title}</h1>
        <div className="error-404__actions">
          <Button as="a" href={reportHref} variant="outlined" size="xl" icon={ArrowUpRight}>
            {t.notFound.report}
          </Button>
          <Button as={Link} to="/" size="xl" icon={ArrowUpRight}>
            {t.notFound.home}
          </Button>
        </div>
      </div>
    </article>
  )
}

/** "4", a pixel robot, "4". The robot is the Figma rectangles, on a 200×170 grid. */
function Illustration() {
  const four = (side) => (
    <picture className={`error-404__four error-404__four--${side}`}>
      <source media="(max-width: 727px)" srcSet={fourSm} width="58.8" height="82.8" />
      <img src={fourLg} alt="" width="83.3" height="117.3" />
    </picture>
  )
  return (
    <div className="error-404__art" aria-hidden="true">
      {four('left')}
      <svg className="error-404__robot" viewBox="0 0 200 170" focusable="false">
        <rect className="error-404__ink" x="18" width="20" height="50" />
        <rect className="error-404__ink" x="162" width="20" height="50" />
        <rect className="error-404__ink" y="50" width="200" height="120" />
        <rect className="error-404__screen" x="18" y="61" width="164" height="98" />
        <rect className="error-404__ink" x="38" y="76" width="52" height="32" />
        <rect className="error-404__ink" x="110" y="76" width="52" height="32" />
        <rect className="error-404__ink" x="58" y="132" width="12" height="12" />
        <rect className="error-404__ink" x="130" y="132" width="12" height="12" />
        <rect className="error-404__ink" x="74" y="127" width="52" height="12" />
      </svg>
      {four('right')}
    </div>
  )
}
