import type jsPDF from 'jspdf'
import { getCoords, greatCirclePoints } from '@flights/core/coords'

interface Leg {
  departure_airport: string
  arrival_airport: string
}

const BG = '#0c0e14'
const ARC = '#f0a030'
const DOT = '#f0a030'
const LABEL = '#e6edf3'
const PAD = 0.12

export function drawRouteMap(
  doc: jsPDF,
  legs: Leg[],
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const airports = new Set<string>()
  for (const l of legs) {
    airports.add(l.departure_airport)
    airports.add(l.arrival_airport)
  }
  if (airports.size < 2) return

  const coords = new Map<string, [number, number]>()
  for (const iata of airports) {
    const c = getCoords(iata)
    if (c) coords.set(iata, c)
  }
  if (coords.size < 2) return

  const proj = buildProjection(coords, x, y, width, height)

  doc.setFillColor(BG)
  doc.roundedRect(x, y, width, height, 2, 2, 'F')

  doc.setDrawColor(ARC)
  doc.setLineWidth(0.4)
  for (const leg of legs) {
    const from = coords.get(leg.departure_airport)
    const to = coords.get(leg.arrival_airport)
    if (!from || !to) continue
    const pts = greatCirclePoints(from, to, 40)
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = proj(pts[i - 1])
      const [x2, y2] = proj(pts[i])
      doc.line(x1, y1, x2, y2)
    }
  }

  doc.setFontSize(6)
  doc.setTextColor(LABEL)
  for (const [iata, coord] of coords) {
    const [px, py] = proj(coord)
    doc.setFillColor(DOT)
    doc.circle(px, py, 1.2, 'F')
    doc.text(iata, px + 2, py - 1.5)
  }
}

function buildProjection(
  coords: Map<string, [number, number]>,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): (coord: [number, number]) => [number, number] {
  const lats = [...coords.values()].map((c) => c[0])
  const lons = [...coords.values()].map((c) => c[1])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)

  const padX = (maxLon - minLon) * PAD || 10
  const padY = (maxLat - minLat) * PAD || 5
  const lo = minLon - padX
  const hi = maxLon + padX
  const la = minLat - padY
  const ha = maxLat + padY
  const rangeX = hi - lo || 1
  const rangeY = ha - la || 1

  return ([lat, lon]) => [bx + ((lon - lo) / rangeX) * bw, by + ((ha - lat) / rangeY) * bh]
}
