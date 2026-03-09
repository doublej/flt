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
import { checkConnections, totalTravelTime } from '@flights/core/itinerary'
import { drawRouteMap } from './pdf-map'

const TEXT = '#2a2a2a'
const MUTED = '#888888'
const ACCENT = '#2266cc'
const BORDER = '#e0e0e0'
const SURFACE = '#f5f5f5'
const WARN = '#cc6600'
const FONT = 'helvetica'
const MARGIN = 15

/** Replace unicode chars that jsPDF's built-in helvetica can't render */
function safe(s: string): string {
  return s.replace(/\u2192/g, '>').replace(/\u2014/g, '-').replace(/\u00B7/g, '-')
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
  const from = resolveIata(o.legs[0]?.departure_airport ?? '') ?? o.legs[0]?.departure_airport ?? '?'
  const to =
    resolveIata(o.legs[o.legs.length - 1]?.arrival_airport ?? '') ??
    o.legs[o.legs.length - 1]?.arrival_airport ??
    '?'
  return `${from} > ${to}`
}

function legRoute(o: Offer): string {
  if (o.legs.length === 0) return '? > ?'
  const codes = [o.legs[0].departure_airport]
  for (const leg of o.legs) codes.push(leg.arrival_airport)
  return codes.filter((c, i) => i === 0 || c !== codes[i - 1]).join(' > ')
}

function totalPrice(offers: Offer[]): string {
  const total = offers.reduce((sum, o) => sum + parsePrice(o.price), 0)
  const cur = (offers[0]?.price ?? 'EUR0').replace(/[0-9.,\s]/g, '') || 'EUR'
  return `${cur}${Math.round(total)}`
}

