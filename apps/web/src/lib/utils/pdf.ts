import { type StoredItinerary, listItineraries } from '$lib/itinerary-store'
import type { Offer } from '$lib/types'
import { offerBookingUrls } from '$lib/utils/booking'
import { drawRouteMap } from '$lib/utils/pdf-map'
import type { BookingFilters, ProgramName } from '@flights/core/booking'
import { PROGRAM_LABELS, resolveIata } from '@flights/core/booking'
import { parsePrice } from '@flights/core/filter'
import { checkConnections, totalTravelTime } from '@flights/core/itinerary'

const TEXT = '#2a2a2a'
const MUTED = '#888888'
const ACCENT = '#2266cc'
const BORDER = '#e0e0e0'
const SURFACE = '#f5f5f5'
const WARN = '#cc6600'
const MARGIN = 15

interface PdfOpts {
  offers: Offer[]
  filters?: BookingFilters
}

let fontCache: string | null = null

async function loadFont(): Promise<string> {
  if (fontCache) return fontCache
  const res = await fetch('/fonts/DepartureMono-Regular.woff2')
  const buf = await res.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  fontCache = btoa(binary)
  return fontCache
}

function fmtStops(n: number): string {
  if (n === 0) return 'Nonstop'
  return `${n} stop${n > 1 ? 's' : ''}`
}

function fmtMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  return h ? `${h}h` : `${m}m`
}

