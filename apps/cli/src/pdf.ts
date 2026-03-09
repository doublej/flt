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
  resolveIata,
} from '@flights/core'
import { drawRouteMap } from './pdf-map'

const BG = '#0c0e14'
const SURFACE = '#161b22'
const TEXT = '#e6edf3'
const MUTED = '#7d8590'
const AMBER = '#f0a030'
const FONT = 'courier'

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
  const from = o.legs[0]?.departure_airport ?? '?'
  const to = o.legs[o.legs.length - 1]?.arrival_airport ?? '?'
  return `${from} > ${to}`
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

  doc.setFont(FONT)
  fillPage(doc, W, H)

  // Header
  let cy = 14
  doc.setFontSize(18)
  doc.setTextColor(AMBER)
  doc.text(opts.title ?? 'FLIGHT SEARCH RESULTS', W / 2, cy, { align: 'center' })
  cy += 6
  doc.setFontSize(9)
  doc.setTextColor(MUTED)
  doc.text(new Date().toLocaleDateString('en-US', { dateStyle: 'long' }), W / 2, cy, {
    align: 'center',
  })
  cy += 6

  // Collect all offers for page 1 map + table
  const allOffers = opts.searches.flatMap(([, e]) => e.offers)

  // Route map
  const legs = uniqueLegs(allOffers)
  if (legs.length > 0) {
    const mapW = Math.min(240, W - 20)
    drawRouteMap(doc, legs, (W - mapW) / 2, cy, mapW, 55)
    cy += 60
  }

  // Flights table (top 15)
  const top = allOffers.slice(0, 15)
  if (top.length > 0) {
    autoTable(doc, {
      startY: cy,
      margin: { left: 10, right: 10 },
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

  // Itineraries
  for (const itin of opts.itineraries) {
    renderItinerary(doc, itin, opts.affiliate, opts.filters, W, H)
  }

  return Buffer.from(doc.output('arraybuffer'))
}

function renderItinerary(
  doc: jsPDF,
  it: Itinerary,
  affiliate: AffiliateConfig | null,
  filters: BookingFilters | undefined,
  W: number,
  H: number,
): void {
  doc.addPage()
  fillPage(doc, W, H)

  let cy = 14
  doc.setFont(FONT)
  doc.setFontSize(14)
  doc.setTextColor(AMBER)
  doc.text(it.title.toUpperCase(), W / 2, cy, { align: 'center' })
  cy += 8

  const legs = uniqueLegs(it.legs)
  if (legs.length > 0) {
    const mapW = Math.min(200, W - 20)
    drawRouteMap(doc, legs, (W - mapW) / 2, cy, mapW, 45)
    cy += 50
  }

  autoTable(doc, {
    startY: cy,
    margin: { left: 10, right: 10 },
    head: [['#', 'Price', 'Carrier', 'Route', 'Date', 'Dep > Arr', 'Duration', 'Stops']],
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

  // Booking links
  const lastY = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cy + 30
  let linkY = lastY + 8
  doc.setFontSize(8)
  doc.setTextColor(MUTED)
  doc.text('BOOKING LINKS', 10, linkY)
  linkY += 5

  for (const offer of it.legs) {
    const urls = buildOfferBookingUrls(offer, affiliate, it.filters ?? filters)
    if (!urls) continue
    for (const [program, url] of Object.entries(urls)) {
      const label = `${offerRoute(offer)} - ${PROGRAM_LABELS[program as ProgramName] ?? program}`
      doc.setTextColor(AMBER)
      doc.textWithLink(label, 10, linkY, { url })
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
      fontStyle: 'normal' as const,
    },
    alternateRowStyles: { fillColor: SURFACE },
    theme: 'grid' as const,
  }
}

function fillPage(doc: jsPDF, W: number, H: number): void {
  doc.setFillColor(BG)
  doc.rect(0, 0, W, H, 'F')
}
