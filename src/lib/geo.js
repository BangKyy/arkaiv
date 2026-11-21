// Small geometry helpers, shared by the app and the data-check script.

/** Ray-casting point-in-polygon for a GeoJSON Polygon (outer ring only). */
export function pointInPolygon([x, y], polygon) {
  const ring = polygon.coordinates[0]
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Derive the wilayah id from coordinates (PRD section 8: "derive from coordinates"). */
export function areaForPoint(lng, lat, boundaries) {
  const hit = boundaries.features.find((f) => pointInPolygon([lng, lat], f.geometry))
  return hit?.properties.id ?? null
}

export function boundsOf(points) {
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const [x, y] of points) {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  return [
    [minX, minY],
    [maxX, maxY],
  ]
}