function uniqueLegs(offers: Offer[]) {
  const seen = new Set<string>()
  return offers.flatMap((o) =>
    o.legs.filter((l) => {
      const key = `${l.departure_airport}-${l.arrival_airport}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }),
  )
}

function offerRoute(o: Offer): string {
  const from =
    resolveIata(o.legs[0]?.departure_airport ?? '') ?? o.legs[0]?.departure_airport ?? '?'
  const to =
    resolveIata(o.legs[o.legs.length - 1]?.arrival_airport ?? '') ??
    o.legs[o.legs.length - 1]?.arrival_airport ??
    '?'
  return `${from} > ${to}`
}

function legRoute(o: Offer): string {
  if (o.legs.length === 0) return '?→?'
  const codes = [o.legs[0].departure_airport]
  for (const leg of o.legs) codes.push(leg.arrival_airport)
  return codes.filter((c, i) => i === 0 || c !== codes[i - 1]).join('→')
}

function totalPrice(offers: Offer[]): string {
  const total = offers.reduce((sum, o) => sum + parsePrice(o.price), 0)
  const cur = (offers[0]?.price ?? '\u20AC0').replace(/[0-9.,\s]/g, '') || '\u20AC'
  return `${cur}${Math.round(total)}`
}

type Doc = InstanceType<typeof import('jspdf').jsPDF>
type AutoTable = typeof import('jspdf-autotable').default

function lastTableY(doc: Doc, fallback: number): number {
  return (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback
}

/** Render text at a font size that fits within maxW, centered at cx */
function fitText(
  doc: Doc,
  text: string,
  cx: number,
  y: number,
  maxW: number,
  maxSize: number,
): void {
  let size = maxSize
  doc.setFontSize(size)
  while (doc.getTextWidth(text) > maxW && size > 8) {
    size -= 1
    doc.setFontSize(size)
  }
  doc.text(text, cx, y, { align: 'center' })
}

/** Render wrapped text lines, return new y position */
function wrappedText(doc: Doc, text: string, x: number, y: number, maxW: number): number {
  let pos = y
  const lines: string[] = doc.splitTextToSize(text, maxW)
  for (const line of lines) {
    doc.text(line, x, pos)
    pos += 4
  }
  return pos
}

export async function generatePdf({ offers, filters }: PdfOpts): Promise<void> {
  const [{ jsPDF }, autoTable, fontData] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable').then((m) => m.default),
    loadFont(),
  ])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  doc.addFileToVFS('DepartureMono.woff2', fontData)
  doc.addFont('DepartureMono.woff2', 'DepartureMono', 'normal')
  const FONT = 'DepartureMono'
  doc.setFont(FONT)

  const usable = W - MARGIN * 2

  // Page 1: overview
  let cy = 20
  doc.setTextColor(TEXT)
  fitText(doc, 'Flight Search Results', W / 2, cy, usable, 22)
  cy += 7

  doc.setFontSize(9)
  doc.setTextColor(MUTED)
  doc.text(
    `Generated ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`,
    W / 2,
    cy,
    {
      align: 'center',
    },
  )
  cy += 5
  drawAccentLine(doc, W, cy)
  cy += 8

  const legs = uniqueLegs(offers)
  if (legs.length >= 2 && legs.length <= 15) {
    const mapW = Math.min(130, usable)
    drawRouteMap(doc, legs, (W - mapW) / 2, cy, mapW, 35)
    cy += 41
  }

  // Offers table (top 10)
  const top = offers.slice(0, 10)
  if (top.length > 0) {
    autoTable(doc, {
      startY: cy,
      margin: { left: MARGIN, right: MARGIN },
      head: [['ID', 'Price', 'Stops', 'Duration', 'Carrier', 'Date', 'Dep→Arr']],
      body: top.map((o) => {
        const arr = `${o.arrival}${o.arrival_time_ahead}`
        return [
          o.id,
          o.price,
          fmtStops(o.stops),
          o.duration,
          o.name,
          o.departure_date,
          `${o.departure}→${arr}`,
        ]
      }),
      ...tableTheme(FONT),
    })
  }

  // Itineraries
  const itineraries = listItineraries().filter((it) => it.legs.length > 0)
  for (const it of itineraries) {
    renderItinerary(doc, autoTable, it, filters, W, FONT)
  }

  const now = new Date()
  const ts = `${now.toISOString().slice(0, 10)}-${pad2(now.getHours())}${pad2(now.getMinutes())}`
  doc.save(`flights-${ts}.pdf`)
}

function renderItinerary(
  doc: Doc,
  autoTable: AutoTable,
  it: StoredItinerary,
  filters: BookingFilters | undefined,
  W: number,
  FONT: string,
): void {
  doc.addPage()

  const usable = W - MARGIN * 2
  let cy = 20
  doc.setFont(FONT)
  doc.setTextColor(ACCENT)
  fitText(doc, it.name, W / 2, cy, usable, 16)
  cy += 5
  drawAccentLine(doc, W, cy)
  cy += 8

  const legs = uniqueLegs(it.legs)
  if (legs.length > 0) {
    const mapW = Math.min(100, W - MARGIN * 2)
    drawRouteMap(doc, legs, (W - mapW) / 2, cy, mapW, 30)
    cy += 36
  }

  // Detailed booking blocks
  for (const [i, offer] of it.legs.entries()) {
    cy = renderBookingBlock(doc, autoTable, offer, i + 1, filters, W, FONT, cy)
  }

  // Connection warnings
  const warnings = checkConnections(it.legs)
  if (warnings.length > 0) {
    doc.setFont(FONT)
    doc.setFontSize(7.5)
    doc.setTextColor(WARN)
    for (const w of warnings) {
      doc.text(w, MARGIN, cy)
      cy += 4
    }
    cy += 2
  }

  // Total travel time
  const ttt = totalTravelTime(it.legs)
  if (ttt) {
    doc.setFont(FONT)
    doc.setFontSize(8)
    doc.setTextColor(MUTED)
    doc.text(`Total travel time: ${ttt}`, MARGIN, cy)
    cy += 6
  }

  // Total price badge
  drawTotalBadge(doc, totalPrice(it.legs), MARGIN, cy, FONT)
}

function buildLegTableBody(offer: Offer) {
  type Cell = string | { content: string; styles: object }
  const body: Cell[][] = []
  for (const [j, leg] of offer.legs.entries()) {
    const flt = leg.flight_number ? `${leg.airline} ${leg.flight_number}` : leg.airline_name
    body.push([
      flt,
      `${leg.departure_airport}→${leg.arrival_airport}`,
      leg.departure_time,
      leg.arrival_time,
      fmtMinutes(leg.duration),
      leg.aircraft || '—',
    ])
    if (j < offer.layovers.length) {
      const lo = offer.layovers[j]
      const s = { textColor: MUTED }
      body.push([
        { content: '', styles: s },
        { content: `${lo.airport} layover`, styles: s },
        { content: '', styles: s },
        { content: '', styles: s },
        { content: fmtMinutes(lo.duration), styles: s },
        { content: '', styles: s },
      ])
    }
  }
  return body
}

function renderBookingBlock(
  doc: Doc,
  autoTable: AutoTable,
  offer: Offer,
  idx: number,
  filters: BookingFilters | undefined,
  W: number,
  FONT: string,
  startY: number,
): number {
  const usable = W - MARGIN * 2
  let y = startY
  const arr = `${offer.arrival}${offer.arrival_time_ahead}`
  const summary = `Booking ${idx} · ${offer.departure_date} · ${legRoute(offer)} · ${offer.price} · ${offer.duration} · ${fmtStops(offer.stops)} · ${offer.name} · ${offer.departure}→${arr}`

  doc.setFont(FONT)
  doc.setFontSize(8)
  doc.setTextColor(TEXT)
  y = wrappedText(doc, summary, MARGIN, y, usable)
  y += 1

  if (offer.legs.length > 1 || offer.layovers.length > 0) {
    const theme = tableTheme(FONT)
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN + 4, right: MARGIN },
      head: [['Flight', 'Route', 'Dep', 'Arr', 'Duration', 'Aircraft']],
      body: buildLegTableBody(offer),
      ...theme,
      styles: { ...theme.styles, fontSize: 7 },
      headStyles: { ...theme.headStyles, fontSize: 7 },
    })
    y = lastTableY(doc, y + 20) + 3
  }

  const urls = offerBookingUrls(offer, filters)
  if (urls) {
    for (const [program, url] of Object.entries(urls)) {
      doc.setTextColor(ACCENT)
      doc.setFontSize(7)
      doc.textWithLink(
        `Book: ${PROGRAM_LABELS[program as ProgramName] ?? program}`,
        MARGIN + 4,
        y,
        { url },
      )
      y += 4
    }
  }

  return y + 3
}

function tableTheme(font: string) {
  return {
    styles: {
      font,
      fontSize: 8,
      textColor: TEXT,
      fillColor: '#ffffff',
      lineColor: BORDER,
      lineWidth: 0.15,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: ACCENT,
      textColor: '#ffffff',
      fontSize: 8,
      fontStyle: 'normal' as const,
    },
    alternateRowStyles: { fillColor: SURFACE },
    theme: 'grid' as const,
  }
}

function drawAccentLine(doc: Doc, W: number, y: number): void {
  doc.setDrawColor(ACCENT)
  doc.setLineWidth(0.6)
  doc.line(W / 2 - 25, y, W / 2 + 25, y)
}

function drawTotalBadge(doc: Doc, price: string, x: number, y: number, font: string): void {
  const label = `Total: ${price}`
  doc.setFont(font)
  doc.setFontSize(10)
  const tw = doc.getTextWidth(label) + 12
  doc.setFillColor(ACCENT)
  doc.roundedRect(x, y - 5, tw, 8, 2, 2, 'F')
  doc.setTextColor('#ffffff')
  doc.text(label, x + 6, y + 0.5)
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}
