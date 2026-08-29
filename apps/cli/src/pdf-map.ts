import { getCoords, greatCirclePoints } from '@flights/core/coords'
import type jsPDF from 'jspdf'
import { cityName } from './pdf-summary'
import { WORLD_LAND } from './world-land'

interface Leg {
  departure_airport: string
  arrival_airport: string
}

export interface MapRoute {
  label: string
  color: string
  legs: Leg[]
}

/** One colour per option, so overlapping routes stay tellable apart. */
export const ROUTE_COLORS = ['#0b5563', '#a8600a', '#6b4d7d', '#2f6b3c']

const OCEAN = '#eef2f4'
const LAND = '#dde4e7'
const LAND_EDGE = '#ccd6da'
const MAP_BORDER = '#dfe3e8'
const DOT = '#14181f'
const LABEL = '#14181f'
const LEADER = '#8b98a0'

type Projection = (coord: [number, number]) => [number, number]

export function drawRouteMap(
  doc: jsPDF,
  routes: MapRoute[],
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const coords = new Map<string, [number, number]>()
  for (const route of routes) {
    for (const l of route.legs) {
      for (const iata of [l.departure_airport, l.arrival_airport]) {
        const c = getCoords(iata)
        if (c) coords.set(iata, c)
      }
    }
  }
  if (coords.size < 2) return

  const proj = buildProjection(coords, x, y, width, height)

  doc.setFillColor(OCEAN)
  doc.setDrawColor(MAP_BORDER)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, width, height, 3, 3, 'FD')

  drawLand(doc, proj, x, y, width, height)

  // Arcs, one colour per route. Drawn back to front and tapering, so routes
  // that share a leg stack as a thin line inside a wider band instead of one
  // colour hiding the others.
  for (const [i, route] of [...routes].entries().toArray().reverse()) {
    doc.setDrawColor(route.color)
    doc.setLineWidth(0.7 + i * 0.5)
    for (const leg of route.legs) {
      const from = coords.get(leg.departure_airport)
      const to = coords.get(leg.arrival_airport)
      if (!from || !to) continue
      const pts = greatCirclePoints(from, to, 40)
      for (let i = 1; i < pts.length; i++) {
        const [x1, y1] = proj(pts[i - 1])
        const [x2, y2] = proj(pts[i])
        if (!inside(x1, y1, x, y, width, height) || !inside(x2, y2, x, y, width, height)) continue
        doc.line(x1, y1, x2, y2)
      }
    }
  }

  drawAirportLabels(doc, coords, proj, x, y, width, height)
}

function inside(px: number, py: number, x: number, y: number, w: number, h: number): boolean {
  return px >= x && px <= x + w && py >= y && py <= y + h
}

/** Landmasses under the arcs, clipped to the map box. */
function drawLand(
  doc: jsPDF,
  proj: Projection,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  doc.setFillColor(LAND)
  doc.setDrawColor(LAND_EDGE)
  doc.setLineWidth(0.15)

  for (const ring of WORLD_LAND) {
    const projected = ring.map(([lon, lat]) => proj([lat, lon]))
    const clipped = clipPolygon(projected, x, y, x + width, y + height)
    if (clipped.length < 3) continue
    const [start, ...rest] = clipped
    doc.lines(
      rest.map(([px, py], i) => {
        const [prevX, prevY] = i === 0 ? start : rest[i - 1]
        return [px - prevX, py - prevY]
      }),
      start[0],
      start[1],
      [1, 1],
      'FD',
      true,
    )
  }
}

type Point = [number, number]

/**
 * Sutherland-Hodgman clip against the map rectangle. jsPDF's own clip() needs
 * an unpainted path, which rect() does not leave behind, so the polygons are
 * cut to size here instead of relying on the PDF graphics state.
 */
function clipPolygon(
  points: Point[],
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): Point[] {
  const edges: Array<[(p: Point) => boolean, (a: Point, b: Point) => Point]> = [
    [(p) => p[0] >= minX, (a, b) => lerpX(a, b, minX)],
    [(p) => p[0] <= maxX, (a, b) => lerpX(a, b, maxX)],
    [(p) => p[1] >= minY, (a, b) => lerpY(a, b, minY)],
    [(p) => p[1] <= maxY, (a, b) => lerpY(a, b, maxY)],
  ]

  let output = points
  for (const [keep, intersect] of edges) {
    const input = output
    output = []
    for (let i = 0; i < input.length; i++) {
      const curr = input[i]
      const prev = input[(i + input.length - 1) % input.length]
      const currIn = keep(curr)
      const prevIn = keep(prev)
      if (currIn) {
        if (!prevIn) output.push(intersect(prev, curr))
        output.push(curr)
      } else if (prevIn) {
        output.push(intersect(prev, curr))
      }
    }
    if (output.length === 0) return []
  }
  return output
}

function lerpX(a: Point, b: Point, x: number): Point {
  const t = (x - a[0]) / (b[0] - a[0] || 1)
  return [x, a[1] + t * (b[1] - a[1])]
}

function lerpY(a: Point, b: Point, y: number): Point {
  const t = (y - a[1]) / (b[1] - a[1] || 1)
  return [a[0] + t * (b[0] - a[0]), y]
}

type Box = [number, number, number, number]

function overlaps(a: Box, b: Box): boolean {
  return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]
}

