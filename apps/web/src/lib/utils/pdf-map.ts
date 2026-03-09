import { getCoords, greatCirclePoints } from '@flights/core/coords'
import type jsPDF from 'jspdf'

interface Leg {
  departure_airport: string
  arrival_airport: string
}

const MAP_BG = '#f0f0f0'
const MAP_BORDER = '#e0e0e0'
const ARC = '#2266cc'
const DOT = '#2a2a2a'
const LABEL = '#2a2a2a'
const PAD = 0.12

export function drawRouteMap(
  doc: jsPDF,
  legs: Leg[],
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const airports = collectAirports(legs)
  if (airports.size < 2) return

  const coords = resolveCoords(airports)
  if (coords.size < 2) return

  const proj = buildProjection(coords, x, y, width, height)

  doc.setFillColor(MAP_BG)
  doc.setDrawColor(MAP_BORDER)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, width, height, 3, 3, 'FD')

  doc.setDrawColor(ARC)
  doc.setLineWidth(0.5)
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

  doc.setFontSize(7)
  doc.setTextColor(LABEL)
  for (const [iata, coord] of coords) {
    const [px, py] = proj(coord)
    doc.setFillColor(DOT)
    doc.circle(px, py, 1.2, 'F')
    doc.text(iata, px + 2.5, py - 1.5)
  }
}

function collectAirports(legs: Leg[]): Set<string> {
  const set = new Set<string>()
  for (const l of legs) {
    set.add(l.departure_airport)
    set.add(l.arrival_airport)
  }
  return set
}

function resolveCoords(airports: Set<string>): Map<string, [number, number]> {
  const map = new Map<string, [number, number]>()
  for (const iata of airports) {
    const c = getCoords(iata)
    if (c) map.set(iata, c)
  }
  return map
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
