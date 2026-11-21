// Privacy-friendly event tracking (PRD section 12). No cookies, no visitor data.
// Wire to a cookie-less provider (e.g. Plausible or Umami) by defining window.plausible
// or window.umami; until then events are only logged in development.
//
// Events: map_loaded, pin_click, list_click, filter_applied, profile_view,
//         outbound_click, submit_click  (search_query arrives in V1.1)
export function track(event, props = {}) {
  try {
    if (typeof window.plausible === 'function') window.plausible(event, { props })
    else if (window.umami?.track) window.umami.track(event, props)
    else if (import.meta.env.DEV) console.debug('[track]', event, props)
  } catch {
    // Analytics must never break the directory.
  }
}