function drawAirportLabels(
  doc: jsPDF,
  coords: Map<string, [number, number]>,
  proj: Projection,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  doc.setFontSize(6.5)

  const points = [...coords]
    .map(([iata, c]) => ({ iata, p: proj(c) }))
    .filter(({ p }) => inside(p[0], p[1], x, y, width, height))

  // Dots first, and they count as obstacles, so no label lands on the marker
  // of a neighbouring city.
  doc.setFillColor(DOT)
  const taken: Box[] = []
  for (const { p } of points) {
    doc.circle(p[0], p[1], 1.1, 'F')
    taken.push([p[0] - 1.4, p[1] - 1.4, p[0] + 1.4, p[1] + 1.4])
  }

  for (const { iata, p } of points) {
    const label = cityName(iata)
    const w = doc.getTextWidth(label)
    const spot = placeLabel(p, w, taken, x, y, width, height)
    taken.push(spot.box)

    // A label pushed clear of its dot gets a leader line, so which name
    // belongs to which city is never a guess.
    if (spot.distance > 5) {
      doc.setDrawColor(LEADER)
      doc.setLineWidth(0.2)
      doc.line(p[0], p[1], spot.anchor[0], spot.anchor[1])
    }
    doc.setTextColor(LABEL)
    doc.text(label, spot.x, spot.y, { align: spot.align })
  }
}

/**
 * First free spot around the dot: above, below, right, left, then stepping
 * further out above. Returns where to draw and how far that ended up.
 */
function placeLabel(
  p: [number, number],
  w: number,
  taken: Box[],
  bx: number,
  by: number,
  bw: number,
  bh: number,
): {
  x: number
  y: number
  align: 'center' | 'left' | 'right'
  box: Box
  anchor: [number, number]
  distance: number
} {
  const half = w / 2
  const candidates: Array<{ dx: number; dy: number; align: 'center' | 'left' | 'right' }> = [
    { dx: 0, dy: -3.4, align: 'center' },
    { dx: 0, dy: 4.8, align: 'center' },
    { dx: 3, dy: 1, align: 'left' },
    { dx: -3, dy: 1, align: 'right' },
  ]
  for (let step = 1; step <= 6; step++) {
    candidates.push({ dx: 0, dy: -3.4 - step * 3.6, align: 'center' })
    candidates.push({ dx: 0, dy: 4.8 + step * 3.6, align: 'center' })
  }

  for (const c of candidates) {
    const cx =
      c.align === 'center'
        ? Math.min(Math.max(p[0] + c.dx, bx + half + 1.5), bx + bw - half - 1.5)
        : p[0] + c.dx
    const cy = p[1] + c.dy
    const left = c.align === 'center' ? cx - half : c.align === 'left' ? cx : cx - w
    const box: Box = [left - 0.8, cy - 2.6, left + w + 0.8, cy + 1]
    if (box[0] < bx || box[2] > bx + bw || box[1] < by || box[3] > by + bh) continue
    if (taken.some((t) => overlaps(t, box))) continue
    const anchorY = c.dy < 0 ? box[3] : box[1]
    return {
      x: cx,
      y: cy,
      align: c.align,
      box,
      anchor: [(box[0] + box[2]) / 2, anchorY],
      distance: Math.abs(c.dy),
    }
  }
  const cy = Math.max(p[1] - 3.4, by + 3)
  const cx = Math.min(Math.max(p[0], bx + half + 1.5), bx + bw - half - 1.5)
  return {
    x: cx,
    y: cy,
    align: 'center',
    box: [cx - half, cy - 2.6, cx + half, cy + 1],
    anchor: [cx, cy + 1],
    distance: 0,
  }
}

/** Swatch-and-label key for the route colours. Returns the new y. */
export function drawRouteLegend(
  doc: jsPDF,
  routes: MapRoute[],
  x: number,
  y: number,
  maxW: number,
): number {
  doc.setFontSize(7)
  let lx = x
  let ly = y
  for (const route of routes) {
    const w = doc.getTextWidth(route.label) + 12
    if (lx > x && lx + w > x + maxW) {
      lx = x
      ly += 5
    }
    doc.setFillColor(route.color)
    doc.rect(lx, ly - 2.2, 5, 1.6, 'F')
    doc.setTextColor('#6b7280')
    doc.text(route.label, lx + 6.5, ly)
    lx += w
  }
  return ly + 4
}

/**
 * Equirectangular projection with one shared scale, so coastlines keep their
 * shape instead of being stretched to fill the box.
 */
function buildProjection(
  coords: Map<string, [number, number]>,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): Projection {
  const lats = [...coords.values()].map((c) => c[0])
  const lons = [...coords.values()].map((c) => c[1])
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2
  const midLon = (Math.min(...lons) + Math.max(...lons)) / 2
  const kx = Math.cos((midLat * Math.PI) / 180) || 1

  const spanX = Math.max((Math.max(...lons) - Math.min(...lons)) * kx, 8) * 1.35
  const spanY = Math.max(Math.max(...lats) - Math.min(...lats), 8) * 1.5
  const scale = Math.min(bw / spanX, bh / spanY)

  return ([lat, lon]) => [
    bx + bw / 2 + (lon - midLon) * kx * scale,
    by + bh / 2 - (lat - midLat) * scale,
  ]
}
