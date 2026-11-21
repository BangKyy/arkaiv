import { Link } from 'react-router'
import { usePageMeta } from '../lib/hooks'
import Button from '../components/Button'
import SectionHeading from '../components/SectionHeading'
import t from '../i18n/id'

export default function NotFound() {
  usePageMeta(t.notFound.title)
  return (
    <article className="page">
      <SectionHeading as="h1" eyebrow="404">
        {t.notFound.title}
      </SectionHeading>
      <p>
        <Button as={Link} variant="outlined" size="lg" to="/">
          {t.notFound.back}
        </Button>
      </p>
    </article>
  )
}
