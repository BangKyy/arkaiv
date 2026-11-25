import { useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'

gsap.registerPlugin(SplitText, ScrambleTextPlugin)

// Lines are split once the fonts are in (their widths decide the line breaks), but a
// slow font never holds the title back for long.
const fontsReady = () =>
  Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 800))])

/**
 * A page's opening sequence (GSAP; Framer Motion handles everything that reacts to
 * scrolling or input). Plays once when `scopeRef` mounts, and again when `key` changes.
 * Within the scope, by `data-intro`:
 *   eyebrow   the spaced-out label tightens into place
 *   title     lines rise out of a mask; words inside a `scramble` element decode like a
 *             dot-matrix display (the Doto accents)
 *   media     the image unrolls from the top
 *   pop       springs up
 *   rise      fades up, one after another in page order
 *   drop      fades down into place
 *   cascade   its children slide in from the left, one after another (rows of chips)
 * Nothing moves for visitors who ask for reduced motion. The split is undone as soon as
 * the title lands, so React keeps owning that markup, and every part drops its inline
 * styles once in place, so CSS states (hover, pressed) apply untouched.
 */
export function useIntro(scopeRef, key) {
  useLayoutEffect(() => {
    const scope = scopeRef.current
    if (!scope) return undefined
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(scope)
      const intro = gsap.timeline({ defaults: { ease: 'expo.out' } })
      // Pages use only some of the parts.
      const from = (part, vars, at, pick = (el) => el) => {
        const targets = q(`[data-intro="${part}"]`).flatMap(pick)
        if (targets.length) intro.from(targets, { clearProps: 'opacity,visibility,transform,letterSpacing,clipPath', ...vars }, at)
      }
      from('media', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.3, ease: 'expo.inOut' }, 0)
      from('eyebrow', { autoAlpha: 0, letterSpacing: '0.6em', duration: 1.2 }, 0)
      from('drop', { autoAlpha: 0, y: -16, duration: 0.8 }, 0.1)
      from('cascade', { autoAlpha: 0, x: -24, duration: 0.7, stagger: 0.035 }, 0.1, (el) => [...el.children])
      from('pop', { autoAlpha: 0, scale: 0.8, duration: 0.8, ease: 'back.out(1.7)' }, 0.5)
      from('rise', { autoAlpha: 0, y: 24, duration: 1, stagger: 0.08 }, 0.35)

      const title = q('[data-intro="title"]')[0]
      if (!title) return undefined
      // Hidden before the first paint, shown again once it is split.
      gsap.set(title, { autoAlpha: 0 })
      let split
      let lines
      let cancelled = false
      fontsReady().then(() => {
        if (cancelled) return
        split = SplitText.create(title, { type: 'lines,words', mask: 'lines', linesClass: 'intro-line', aria: 'auto' })
        gsap.set(title, { autoAlpha: 1 })
        const coded = split.words.filter((w) => w.closest('[data-intro="scramble"]'))
        lines = gsap
          .timeline({ onComplete: () => split.revert() })
          .from(split.lines, { yPercent: 130, duration: 1.1, stagger: 0.09, ease: 'expo.out' })
        if (coded.length) {
          lines.to(
            coded,
            {
              scrambleText: { text: '{original}', chars: 'upperAndLowerCase', speed: 0.6 },
              duration: 1,
              stagger: 0.12,
              ease: 'none',
            },
            0.15,
          )
        }
      })
      return () => {
        cancelled = true
        lines?.kill()
        split?.revert()
      }
    })

    return () => mm.revert()
  }, [scopeRef, key])
}
