/** Compute points along a great circle arc between two lat/lon pairs */
export function greatCirclePoints(
  from: [number, number],
  to: [number, number],
  segments = 50,
): [number, number][] {
  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI

  const [lat1, lon1] = [toRad(from[0]), toRad(from[1])]
  const [lat2, lon2] = [toRad(to[0]), toRad(to[1])]

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat1 - lat2) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon1 - lon2) / 2) ** 2,
      ),
    )

  if (d < 1e-10) return [from, to]

  const points: [number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const f = i / segments
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2)
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2)
    const z = A * Math.sin(lat1) + B * Math.sin(lat2)
    points.push([toDeg(Math.atan2(z, Math.sqrt(x ** 2 + y ** 2))), toDeg(Math.atan2(y, x))])
  }
  return points
}
