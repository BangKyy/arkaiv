// Image preparation for uploads: crop to the slot's shape, scale down, and compress in
// the browser before anything is sent, so uploads stay small on slow mobile connections.

/**
 * The two studio image slots. The profile shows the header full width at 320px tall
 * (160px on phones), so on screen it ranges from about 2.3:1 (tablet) to 6:1 (wide
 * desktop). A 4:1 image loses the least either way; `safe` is the centered share of
 * width and height that every screen shows. The logo slot is square (100 to 200px).
 */
export const IMAGE_SLOTS = {
  logo: { width: 800, height: 800, maxBytes: 200 * 1024 },
  cover: { width: 2400, height: 600, maxBytes: 500 * 1024, safe: { x: 0.58, y: 0.67 } },
}

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
/** Larger originals are refused before decoding (a phone photo is usually under 15 MB). */
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024

const QUALITIES = [0.86, 0.78, 0.7, 0.62, 0.54, 0.46]

async function decode(file) {
  if ('createImageBitmap' in window) {
    try {
      // Applies the photo's EXIF rotation in current browsers.
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // Fall through to <img> decoding.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** JPEG has no transparency, so a transparent logo is laid on paper instead of black. */
function paperBehind(ctx, canvas) {
  ctx.globalCompositeOperation = 'destination-over'
  ctx.fillStyle = '#f3f0e8'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalCompositeOperation = 'source-over'
}

const toBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality))

/**
 * Crops `file` to the slot's aspect ratio (centered), scales it down to at most the
 * slot's size (never up), and encodes WebP (JPEG where WebP encoding is missing),
 * lowering the quality, then the size, until it fits `maxBytes`.
 * Resolves to { blob, type, width, height, originalBytes }.
 */
export async function prepareImage(file, { width, height, maxBytes }) {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error('type')
  if (file.size > MAX_SOURCE_BYTES) throw new Error('size')

  const source = await decode(file)
  const sw = source.width
  const sh = source.height
  const ratio = width / height
  // The largest centered crop with the slot's shape.
  const cropW = Math.min(sw, sh * ratio)
  const cropH = cropW / ratio
  const fit = Math.min(1, width / cropW)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  let type = 'image/webp'
  let blob = null

  // Lower the quality first, then the size, until the file fits.
  for (const shrink of [1, 0.8, 0.64]) {
    canvas.width = Math.max(1, Math.round(cropW * fit * shrink))
    canvas.height = Math.max(1, Math.round(cropH * fit * shrink))
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(source, (sw - cropW) / 2, (sh - cropH) / 2, cropW, cropH, 0, 0, canvas.width, canvas.height)
    if (type === 'image/jpeg') paperBehind(ctx, canvas)
    for (const q of QUALITIES) {
      blob = await toBlob(canvas, type, q)
      if (blob && blob.type !== type) {
        // No WebP encoder (older Safari): fall back to JPEG for this and later passes.
        type = 'image/jpeg'
        paperBehind(ctx, canvas)
        blob = await toBlob(canvas, type, q)
      }
      if (blob && blob.size <= maxBytes) break
    }
    if (blob && blob.size <= maxBytes) break
  }
  source.close?.()
  if (!blob || blob.size > maxBytes) throw new Error('compress')

  return { blob, type, width: canvas.width, height: canvas.height, originalBytes: file.size }
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}
