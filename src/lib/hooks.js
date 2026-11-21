import { useEffect, useSyncExternalStore } from 'react'
import t from '../i18n/id'

/** Keeps <title> and the meta description in sync with the current screen. */
export function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title ? `${title} · ${t.siteName}` : `${t.siteName} · ${t.siteTagline}`
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', description || t.siteDescription)
  }, [title, description])
}

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const MOBILE_QUERY = '(max-width: 899px)'

export const formatDate = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''
