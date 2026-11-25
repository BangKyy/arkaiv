import { useEffect, useSyncExternalStore } from 'react'

// What the top loading bar (components/LoadingBar) waits on: a count of tasks in flight,
// shared by everything that loads (studio data, the map, lazy pages, uploads, sending).
let pending = 0
const listeners = new Set()
const emit = () => listeners.forEach((listener) => listener())

/** Marks one task as started; call the returned function (once is enough) when it ends. */
export function startLoading() {
  pending += 1
  emit()
  let done = false
  return () => {
    if (done) return
    done = true
    pending -= 1
    emit()
  }
}

/** True while any task is in flight. */
export function useIsLoading() {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
    () => pending > 0,
    () => false,
  )
}

/** Holds the loading bar while `active` is true (and the component is mounted). */
export function useLoading(active = true) {
  useEffect(() => (active ? startLoading() : undefined), [active])
}

/** A Suspense fallback that holds the loading bar while the lazy part downloads. */
export function Loading({ children = null }) {
  useLoading()
  return children
}