/** Turn "IAO-MNL@20260319#D53FF1" into "IAO > MNL - Mar 19" */
function formatSearchHeading(tag: string, entry: SearchEntry): string {
  const match = tag.match(/^([A-Z]{3})-([A-Z]{3})@(\d{4})(\d{2})(\d{2})/)
  if (!match) return entry.query
  const [, from, to, y, m, d] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  const fmt = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${from} > ${to} - ${fmt}`
}

function lastTableY(doc: jsPDF, fallback: number): number {
  return (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback
}

/** Render text at a font size that fits within maxW, centered at cx */
function fitText(doc: jsPDF, text: string, cx: number, y: number, maxW: number, maxSize: number): void {
  let size = maxSize
  doc.setFontSize(size)
  while (doc.getTextWidth(text) > maxW && size > 8) {
    size -= 1
    doc.setFontSize(size)
  }
  doc.text(text, cx, y, { align: 'center' })
}

/** Render wrapped text lines, return new y position */
function wrappedText(doc: jsPDF, text: string, x: number, y: number, maxW: number): number {
  const lines: string[] = doc.splitTextToSize(text, maxW)
  for (const line of lines) {
    doc.text(line, x, y)
    y += 4
  }
  return y
}

interface PdfOpts {
  searches: Array<[string, SearchEntry]>
  itineraries: Itinerary[]
  affiliate: AffiliateConfig | null
  title?: string
  filters?: BookingFilters
}

export async function generatePdf(opts: PdfOpts): Promise<Buffer> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const usable = W - MARGIN * 2

  // Page 1: overview
  let cy = 20
  doc.setFont(FONT, 'bold')
  doc.setTextColor(TEXT)
  fitText(doc, safe(opts.title ?? 'Flight Search Results'), W / 2, cy, usable, 22)
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
  const allItinLegs = opts.itineraries.flatMap((it) => it.legs)
  const mapOffers = allOffers.length > 0 ? allOffers : allItinLegs
  const legs = uniqueLegs(mapOffers)
  // Only draw map if readable (<= 15 unique airports)
  if (legs.length >= 2 && legs.length <= 15) {
    const mapW = Math.min(130, usable)
    drawRouteMap(doc, legs, (W - mapW) / 2, cy, mapW, 35)
    cy += 41
  }

  // Per-search sections (fewer rows per table when many searches)
  const rowLimit = opts.searches.length > 5 ? 5 : 10
  for (const [tag, entry] of opts.searches) {
    cy = renderSearchSection(doc, tag, entry, opts.affiliate, opts.filters, W, cy, rowLimit)
  }

  // Itinerary summary on page 1 if no searches
  if (opts.searches.length === 0 && opts.itineraries.length > 0) {
    for (const itin of opts.itineraries) {
      doc.setFont(FONT, 'bold')
      doc.setFontSize(9)
      doc.setTextColor(TEXT)
      doc.text(safe(itin.title), MARGIN, cy)
      doc.setFont(FONT, 'normal')
      doc.setFontSize(8)
      doc.setTextColor(MUTED)
      const info = `${itin.legs.length} legs - ${totalPrice(itin.legs)}`
      doc.text(info, MARGIN, cy + 4)
      cy += 10
    }
  }

  // Itinerary detail pages
  for (const itin of opts.itineraries) {
    renderItinerary(doc, itin, opts.affiliate, opts.filters, W)
  }

  return Buffer.from(doc.output('arraybuffer'))
}

function renderSearchSection(
  doc: jsPDF,
  tag: string,
  entry: SearchEntry,
  affiliate: AffiliateConfig | null,
  filters: BookingFilters | undefined,
  W: number,
  cy: number,
  rowLimit = 10,
): number {
  // Parse route + date from tag like "IAO-MNL@20260319#D53FF1"
  const heading = formatSearchHeading(tag, entry)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(10)
  doc.setTextColor(TEXT)
  doc.text(safe(heading), MARGIN, cy)

  doc.setFont(FONT, 'normal')
  doc.setFontSize(7)
  doc.setTextColor(MUTED)
  const meta = `${entry.offers.length} results - ${new Date(entry.timestamp).toLocaleString()}`
  doc.text(safe(meta), MARGIN, cy + 4)
  cy += 8

  const top = entry.offers.slice(0, rowLimit)
  if (top.length > 0) {
    autoTable(doc, {
      startY: cy,
      margin: { left: MARGIN, right: MARGIN },
      head: [['ID', 'Price', 'Stops', 'Duration', 'Carrier', 'Date', 'Dep > Arr']],
      body: top.map((o) => {
        const arr = `${o.arrival}${o.arrival_time_ahead}`
        return [o.id, o.price, fmtStops(o.stops), o.duration, o.name, o.departure_date, `${o.departure} > ${arr}`]
      }),
      ...tableTheme(),
    })
    cy = lastTableY(doc, cy + 30) + 4
  }

  const cheapest = entry.offers[0]
  if (cheapest) {
    const urls = buildOfferBookingUrls(cheapest, affiliate, filters)
    if (urls) {
      for (const [program, url] of Object.entries(urls)) {
        doc.setTextColor(ACCENT)
        doc.setFontSize(7)
        doc.textWithLink(`Book: ${PROGRAM_LABELS[program as ProgramName] ?? program}`, MARGIN + 2, cy, { url })
        cy += 4
      }
    }
  }

  cy += 4
  return cy
}

function renderItinerary(
  doc: jsPDF,
  it: Itinerary,
  affiliate: AffiliateConfig | null,
  filters: BookingFilters | undefined,
  W: number,
): void {
  doc.addPage()
  const usable = W - MARGIN * 2

  let cy = 20
  doc.setFont(FONT, 'bold')
  doc.setTextColor(ACCENT)
  fitText(doc, safe(it.title), W / 2, cy, usable, 16)
  cy += 5
  drawAccentLine(doc, W, cy)
  cy += 8

  const legs = uniqueLegs(it.legs)
  if (legs.length > 0) {
    const mapW = Math.min(100, usable)
    drawRouteMap(doc, legs, (W - mapW) / 2, cy, mapW, 30)
    cy += 36
  }

  // Detailed booking blocks
  for (const [i, offer] of it.legs.entries()) {
    cy = renderBookingBlock(doc, offer, i + 1, affiliate, it.filters ?? filters, usable, cy)
  }

  // Connection warnings
  const warnings = checkConnections(it.legs)
  if (warnings.length > 0) {
    doc.setFont(FONT, 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(WARN)
    for (const w of warnings) {
      doc.text(safe(w), MARGIN, cy)
      cy += 4
    }
    cy += 2
  }

  // Total travel time
  const ttt = totalTravelTime(it.legs)
  if (ttt) {
    doc.setFont(FONT, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(MUTED)
    doc.text(`Total travel time: ${ttt}`, MARGIN, cy)
    cy += 6
  }

  // Total price badge
  drawTotalBadge(doc, totalPrice(it.legs), MARGIN, cy)
  cy += 12

  // Note
  if (it.note) {
    doc.setFont(FONT, 'italic')
    doc.setFontSize(8)
    doc.setTextColor(MUTED)
    doc.text(safe(it.note), MARGIN, cy)
  }
}

function renderBookingBlock(
  doc: jsPDF,
  offer: Offer,
  idx: number,
  affiliate: AffiliateConfig | null,
  filters: BookingFilters | undefined,
  usable: number,
  cy: number,
): number {
  const arr = `${offer.arrival}${offer.arrival_time_ahead}`
  const summary = `Booking ${idx} - ${offer.departure_date} - ${legRoute(offer)} - ${offer.price} - ${offer.duration} - ${fmtStops(offer.stops)} - ${offer.name} - ${offer.departure}>${arr}`

  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.setTextColor(TEXT)
  cy = wrappedText(doc, safe(summary), MARGIN, cy, usable)
  cy += 1

  // Detailed leg table for multi-segment or layover flights
  if (offer.legs.length > 1 || offer.layovers.length > 0) {
    const body: (string | { content: string; styles: object })[][] = []
    for (const [j, leg] of offer.legs.entries()) {
      const flt = leg.flight_number ? `${leg.airline} ${leg.flight_number}` : leg.airline_name
      body.push([
        flt,
        `${leg.departure_airport} > ${leg.arrival_airport}`,
        leg.departure_time,
        leg.arrival_time,
        fmtMinutes(leg.duration),
        leg.aircraft || '-',
      ])
      if (j < offer.layovers.length) {
        const lo = offer.layovers[j]
        const s = { fontStyle: 'italic' as const, textColor: MUTED }
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

    autoTable(doc, {
      startY: cy,
      margin: { left: MARGIN + 4, right: MARGIN },
      head: [['Flight', 'Route', 'Dep', 'Arr', 'Duration', 'Aircraft']],
      body,
      ...tableTheme(),
      styles: { ...tableTheme().styles, fontSize: 7 },
      headStyles: { ...tableTheme().headStyles, fontSize: 7 },
    })
    cy = lastTableY(doc, cy + 20) + 3
  }

  // Booking links per leg
  const urls = buildOfferBookingUrls(offer, affiliate, filters)
  if (urls) {
    for (const [program, url] of Object.entries(urls)) {
      doc.setTextColor(ACCENT)
      doc.setFontSize(7)
      doc.textWithLink(`Book: ${PROGRAM_LABELS[program as ProgramName] ?? program}`, MARGIN + 4, cy, { url })
      cy += 4
    }
  }

  cy += 3
  return cy
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
