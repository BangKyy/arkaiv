export const SNAPS = ['peek', 'half', 'full']

/** Visible bottom-sheet height in px for each snap point, given the explore area height. */
export function snapHeights(areaHeight) {
  return {
    peek: Math.max(140, Math.round(areaHeight * 0.3)),
    half: Math.round(areaHeight * 0.55),
    full: Math.round(areaHeight * 0.92),
  }
}
