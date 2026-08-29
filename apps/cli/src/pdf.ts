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
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { drawChartLegend, drawPriceChart } from './pdf-chart'
import { type MapRoute, ROUTE_COLORS, drawRouteLegend, drawRouteMap } from './pdf-map'
import {
  COLUMN_GLOSSARY,
  type Highlight,
  READING_TIPS,
  type RouteGroup,
  cheapestId,
  cityName,
  coverSubtitle,
  durationMin,
  fastestId,
  fmtMinutes,
  groupByRoute,
  pickHighlights,
  pricePerDay,
  routeCities,
  rowBadges,
  viaLabel,
} from './pdf-summary'

const INK = '#14181f'
const TEXT = '#2a2a2a'
const MUTED = '#6b7280'
const ACCENT = '#0b5563'
const ACCENT_SOFT = '#eaf1f2'
const BORDER = '#dfe3e8'
const SURFACE = '#f7f8f9'
const WARN = '#b45309'
const FONT = 'helvetica'
const MARGIN = 15
const PROJECT_URL = 'https://github.com/doublej/flt'
const PAGE_H = 297
const BOTTOM = PAGE_H - 22

/** Replace unicode chars that jsPDF's built-in helvetica can't render */
function safe(s: string): string {
  return s.replace(/→/g, '>').replace(/—/g, '-').replace(/·/g, '-')
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

function totalPrice(offers: Offer[]): string {
  const total = offers.reduce((sum, o) => sum + parsePrice(o.price), 0)
  const cur = (offers[0]?.price ?? 'EUR0').replace(/[0-9.,\s]/g, '') || 'EUR'
  return `${cur}${Math.round(total)}`
}

function arrivalLabel(o: Offer): string {
  return `${o.departure} > ${o.arrival}${o.arrival_time_ahead}`
}

/** Turn "IAO-MNL@20260319#D53FF1" into "Siargao to Manila - Wed, 19 March 2026" */
function formatSearchHeading(tag: string, entry: SearchEntry): string {
  const match = tag.match(/^([A-Z]{3})-([A-Z]{3})@(\d{4})(\d{2})(\d{2})/)
  if (!match) return entry.query
  const [, from, to, y, m, d] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  const fmt = date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `${fmt}${cabinSuffix(entry)}`
}

/**
 * Cabin, when it is not the default. Two searches of the same date differ only
 * by cabin, and without this they read as duplicates.
 */
function cabinSuffix(entry: SearchEntry): string {
  const cabin = entry.query.toLowerCase().match(/premium[- ]economy|business|first/)?.[0]
  if (!cabin) return ''
  const words = cabin.replace('-', ' ')
  return ` - ${words[0].toUpperCase()}${words.slice(1)}`
}

/** Drop the route/date prefix the heading already shows, keep cabin and filters. */
function searchConditions(entry: SearchEntry): string {
  const parts = entry.query.split('·').map((s) => s.trim())
  return parts.slice(1).join(' - ')
}

/** Sortable YYYYMMDD from a ref tag, or '' when the tag has no date. */
function searchDate(tag: string): string {
  return tag.match(/@(\d{8})/)?.[1] ?? ''
}

function currentPage(doc: jsPDF): number {
  return (doc as unknown as { getCurrentPageInfo(): { pageNumber: number } }).getCurrentPageInfo()
    .pageNumber
}

function lastTableY(doc: jsPDF, fallback: number): number {
  return (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback
}

/** Start a new page when `needed` mm would run past the footer. */
function ensureSpace(doc: jsPDF, cy: number, needed: number): number {
  if (cy + needed <= BOTTOM) return cy
  doc.addPage()
  return 22
}

/** Render text at a font size that fits within maxW, centered at cx */
function fitText(
  doc: jsPDF,
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
function wrappedText(doc: jsPDF, text: string, x: number, y: number, maxW: number, lh = 4): number {
  const lines: string[] = doc.splitTextToSize(text, maxW)
  for (const line of lines) {
    doc.text(line, x, y)
    y += lh
  }
  return y
}

/** A route group plus the colour it is drawn in throughout the report. */
interface RouteView extends RouteGroup {
  color: string
}

interface PdfOpts {
  searches: Array<[string, SearchEntry]>
  itineraries: Itinerary[]
  affiliate: AffiliateConfig | null
  title?: string
  filters?: BookingFilters
  note?: string
  pick?: string
}

export async function generatePdf(opts: PdfOpts): Promise<Buffer> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const title = safe(opts.title ?? 'Flight Search Results')

  // Everything downstream is scoped to a route so two destinations never share
  // a table, a chart or a headline number. Sections run in date order within.
  const groups = groupByRoute(opts.searches).map((g) => ({
    ...g,
    color: ROUTE_COLORS[0],
    searches: [...g.searches].sort((a, b) => searchDate(a[0]).localeCompare(searchDate(b[0]))),
  }))
  for (const [i, g] of groups.entries()) g.color = ROUTE_COLORS[i % ROUTE_COLORS.length]

  const allOffers = groups.flatMap((g) => g.offers)
  const mapOffers = allOffers.length > 0 ? allOffers : opts.itineraries.flatMap((it) => it.legs)

  renderCover(doc, opts, groups, W, title, mapOffers)

  // An index is only worth a page once there are enough sections to get lost in.
  const sectionCount = groups.reduce((n, g) => n + g.searches.length, 0)
  const wantsContents = sectionCount >= 3
  let contentsPage = 0
  if (wantsContents) {
    doc.addPage()
    contentsPage = currentPage(doc)
  }

  const guidePage = allOffers.length > 0 ? renderReadingGuide(doc, W) : 0

  const index: ContentsIndex = { guidePage, routes: [] }
  for (const group of groups) {
    let cy = renderRouteOpener(doc, group, W)
    const routeEntry = {
      label: group.label,
      color: group.color,
      page: currentPage(doc),
      sections: [] as SectionRef[],
    }

    cy = renderPriceByDate(doc, group, W, cy)

    for (const [i, [tag, entry]] of group.searches.entries()) {
      cy = placeSection(doc, cy, shortlistFor(entry, group, opts).length)
      routeEntry.sections.push({
        label: formatSearchHeading(tag, entry),
        number: i + 1,
        page: currentPage(doc),
        cheapest: entry.offers.length
          ? Math.min(...entry.offers.map((o) => parsePrice(o.price)))
          : Number.NaN,
        currency: (entry.offers[0]?.price ?? '').replace(/[0-9.,\s]/g, ''),
      })
      cy = renderSearchSection(doc, tag, entry, opts, group, W, cy, i + 1)
    }
    index.routes.push(routeEntry)
  }

  for (const itin of opts.itineraries) {
    renderItinerary(doc, itin, opts.affiliate, opts.filters, W)
  }

  if (wantsContents) {
    doc.setPage(contentsPage)
    renderContents(doc, W, index)
  }

  drawFooters(doc, W, title)
  return Buffer.from(doc.output('arraybuffer'))
}

interface SectionRef {
  label: string
  number: number
  page: number
  cheapest: number
  currency: string
}

interface ContentsIndex {
  guidePage: number
  routes: Array<{ label: string; color: string; page: number; sections: SectionRef[] }>
}

/** Part opener: one route, its own page, with its headline numbers. */
function renderRouteOpener(doc: jsPDF, group: RouteView, W: number): number {
  doc.addPage()
  const usable = W - MARGIN * 2
  let cy = 24

  doc.setFillColor(group.color)
  doc.rect(MARGIN, cy - 4, 3, 12, 'F')

  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.setTextColor(group.color)
  doc.text('ROUTE', MARGIN + 7, cy, { charSpace: 0.8 })
  doc.setFontSize(16)
  doc.setTextColor(INK)
  doc.text(safe(group.label), MARGIN + 7, cy + 7)
  cy += 15

  const dates = new Set(group.offers.map((o) => o.departure_date))
  const fastest = group.offers.length ? Math.min(...group.offers.map(durationMin)) : 0
  const cur = (group.offers[0]?.price ?? '').replace(/[0-9.,\s]/g, '')
  doc.setFont(FONT, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED)
  doc.text(
    safe(
      [
        `${group.offers.length} options`,
        `${dates.size} date${dates.size > 1 ? 's' : ''} searched`,
        `from ${cur}${Math.round(group.cheapest)}`,
        `quickest ${fmtMinutes(fastest)}`,
      ].join('   -   '),
    ),
    MARGIN + 7,
    cy,
  )
  cy += 4
  doc.setDrawColor(BORDER)
  doc.setLineWidth(0.4)
  doc.line(MARGIN, cy, W - MARGIN, cy)
  return cy + 9
}

/* ---------------------------------------------------------------- cover */

function renderCover(
  doc: jsPDF,
  opts: PdfOpts,
  groups: RouteView[],
  W: number,
  title: string,
  mapOffers: Offer[],
): void {
  const usable = W - MARGIN * 2
  let cy = 26

  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.setTextColor(ACCENT)
  doc.text('FLIGHT REPORT', MARGIN, cy, { charSpace: 0.8 })
  cy += 10

  doc.setFont(FONT, 'bold')
  doc.setTextColor(INK)
  doc.setFontSize(24)
  cy = wrappedText(doc, title, MARGIN, cy, usable, 10)
  cy += 1

  const subtitle = safe(coverSubtitle(opts.searches))
  if (subtitle) {
    doc.setFont(FONT, 'normal')
    doc.setFontSize(12)
    doc.setTextColor(MUTED)
    cy = wrappedText(doc, subtitle, MARGIN, cy, usable, 5.5)
    cy += 1
  }

  doc.setFont(FONT, 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(MUTED)
  const offers = groups.flatMap((g) => g.offers)
  const stamp = `Prepared ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`
  const scope =
    offers.length > 0
      ? `${offers.length} options - ${groups.length} route${groups.length > 1 ? 's' : ''}`
      : ''
  doc.text(safe([stamp, scope].filter(Boolean).join('  -  ')), MARGIN, cy)
  cy += 5

  doc.setDrawColor(BORDER)
  doc.setLineWidth(0.4)
  doc.line(MARGIN, cy, W - MARGIN, cy)
  cy += 9

  // One card per route when there are several destinations to choose between;
  // for a single route, the three ways of reading that one route instead.
  const multiRoute = groups.length > 1
  const cards: Array<{ highlight: Highlight; color: string; heading: string }> = multiRoute
    ? groups
        .map((g) => ({ highlight: routeCard(g, opts.pick), color: g.color, heading: g.label }))
        .filter((c): c is { highlight: Highlight; color: string; heading: string } =>
          Boolean(c.highlight),
        )
        .slice(0, 4)
    : pickHighlights(offers, opts.pick).map((h, i) => ({
        highlight: h,
        color: ROUTE_COLORS[i % ROUTE_COLORS.length],
        heading: h.labels.join(' / '),
      }))

  // Map: one colour per route, matching the cards and the route openers.
  const routes: MapRoute[] = multiRoute
    ? groups.map((g) => {
        const card = routeCard(g, opts.pick)
        return { label: g.label, color: g.color, legs: card ? uniqueLegs([card.offer]) : [] }
      })
    : cards.map((c) => ({
        label: `${c.heading} - ${c.highlight.offer.price}`,
        color: c.color,
        legs: uniqueLegs([c.highlight.offer]),
      }))

  const drawable = routes.filter((r) => r.legs.length > 0)
  if (drawable.length > 0) {
    const mapW = Math.min(150, usable)
    drawRouteMap(doc, drawable, (W - mapW) / 2, cy, mapW, 52)
    cy += 56
    if (drawable.length > 1 || multiRoute) {
      cy = drawRouteLegend(doc, drawable, MARGIN, cy, usable) + 6
    }
  }

  if (cards.length > 0) {
    cy = ensureSpace(doc, cy, 60)
    doc.setFont(FONT, 'bold')
    doc.setFontSize(12)
    doc.setTextColor(INK)
    doc.text('Start here', MARGIN, cy)
    cy += 4
    doc.setFont(FONT, 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(MUTED)
    doc.text(
      safe(
        multiRoute
          ? 'The best option on each route. Every route is reported separately from here on.'
          : 'The rest of this report is detail. These are the options worth deciding between.',
      ),
      MARGIN,
      cy,
    )
    cy += 6

    const gap = 6
    const cardW = (usable - gap * (cards.length - 1)) / cards.length
    for (const [i, c] of cards.entries()) {
      drawHighlightCard(doc, c.highlight, MARGIN + i * (cardW + gap), cy, cardW, c.color, c.heading)
    }
    cy += 46
  }

  if (opts.note) {
    cy = ensureSpace(doc, cy, 30)
    // Measure at the size it will be drawn at, or the lines overflow the box.
    doc.setFont(FONT, 'normal')
    doc.setFontSize(9)
    const noteLines: string[] = doc.splitTextToSize(safe(opts.note), usable - 12)
    const boxH = noteLines.length * 4.4 + 14
    doc.setFillColor(ACCENT_SOFT)
    doc.roundedRect(MARGIN, cy, usable, boxH, 1.5, 1.5, 'F')
    doc.setFont(FONT, 'bold')
    doc.setFontSize(8)
    doc.setTextColor(ACCENT)
    doc.text('SUMMARY', MARGIN + 6, cy + 7.5, { charSpace: 0.6 })
    doc.setFont(FONT, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(TEXT)
    let ny = cy + 13.5
    for (const line of noteLines) {
      doc.text(line, MARGIN + 6, ny)
      ny += 4.4
    }
  }
}

/**
 * The one option that represents a route on the cover. Cheapest by default so
 * routes stay comparable side by side; an explicit --pick wins on its own route.
 */
function routeCard(group: RouteView, pick?: string): Highlight | undefined {
  const picked = pick ? group.offers.find((o) => o.id === pick) : undefined
  if (picked) {
    return { labels: ['Our pick'], why: 'Chosen for this trip', offer: picked }
  }
  const id = cheapestId(group.offers)
  const offer = group.offers.find((o) => o.id === id)
  if (!offer) return undefined
  return {
    labels: ['Lowest price'],
    why: `Cheapest of ${group.offers.length} options on this route`,
    offer,
  }
}

/** Index page: every row links to the page it names. */
function renderContents(doc: jsPDF, W: number, index: ContentsIndex): void {
  let cy = 24
  doc.setFont(FONT, 'bold')
  doc.setFontSize(14)
  doc.setTextColor(INK)
  doc.text('What is inside', MARGIN, cy)
  cy += 6
  doc.setFont(FONT, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED)
  doc.text(safe('Every line is a link. Click it to jump to that page.'), MARGIN, cy)
  cy += 9

  const row = (
    marker: string,
    label: string,
    right: string,
    page: number,
    indent: number,
    bold: boolean,
    color = ACCENT,
  ) => {
    doc.setFont(FONT, 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(color)
    doc.text(marker, MARGIN + indent, cy)

    doc.setFont(FONT, bold ? 'bold' : 'normal')
    doc.setTextColor(bold ? INK : TEXT)
    doc.textWithLink(safe(label), MARGIN + indent + 10, cy, { pageNumber: page })

    doc.setFont(FONT, 'normal')
    doc.setTextColor(MUTED)
    doc.text(safe(right), W - MARGIN, cy, { align: 'right' })

    // Whole row clickable, not just the words.
    doc.link(MARGIN, cy - 3.5, W - MARGIN * 2, 5.5, { pageNumber: page })
    doc.setDrawColor(BORDER)
    doc.setLineWidth(0.1)
    doc.line(MARGIN, cy + 2, W - MARGIN, cy + 2)
    cy += 7
  }

  if (index.guidePage > 0) {
    row(
      '--',
      'How to read this report - every column explained',
      `page ${index.guidePage}`,
      index.guidePage,
      0,
      false,
    )
  }

  for (const route of index.routes) {
    if (cy > BOTTOM - 8) return
    cy += 3
    row('>', route.label, `page ${route.page}`, route.page, 0, true, route.color)
    for (const sec of route.sections) {
      if (cy > BOTTOM - 6) return
      const price = Number.isNaN(sec.cheapest)
        ? ''
        : `from ${sec.currency}${Math.round(sec.cheapest)}   -   `
      row(
        String(sec.number).padStart(2, '0'),
        sec.label,
        `${price}page ${sec.page}`,
        sec.page,
        6,
        false,
      )
    }
  }
}

function drawHighlightCard(
  doc: jsPDF,
  h: Highlight,
  x: number,
  y: number,
  w: number,
  color: string,
  heading: string,
): void {
  const H = 42
  doc.setFillColor('#ffffff')
  doc.setDrawColor(BORDER)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, w, H, 1.5, 1.5, 'FD')

  // Label bar
  doc.setFillColor(color)
  doc.roundedRect(x, y, w, 7, 1.5, 1.5, 'F')
  doc.rect(x, y + 4, w, 3, 'F')
  doc.setFont(FONT, 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor('#ffffff')
  const bar: string[] = doc.splitTextToSize(safe(heading.toUpperCase()), w - 7)
  doc.text(bar[0], x + 4, y + 4.8, { charSpace: 0.3 })

  const o = h.offer
  doc.setFont(FONT, 'bold')
  doc.setFontSize(16)
  doc.setTextColor(INK)
  doc.text(safe(o.price), x + 4, y + 17)

  doc.setFont(FONT, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(TEXT)
  doc.text(safe(o.name.slice(0, 26)), x + 4, y + 22.5)

  doc.setFontSize(7.5)
  doc.setTextColor(MUTED)
  doc.text(safe(`${viaLabel(o)}  -  ${o.duration}`), x + 4, y + 27)
  doc.text(safe(arrivalLabel(o)), x + 4, y + 31)

  doc.setFontSize(6.5)
  doc.setTextColor(MUTED)
  const why: string[] = doc.splitTextToSize(safe(`${o.id} - ${h.why}`), w - 8)
  let wy = y + 35.5
  for (const line of why.slice(0, 2)) {
    doc.text(line, x + 4, wy)
    wy += 3.2
  }
}

/* ------------------------------------------------------ price by date */

/** When to fly on this route: lowest and average fare per departure date. */
function renderPriceByDate(doc: jsPDF, group: RouteView, W: number, cy: number): number {
  const { days, currency } = pricePerDay(group.searches)
  if (days.length < 2) return cy

  const usable = W - MARGIN * 2
  cy = ensureSpace(doc, cy, 130)

  doc.setFont(FONT, 'bold')
  doc.setFontSize(12)
  doc.setTextColor(INK)
  doc.text('What each date costs', MARGIN, cy)
  cy += 5

  doc.setFont(FONT, 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(MUTED)
  cy = wrappedText(
    doc,
    safe(
      'The dark bar is the cheapest fare found that day. The pale bar is the average across every option that day, which shows whether the low fare is one lucky outlier or the whole day is cheap.',
    ),
    MARGIN,
    cy,
    usable,
    4.2,
  )
  cy += 5

  drawPriceChart(doc, days, currency, MARGIN, cy, usable, 66)
  cy += 66 + 6
  drawChartLegend(doc, MARGIN, cy)
  cy += 10

  const cheapestDay = days.reduce((a, b) => (b.low < a.low ? b : a))
  const dearestDay = days.reduce((a, b) => (b.low > a.low ? b : a))
  const fmtDay = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  const spread = Math.round(dearestDay.low - cheapestDay.low)
  const cheapDays = days.filter((d) => d.low === cheapestDay.low).length
  const lines = [
    cheapDays > 1
      ? `Cheapest fare is ${currency}${Math.round(cheapestDay.low)}, available on ${cheapDays} of the ${days.length} dates searched, first on ${fmtDay(cheapestDay.date)}.`
      : `Cheapest day: ${fmtDay(cheapestDay.date)} at ${currency}${Math.round(cheapestDay.low)}.`,
    `Dearest day: ${fmtDay(dearestDay.date)} at ${currency}${Math.round(dearestDay.low)}.`,
    spread > 0
      ? `Picking the right date is worth ${currency}${spread} per traveller on this route.`
      : 'Every date searched came in at the same lowest fare.',
  ]

  doc.setFont(FONT, 'normal')
  doc.setFontSize(8.5)
  for (const line of lines) {
    cy = ensureSpace(doc, cy, 8)
    doc.setTextColor(group.color)
    doc.text('-', MARGIN, cy)
    doc.setTextColor(TEXT)
    cy = wrappedText(doc, safe(line), MARGIN + 4, cy, usable - 4, 4.2)
    cy += 2
  }
  return cy + 6
}

/* -------------------------------------------------------- reading guide */

function renderReadingGuide(doc: jsPDF, W: number): number {
  doc.addPage()
  const page = currentPage(doc)
  const usable = W - MARGIN * 2
  let cy = 24

  doc.setFont(FONT, 'bold')
  doc.setFontSize(14)
  doc.setTextColor(INK)
  doc.text('How to read this report', MARGIN, cy)
  cy += 6
  doc.setFont(FONT, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED)
  cy = wrappedText(
    doc,
    safe(
      'Each section that follows is one search: one route, on one date, under one set of conditions. Every section holds the same table. Here is what each column means.',
    ),
    MARGIN,
    cy,
    usable,
    4.4,
  )
  cy += 4

  autoTable(doc, {
    startY: cy,
    margin: { left: MARGIN, right: MARGIN, bottom: 26 },
    head: [['Column', 'What it tells you']],
    body: COLUMN_GLOSSARY.map(([k, v]) => [safe(k), safe(v)]),
    ...tableTheme(),
    columnStyles: { 0: { cellWidth: 32, fontStyle: 'bold' } },
  })
  cy = lastTableY(doc, cy + 60) + 10

  doc.setFont(FONT, 'bold')
  doc.setFontSize(11)
  doc.setTextColor(INK)
  doc.text('Before you book', MARGIN, cy)
  cy += 6
  doc.setFont(FONT, 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(TEXT)
  for (const tip of READING_TIPS) {
    cy = ensureSpace(doc, cy, 10)
    doc.setTextColor(ACCENT)
    doc.text('-', MARGIN, cy)
    doc.setTextColor(TEXT)
    cy = wrappedText(doc, safe(tip), MARGIN + 4, cy, usable - 4, 4.2)
    cy += 2.5
  }
  cy += 4

  return page
}

/* ------------------------------------------------------------- sections */

/**
 * Rows a section shows: cheapest first, as the "#" column promises, with the
 * pick and the fastest option pinned in even when price alone would drop them.
 */
function shortlistFor(entry: SearchEntry, group: RouteView, opts: PdfOpts): Offer[] {
  const rowLimit = group.searches.length > 5 ? 6 : 10
  const byPrice = [...entry.offers].sort((a, b) => parsePrice(a.price) - parsePrice(b.price))
  const shortlist = byPrice.slice(0, rowLimit)
  for (const id of [opts.pick, fastestId(entry.offers)]) {
    if (!id || shortlist.some((o) => o.id === id)) continue
    const offer = byPrice.find((o) => o.id === id)
    if (offer) shortlist.push(offer)
  }
  return shortlist.sort((a, b) => parsePrice(a.price) - parsePrice(b.price))
}

const HEAD_H = 17
const ROW_H = 7.4

/**
 * Start a section on a fresh page unless it fits, or unless splitting it leaves
 * a decent block of rows on both pages. Keeps single orphan rows and
 * half-empty pages out of the report.
 */
function placeSection(doc: jsPDF, cy: number, rows: number): number {
  const room = BOTTOM - cy
  if (room >= HEAD_H + rows * ROW_H + 10) return cy
  const fits = Math.floor((room - HEAD_H) / ROW_H)
  if (fits >= 4 && rows - fits >= 4) return cy
  doc.addPage()
  return 22
}

function renderSearchSection(
  doc: jsPDF,
  tag: string,
  entry: SearchEntry,
  opts: PdfOpts,
  group: RouteView,
  W: number,
  cy: number,
  index: number,
): number {
  const top = shortlistFor(entry, group, opts)

  doc.setFont(FONT, 'bold')
  doc.setFontSize(9)
  doc.setTextColor(group.color)
  doc.text(String(index).padStart(2, '0'), MARGIN, cy)

  doc.setFontSize(12)
  doc.setTextColor(INK)
  doc.text(safe(formatSearchHeading(tag, entry)), MARGIN + 9, cy)

  doc.setFont(FONT, 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(MUTED)
  const conditions = searchConditions(entry)
  const shown =
    top.length < entry.offers.length
      ? `top ${top.length} of ${entry.offers.length}`
      : `${entry.offers.length} results`
  doc.text(
    safe(
      [conditions, shown, `searched ${new Date(entry.timestamp).toLocaleDateString()}`]
        .filter(Boolean)
        .join('  -  '),
    ),
    MARGIN + 9,
    cy + 4.5,
  )
  cy += 9

  if (top.length > 0) {
    const ids = {
      cheapestId: cheapestId(entry.offers),
      fastestId: fastestId(entry.offers),
      pickId: opts.pick,
    }
    autoTable(doc, {
      startY: cy,
      margin: { left: MARGIN, right: MARGIN, bottom: 26 },
      head: [['#', 'Price', 'Airline', 'Via', 'Total time', 'Depart > Arrive', 'ID', 'Note']],
      body: top.map((o, i) => [
        String(i + 1),
        safe(o.price) || 'Not shown',
        safe(o.name),
        safe(viaLabel(o)),
        safe(o.duration),
        safe(arrivalLabel(o)),
        o.id,
        safe(rowBadges(o, ids)),
      ]),
      ...tableTheme(),
      // Widths tuned for full city names, which wrap rather than overflow.
      columnStyles: {
        0: { cellWidth: 8, textColor: MUTED, halign: 'center' as const },
        1: { cellWidth: 15, fontStyle: 'bold' as const },
        4: { cellWidth: 17 },
        5: { cellWidth: 26 },
        6: { cellWidth: 14, textColor: MUTED },
        7: { cellWidth: 22, fontStyle: 'bold' as const, textColor: group.color },
      },
      didParseCell: (data: {
        section: string
        row: { index: number }
        cell: { styles: { fillColor: string } }
      }) => {
        if (data.section === 'body' && top[data.row.index]?.id === opts.pick) {
          data.cell.styles.fillColor = ACCENT_SOFT
        }
      },
    })
    cy = lastTableY(doc, cy + 30) + 4
  }

  const cheapest = entry.offers[0]
  if (cheapest) {
    const urls = buildOfferBookingUrls(cheapest, opts.affiliate, opts.filters)
    if (urls) {
      cy = ensureSpace(doc, cy, 8)
      doc.setFont(FONT, 'normal')
      doc.setFontSize(7)
      doc.setTextColor(MUTED)
      doc.text('Book this route:', MARGIN, cy)
      let lx = MARGIN + 24
      for (const [program, url] of Object.entries(urls)) {
        const label = PROGRAM_LABELS[program as ProgramName] ?? program
        doc.setTextColor(ACCENT)
        doc.textWithLink(safe(label), lx, cy, { url })
        lx += doc.getTextWidth(safe(label)) + 6
      }
      cy += 5
    }
  }

  return cy + 6
}

/* ----------------------------------------------------------- itinerary */

function renderItinerary(
  doc: jsPDF,
  it: Itinerary,
  affiliate: AffiliateConfig | null,
  filters: BookingFilters | undefined,
  W: number,
): void {
  doc.addPage()
  const usable = W - MARGIN * 2

  let cy = 24
  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.setTextColor(ACCENT)
  doc.text('ITINERARY', MARGIN, cy, { charSpace: 0.8 })
  cy += 8
  doc.setFontSize(16)
  doc.setTextColor(INK)
  cy = wrappedText(doc, safe(it.title), MARGIN, cy, usable, 7)
  cy += 2
  doc.setDrawColor(BORDER)
  doc.setLineWidth(0.4)
  doc.line(MARGIN, cy, W - MARGIN, cy)
  cy += 8

  const legs = uniqueLegs(it.legs)
  if (legs.length > 0) {
    const mapW = Math.min(100, usable)
    drawRouteMap(doc, legs, (W - mapW) / 2, cy, mapW, 30)
    cy += 36
  }

  for (const [i, offer] of it.legs.entries()) {
    cy = renderBookingBlock(doc, offer, i + 1, affiliate, it.filters ?? filters, usable, cy)
  }

  const warnings = checkConnections(it.legs)
  if (warnings.length > 0) {
    cy = ensureSpace(doc, cy, 8 + warnings.length * 4)
    doc.setFont(FONT, 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(WARN)
    for (const w of warnings) {
      doc.text(safe(w), MARGIN, cy)
      cy += 4
    }
    cy += 2
  }

  const ttt = totalTravelTime(it.legs)
  if (ttt) {
    cy = ensureSpace(doc, cy, 10)
    doc.setFont(FONT, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(MUTED)
    doc.text(`Total travel time: ${ttt}`, MARGIN, cy)
    cy += 6
  }

  cy = ensureSpace(doc, cy, 16)
  drawTotalBadge(doc, totalPrice(it.legs), MARGIN, cy)
  cy += 12

  if (it.note) {
    cy = ensureSpace(doc, cy, 10)
    doc.setFont(FONT, 'italic')
    doc.setFontSize(8)
    doc.setTextColor(MUTED)
    wrappedText(doc, safe(it.note), MARGIN, cy, usable)
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
  cy = ensureSpace(doc, cy, 26)
  const summary = `Leg ${idx} - ${offer.departure_date} - ${routeCities(offer)} - ${offer.price} - ${offer.duration} - ${fmtStops(offer.stops)} - ${offer.name} - ${arrivalLabel(offer)}`

  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.setTextColor(TEXT)
  cy = wrappedText(doc, safe(summary), MARGIN, cy, usable)
  cy += 1

  if (offer.legs.length > 1 || offer.layovers.length > 0) {
    const body: (string | { content: string; styles: object })[][] = []
    for (const [j, leg] of offer.legs.entries()) {
      const flt = leg.flight_number ? `${leg.airline} ${leg.flight_number}` : leg.airline_name
      body.push([
        flt,
        `${cityName(leg.departure_airport)} to ${cityName(leg.arrival_airport)}`,
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
          { content: `${cityName(lo.airport)} layover`, styles: s },
          { content: '', styles: s },
          { content: '', styles: s },
          { content: fmtMinutes(lo.duration), styles: s },
          { content: '', styles: s },
        ])
      }
    }

    autoTable(doc, {
      startY: cy,
      margin: { left: MARGIN + 4, right: MARGIN, bottom: 26 },
      head: [['Flight', 'Route', 'Dep', 'Arr', 'Duration', 'Aircraft']],
      body,
      ...tableTheme(),
      styles: { ...tableTheme().styles, fontSize: 7 },
      headStyles: { ...tableTheme().headStyles, fontSize: 7 },
    })
    cy = lastTableY(doc, cy + 20) + 3
  }

  const urls = buildOfferBookingUrls(offer, affiliate, filters)
  if (urls) {
    for (const [program, url] of Object.entries(urls)) {
      cy = ensureSpace(doc, cy, 6)
      doc.setTextColor(ACCENT)
      doc.setFontSize(7)
      doc.textWithLink(
        `Book: ${PROGRAM_LABELS[program as ProgramName] ?? program}`,
        MARGIN + 4,
        cy,
        { url },
      )
      cy += 4
    }
  }

  return cy + 3
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
      lineWidth: 0.1,
      cellPadding: 2.2,
    },
    headStyles: {
      fillColor: INK,
      textColor: '#ffffff',
      fontSize: 7.5,
      fontStyle: 'bold' as const,
    },
    alternateRowStyles: { fillColor: SURFACE },
    rowPageBreak: 'avoid' as const,
    theme: 'grid' as const,
  }
}

function drawFooters(doc: jsPDF, W: number, title: string): void {
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setDrawColor(BORDER)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, PAGE_H - 16, W - MARGIN, PAGE_H - 16)
    doc.setFont(FONT, 'normal')
    doc.setFontSize(7)
    doc.setTextColor(MUTED)
    const label: string[] = doc.splitTextToSize(title, 70)
    doc.text(label[0], MARGIN, PAGE_H - 11)
    doc.setTextColor(ACCENT)
    doc.textWithLink(PROJECT_URL, W / 2, PAGE_H - 11, { url: PROJECT_URL, align: 'center' })
    doc.setTextColor(MUTED)
    doc.text(`${p} / ${pages}`, W - MARGIN, PAGE_H - 11, { align: 'right' })
  }
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
