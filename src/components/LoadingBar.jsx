import { useEffect, useState } from 'react'
import { useIsLoading } from '../lib/progress'

// Loads shorter than this never show the bar, so quick ones do not flicker.
const SHOW_AFTER = 150
// How long the full bar stays before it is reset (it fades out meanwhile, see CSS).
const FINISH = 500

/**
 * A thin ink bar along the top of the window while anything loads (lib/progress).
 * It creeps toward 90% (a long CSS transition, since the real progress is unknown),
 * fills up when the work is done, then fades. Visual only: each page states its own
 * loading in text where it matters.
 */
export default function LoadingBar() {
  const loading = useIsLoading()
  const [phase, setPhase] = useState('idle') // idle | start | run

  useEffect(() => {
    let timer
    if (phase === 'idle' && loading) timer = setTimeout(() => setPhase('start'), SHOW_AFTER)
    // One frame at the starting width first, so the creep has somewhere to animate from.
    else if (phase === 'start') timer = setTimeout(() => setPhase('run'), 20)
    else if (phase === 'run' && !loading) timer = setTimeout(() => setPhase('idle'), FINISH)
    return () => clearTimeout(timer)
  }, [phase, loading])

  const state = phase === 'run' && !loading ? 'done' : phase
  return <div className={`loading-bar loading-bar--${state}`} aria-hidden="true" />
}
