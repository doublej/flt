import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  type AffiliateConfig,
  type BookingFilters,
  type Itinerary,
  type Offer,
  PROGRAM_LABELS,
  type ProgramName,
  type SearchEntry,
  buildBookingUrls,
  parsePrice,
  resolveIata,
} from '@flights/core'
import { drawRouteMap } from './pdf-map'

const TEXT = '#2a2a2a'
const MUTED = '#888888'
const ACCENT = '#2266cc'
const BORDER = '#e0e0e0'
const SURFACE = '#f5f5f5'
const FONT = 'helvetica'
const MARGIN = 15

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

interface PdfOpts {
  searches: Array<[string, SearchEntry]>
  itineraries: Itinerary[]
  affiliate: AffiliateConfig | null
  title?: string
  filters?: BookingFilters
}

export async function generatePdf(opts: PdfOpts): Promise<Buffer> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  // Page 1: overview
  let cy = 20
  doc.setFont(FONT, 'bold')
  doc.setFontSize(22)
  doc.setTextColor(TEXT)
  doc.text(opts.title ?? 'Flight Search Results', W / 2, cy, { align: 'center' })
  cy += 7

  doc.setFont(FONT, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED)
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`, W / 2, cy, {
    align: 'center',
  })
  cy += 5
  drawAccentLine(doc, W, cy)
  cy += 8

  const allOffers = opts.searches.flatMap(([, e]) => e.offers)

  const legs = uniqueLegs(allOffers)
  if (legs.length > 0) {
    const mapW = Math.min(240, W - MARGIN * 2)
    drawRouteMap(doc, legs, (W - mapW) / 2, cy, mapW, 50)
    cy += 56
  }

  const top = allOffers.slice(0, 15)
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
      ...tableTheme(),
    })
  }

  for (const itin of opts.itineraries) {
    renderItinerary(doc, itin, opts.affiliate, opts.filters, W)
  }

  return Buffer.from(doc.output('arraybuffer'))
}

function renderItinerary(
  doc: jsPDF,
  it: Itinerary,
  affiliate: AffiliateConfig | null,
  filters: BookingFilters | undefined,
  W: number,
): void {
  doc.addPage()

  let cy = 20
  doc.setFont(FONT, 'bold')
  doc.setFontSize(16)
  doc.setTextColor(ACCENT)
  doc.text(it.title, W / 2, cy, { align: 'center' })
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
    ...tableTheme(),
  })

  const lastY = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cy + 30
  let linkY = lastY + 6
  drawTotalBadge(doc, totalPrice(it.legs), MARGIN, linkY)
  linkY += 12

  if (it.note) {
    doc.setFont(FONT, 'italic')
    doc.setFontSize(8)
    doc.setTextColor(MUTED)
    doc.text(it.note, MARGIN, linkY)
    linkY += 6
  }

  const hasLinks = it.legs.some(
    (o) => buildOfferBookingUrls(o, affiliate, it.filters ?? filters) !== null,
  )
  if (!hasLinks) return

  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.setTextColor(TEXT)
  doc.text('Booking Links', MARGIN, linkY)
  linkY += 5

  doc.setFont(FONT, 'normal')
  for (const offer of it.legs) {
    const urls = buildOfferBookingUrls(offer, affiliate, it.filters ?? filters)
    if (!urls) continue
    for (const [program, url] of Object.entries(urls)) {
      const label = `${offerRoute(offer)}  -  ${PROGRAM_LABELS[program as ProgramName] ?? program}`
      doc.setTextColor(ACCENT)
      doc.setFontSize(7.5)
      doc.textWithLink(label, MARGIN + 2, linkY, { url })
      linkY += 4.5
    }
  }
}

function buildOfferBookingUrls(
  offer: Offer,
  affiliate: AffiliateConfig | null,
  filters?: BookingFilters,
): Record<ProgramName, string> | null {
  if (!affiliate) return null
  const from = resolveIata(offer.legs[0]?.departure_airport ?? '')
  const to = resolveIata(offer.legs[offer.legs.length - 1]?.arrival_airport ?? '')
  if (!from || !to) return null
  return buildBookingUrls(
    affiliate,
    {
      from_airport: from,
      to_airport: to,
      date: offer.departure_date,
      return_date: offer.return_date ?? undefined,
    },
    filters,
  )
}

function tableTheme() {
  return {
    styles: {
      font: FONT,
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
      fontStyle: 'bold' as const,
    },
    alternateRowStyles: { fillColor: SURFACE },
    theme: 'grid' as const,
  }
}

function drawAccentLine(doc: jsPDF, W: number, y: number): void {
  doc.setDrawColor(ACCENT)
  doc.setLineWidth(0.6)
  doc.line(W / 2 - 25, y, W / 2 + 25, y)
}

function drawTotalBadge(doc: jsPDF, price: string, x: number, y: number): void {
  const label = `Total: ${price}`
  doc.setFont(FONT, 'bold')
  doc.setFontSize(10)
  const tw = doc.getTextWidth(label) + 12
  doc.setFillColor(ACCENT)
  doc.roundedRect(x, y - 5, tw, 8, 2, 2, 'F')
  doc.setTextColor('#ffffff')
  doc.text(label, x + 6, y + 0.5)
}
