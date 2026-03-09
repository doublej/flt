/**
 * Airport coordinates and geo utilities.
 *
 * Coordinates loaded from airport-coords.json (3,419 airports from OpenFlights + OurAirports).
 * To regenerate: cd packages/core/src/data && bun run generate.ts
 */

import coordData from './data/airport-coords.json'

const toRad = (d: number) => (d * Math.PI) / 180
const toDeg = (r: number) => (r * 180) / Math.PI

export const AIRPORT_COORDS = coordData as unknown as Record<string, [number, number]>

/** Look up [latitude, longitude] for an IATA airport code */
export function getCoords(iata: string): [number, number] | null {
  return AIRPORT_COORDS[iata.toUpperCase()] ?? null
}

/** Angular distance in radians between two [lat, lon] pairs (haversine formula) */
function angularDistance(a: [number, number], b: [number, number]): number {
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2
  return 2 * Math.asin(Math.sqrt(h))
}

/** Haversine distance in kilometers between two [lat, lon] pairs */
export function haversineKm(a: [number, number], b: [number, number]): number {
  return 6371 * angularDistance(a, b)
}

/** Compute points along a great circle arc between two lat/lon pairs */
export function greatCirclePoints(
  from: [number, number],
  to: [number, number],
  segments = 50,
): [number, number][] {
  const [lat1, lon1] = [toRad(from[0]), toRad(from[1])]
  const [lat2, lon2] = [toRad(to[0]), toRad(to[1])]
  const d = angularDistance(from, to)

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
