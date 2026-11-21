// 12 accent colors that tell studios apart: the Figma library's "Identity Colors"
// (c01 = Identity-1/Primary ... c12 = Identity-12/Primary). Map pins use the matching
// marker silhouettes in src/assets/markers, which also carry each Hover shade.
// Color is never the only signal (pins also carry a category icon and a name).
export const ACCENTS = {
  c01: '#BF1E2E',
  c02: '#EC1B3B',
  c03: '#EF446B',
  c04: '#F1592A',
  c05: '#FCB040',
  c06: '#FFCF38',
  c07: '#0E733B',
  c08: '#098C43',
  c09: '#39B54A',
  c10: '#0489CC',
  c11: '#00AEEA',
  c12: '#94CEF0',
}

/** 1..12 for a valid accent key ("c01".."c12"), otherwise null. */
export function identityIndex(key) {
  return Object.hasOwn(ACCENTS, key ?? '') ? Number(key.slice(1)) : null
}

const DARK = '#111111'
const LIGHT = '#FFFFFF'

function luminance(hex) {
  const n = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Background and readable text color (at least 4.5:1 where possible) for a studio accent. */
export function accentFor(key) {
  const bg = ACCENTS[key] ?? '#6B6B6B'
  const fg = contrastRatio(bg, DARK) >= contrastRatio(bg, LIGHT) ? DARK : LIGHT
  return { bg, fg }
}
