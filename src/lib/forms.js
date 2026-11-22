// Shared form behavior: errors appear on submit and leave as soon as their field is fixed.

/**
 * Keeps only the errors in `prev` that `current` (a fresh validation of the form's values)
 * still reports, so a field drops its Destructive state the moment it is filled in,
 * by typing or by autofill. Never adds errors: new ones wait for the next submit.
 * Returns `prev` itself when nothing changed, so React skips the re-render.
 */
export function clearFixedErrors(prev, current) {
  const keys = Object.keys(prev)
  const kept = keys.filter((k) => k in current)
  if (kept.length === keys.length && kept.every((k) => prev[k] === current[k])) return prev
  return Object.fromEntries(kept.map((k) => [k, current[k]]))
}
