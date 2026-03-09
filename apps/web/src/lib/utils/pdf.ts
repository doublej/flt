import { type StoredItinerary, listItineraries } from '$lib/itinerary-store'
import type { Offer } from '$lib/types'
import { offerBookingUrls } from '$lib/utils/booking'
import { drawRouteMap } from '$lib/utils/pdf-map'
import type { BookingFilters, ProgramName } from '@flights/core/booking'
import { PROGRAM_LABELS, resolveIata } from '@flights/core/booking'
import { parsePrice } from '@flights/core/filter'

const TEXT = '#2a2a2a'
const MUTED = '#888888'
const ACCENT = '#2266cc'
const BORDER = '#e0e0e0'
const SURFACE = '#f5f5f5'
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
  const from = resolveIata(o.legs[0]?.departure_airport ?? '') ?? o.legs[0]?.departure_airport ?? '?'
  const to = resolveIata(o.legs[o.legs.length - 1]?.arrival_airport ?? '') ?? o.legs[o.legs.length - 1]?.arrival_airport ?? '?'
  return `${from} > ${to}`
}

function totalPrice(offers: Offer[]): string {
  const total = offers.reduce((sum, o) => sum + parsePrice(o.price), 0)
  const cur = (offers[0]?.price ?? '\u20AC0').replace(/[0-9.,\s]/g, '') || '\u20AC'
  return `${cur}${Math.round(total)}`
}

export async function generatePdf({ offers, filters }: PdfOpts): Promise<void> {
  const [{ jsPDF }, autoTable, fontData] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable').then((m) => m.default),
    loadFont(),
  ])

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  doc.addFileToVFS('DepartureMono.woff2', fontData)
  doc.addFont('DepartureMono.woff2', 'DepartureMono', 'normal')
  const FONT = 'DepartureMono'
  doc.setFont(FONT)

  // Page 1: overview
  let cy = 20
  doc.setFontSize(22)
  doc.setTextColor(TEXT)
  doc.text('Flight Search Results', W / 2, cy, { align: 'center' })
  cy += 7

  doc.setFontSize(9)
  doc.setTextColor(MUTED)
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`, W / 2, cy, {
    align: 'center',
  })
  cy += 5
  drawAccentLine(doc, W, cy)
  cy += 8

  const legs = uniqueLegs(offers)
  if (legs.length > 0) {
    const mapW = Math.min(240, W - MARGIN * 2)
    drawRouteMap(doc, legs, (W - mapW) / 2, cy, mapW, 50)
    cy += 56
  }

  const top = offers.slice(0, 15)
  if (top.length > 0) {
    autoTable(doc, {
      startY: cy,
      margin: { left: MARGIN, right: MARGIN },
      head: [['#', 'Price', 'Carrier', 'Route', 'Date', 'Dep > Arr', 'Duration', 'Stops']],
      body: top.map((o, i) => [
        String(i + 1),
        o.price,
        o.name,
        offerRoute(o),
        o.departure_date,
        `${o.departure} > ${o.arrival}`,
        o.duration,
        fmtStops(o.stops),
      ]),
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
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  autoTable: typeof import('jspdf-autotable').default,
  it: StoredItinerary,
  filters: BookingFilters | undefined,
  W: number,
  FONT: string,
): void {
  doc.addPage()

  let cy = 20
  doc.setFont(FONT)
  doc.setFontSize(16)
  doc.setTextColor(ACCENT)
  doc.text(it.name, W / 2, cy, { align: 'center' })
  cy += 5
  drawAccentLine(doc, W, cy)
  cy += 8

  const legs = uniqueLegs(it.legs)
  if (legs.length > 0) {
    const mapW = Math.min(200, W - MARGIN * 2)
    drawRouteMap(doc, legs, (W - mapW) / 2, cy, mapW, 42)
    cy += 48
  }

  autoTable(doc, {
    startY: cy,
    margin: { left: MARGIN, right: MARGIN },
    head: [['#', 'Price', 'Carrier', 'Route', 'Date', 'Dep \u2192 Arr', 'Duration', 'Stops']],
    body: it.legs.map((o, i) => [
      String(i + 1),
      o.price,
      o.name,
      offerRoute(o),
      o.departure_date,
      `${o.departure} > ${o.arrival}`,
      o.duration,
      fmtStops(o.stops),
    ]),
    ...tableTheme(FONT),
  })

  const lastY = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cy + 30
  let linkY = lastY + 6
  drawTotalBadge(doc, totalPrice(it.legs), MARGIN, linkY, FONT)
  linkY += 12

  doc.setFont(FONT)
  doc.setFontSize(8)
  doc.setTextColor(TEXT)
  doc.text('Booking Links', MARGIN, linkY)
  linkY += 5

  for (const offer of it.legs) {
    const urls = offerBookingUrls(offer, filters)
    if (!urls) continue
    const route = offerRoute(offer)
    for (const [program, url] of Object.entries(urls)) {
      const label = `${route}  -  ${PROGRAM_LABELS[program as ProgramName] ?? program}`
      doc.setTextColor(ACCENT)
      doc.setFontSize(7.5)
      doc.textWithLink(label, MARGIN + 2, linkY, { url })
      linkY += 4.5
    }
  }
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

function drawAccentLine(
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  W: number,
  y: number,
): void {
  doc.setDrawColor(ACCENT)
  doc.setLineWidth(0.6)
  doc.line(W / 2 - 25, y, W / 2 + 25, y)
}

function drawTotalBadge(
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  price: string,
  x: number,
  y: number,
  font: string,
): void {
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
