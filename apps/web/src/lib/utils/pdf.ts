import { type StoredItinerary, listItineraries } from '$lib/itinerary-store'
import type { Offer } from '$lib/types'
import { offerBookingUrls } from '$lib/utils/booking'
import { drawRouteMap } from '$lib/utils/pdf-map'
import type { BookingFilters, ProgramName } from '@flights/core/booking'
import { PROGRAM_LABELS } from '@flights/core/booking'

// Colors matching app theme
const BG = '#0c0e14'
const SURFACE = '#161b22'
const TEXT = '#e6edf3'
const MUTED = '#7d8590'
const AMBER = '#f0a030'

interface PdfOpts {
  offers: Offer[]
  filters?: BookingFilters
}

let fontCache: string | null = null

async function loadFont(): Promise<string> {
  if (fontCache) return fontCache
  const res = await fetch('/fonts/DepartureMono-Regular.woff2')
  const buf = await res.arrayBuffer()
  // jsPDF needs base64
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

export async function generatePdf({ offers, filters }: PdfOpts): Promise<void> {
  const [{ jsPDF }, autoTable, fontData] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable').then((m) => m.default),
    loadFont(),
  ])

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  // Embed font
  doc.addFileToVFS('DepartureMono.woff2', fontData)
  doc.addFont('DepartureMono.woff2', 'DepartureMono', 'normal')
  doc.setFont('DepartureMono')

  // Page 1 background
  fillPage(doc, W, H)

  // Header
  let cy = 14
  doc.setFontSize(18)
  doc.setTextColor(AMBER)
  doc.text('FLIGHT SEARCH RESULTS', W / 2, cy, { align: 'center' })

  cy += 6
  doc.setFontSize(9)
  doc.setTextColor(MUTED)
  doc.text(new Date().toLocaleDateString('en-US', { dateStyle: 'long' }), W / 2, cy, {
    align: 'center',
  })
  cy += 6

  // Route map
  const legs = uniqueLegs(offers)
  if (legs.length > 0) {
    const mapW = Math.min(240, W - 20)
    const mapX = (W - mapW) / 2
    drawRouteMap(doc, legs, mapX, cy, mapW, 55)
    cy += 60
  }

  // Flights table (top 15)
  const top = offers.slice(0, 15)
  const tableBody = top.map((o, i) => [
    String(i + 1),
    o.price,
    o.name,
    `${o.legs[0]?.departure_airport ?? '?'} → ${o.legs[o.legs.length - 1]?.arrival_airport ?? '?'}`,
    o.departure_date,
    `${o.departure} → ${o.arrival}`,
    o.duration,
    fmtStops(o.stops),
  ])

  autoTable(doc, {
    startY: cy,
    margin: { left: 10, right: 10 },
    head: [['#', 'Price', 'Carrier', 'Route', 'Date', 'Dep → Arr', 'Duration', 'Stops']],
    body: tableBody,
    styles: {
      font: 'DepartureMono',
      fontSize: 7,
      textColor: TEXT,
      fillColor: BG,
      lineColor: '#2d333b',
      lineWidth: 0.2,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: SURFACE,
      textColor: AMBER,
      fontSize: 7,
      fontStyle: 'normal',
    },
    alternateRowStyles: { fillColor: SURFACE },
    theme: 'grid',
  })

  // Itineraries
  const itineraries = listItineraries().filter((it) => it.legs.length > 0)
  if (itineraries.length > 0) {
    for (const it of itineraries) {
      renderItinerary(doc, autoTable, it, filters, W, H)
    }
  }

  // Download
  const now = new Date()
  const ts = `${now.toISOString().slice(0, 10)}-${pad2(now.getHours())}${pad2(now.getMinutes())}`
  doc.save(`flights-${ts}.pdf`)
}

function renderItinerary(
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  autoTable: typeof import('jspdf-autotable').default,
  it: StoredItinerary,
  filters: BookingFilters | undefined,
  W: number,
  H: number,
): void {
  doc.addPage()
  fillPage(doc, W, H)

  let cy = 14
  doc.setFont('DepartureMono')
  doc.setFontSize(14)
  doc.setTextColor(AMBER)
  doc.text(it.name.toUpperCase(), W / 2, cy, { align: 'center' })
  cy += 8

  // Mini route map
  const legs = uniqueLegs(it.legs)
  if (legs.length > 0) {
    const mapW = Math.min(200, W - 20)
    drawRouteMap(doc, legs, (W - mapW) / 2, cy, mapW, 45)
    cy += 50
  }

  // Legs table
  const body = it.legs.map((o, i) => [
    String(i + 1),
    o.price,
    o.name,
    `${o.legs[0]?.departure_airport ?? '?'} → ${o.legs[o.legs.length - 1]?.arrival_airport ?? '?'}`,
    o.departure_date,
    `${o.departure} → ${o.arrival}`,
    o.duration,
    fmtStops(o.stops),
  ])

  autoTable(doc, {
    startY: cy,
    margin: { left: 10, right: 10 },
    head: [['#', 'Price', 'Carrier', 'Route', 'Date', 'Dep → Arr', 'Duration', 'Stops']],
    body,
    styles: {
      font: 'DepartureMono',
      fontSize: 7,
      textColor: TEXT,
      fillColor: BG,
      lineColor: '#2d333b',
      lineWidth: 0.2,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: SURFACE,
      textColor: AMBER,
      fontSize: 7,
      fontStyle: 'normal',
    },
    alternateRowStyles: { fillColor: SURFACE },
    theme: 'grid',
  })

  // Booking links
  const lastY = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cy + 30
  let linkY = lastY + 8
  doc.setFontSize(8)
  doc.setTextColor(MUTED)
  doc.text('BOOKING LINKS', 10, linkY)
  linkY += 5

  for (const offer of it.legs) {
    const urls = offerBookingUrls(offer, filters)
    if (!urls) continue
    const route = `${offer.legs[0]?.departure_airport ?? '?'} → ${offer.legs[offer.legs.length - 1]?.arrival_airport ?? '?'}`
    for (const [program, url] of Object.entries(urls)) {
      const label = `${route} — ${PROGRAM_LABELS[program as ProgramName] ?? program}`
      doc.setTextColor(AMBER)
      doc.textWithLink(label, 10, linkY, { url })
      linkY += 4.5
    }
  }
}

function fillPage(doc: InstanceType<typeof import('jspdf').jsPDF>, W: number, H: number): void {
  doc.setFillColor(BG)
  doc.rect(0, 0, W, H, 'F')
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}
