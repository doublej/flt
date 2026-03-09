import type { Offer, SearchEntry } from './offer'
import { parsePrice } from './filter'
import { type AffiliateConfig, type BookingFilters, PROGRAM_LABELS, buildBookingUrls, resolveIata } from './booking'

export interface Itinerary {
  title: string
  note?: string
  legs: Offer[]
  filters?: BookingFilters
}

function stopsLabel(n: number): string {
  if (n === 0) return 'direct'
  return `${n} stop${n > 1 ? 's' : ''}`
}

function totalPrice(offers: Offer[]): string {
  const total = offers.reduce((sum, o) => sum + parsePrice(o.price), 0)
  const cur = (offers[0]?.price ?? '€0').replace(/[0-9.,\s]/g, '') || '€'
  return `${cur}${Math.round(total)}`
}

function legRoute(o: Offer): string {
  if (o.legs.length === 0) return '?→?'
  const codes = [o.legs[0].departure_airport]
  for (const leg of o.legs) codes.push(leg.arrival_airport)
  const unique = codes.filter((c, i) => i === 0 || c !== codes[i - 1])
  return unique.join('→')
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  return h ? `${h}h` : `${m}m`
}

function offerBookingLinks(o: Offer, affiliate: AffiliateConfig | null, filters?: BookingFilters): string[] {
  const rawFrom = o.legs[0]?.departure_airport
  const rawTo = o.legs[o.legs.length - 1]?.arrival_airport
  if (!rawFrom || !rawTo) return o.url ? [`- [Google Flights](${o.url})`] : []

  const lines: string[] = []

  if (affiliate) {
    const from = resolveIata(rawFrom)
    const to = resolveIata(rawTo)
    if (from && to) {
      const urls = buildBookingUrls(affiliate, {
        from_airport: from,
        to_airport: to,
        date: o.departure_date,
        return_date: o.return_date ?? undefined,
      }, filters)
      for (const [program, url] of Object.entries(urls)) {
        lines.push(`- [${PROGRAM_LABELS[program as keyof typeof PROGRAM_LABELS] ?? program}](${url})`)
      }
    }
  }

  if (o.url) lines.push(`- [Google Flights](${o.url})`)
  return lines
}

export function formatBooking(idx: number, o: Offer): string {
  const lines: string[] = []
  const arr = `${o.arrival}${o.arrival_time_ahead}`
  lines.push(
    `**Booking ${idx}** · ${o.departure_date} · ${legRoute(o)} · ${o.price} · ${o.duration} · ${stopsLabel(o.stops)} · ${o.name} · ${o.departure}→${arr}`,
  )
  if (o.legs.length > 1 || o.layovers.length > 0) {
    lines.push('')
    lines.push('| Flight | Route | Dep | Arr | Duration | Aircraft |')
    lines.push('|--------|-------|-----|-----|----------|----------|')
    for (const [j, leg] of o.legs.entries()) {
      const flt = leg.flight_number ? `${leg.airline} ${leg.flight_number}` : leg.airline_name
      lines.push(
        `| ${flt} | ${leg.departure_airport}→${leg.arrival_airport} | ${leg.departure_time} | ${leg.arrival_time} | ${formatMinutes(leg.duration)} | ${leg.aircraft || '—'} |`,
      )
      if (j < o.layovers.length) {
        const lo = o.layovers[j]
        lines.push(`| | *${lo.airport} layover* | | | *${formatMinutes(lo.duration)}* | |`)
      }
    }
  }
  return lines.join('\n')
}

export function formatItinerary(itin: Itinerary, affiliate: AffiliateConfig | null): string {
  const lines: string[] = []
  lines.push(`### ${itin.title}`)
  lines.push('')
  for (const [i, o] of itin.legs.entries()) {
    lines.push(formatBooking(i + 1, o))
    const bookLinks = offerBookingLinks(o, affiliate, itin.filters)
    if (bookLinks.length) {
      lines.push('')
      lines.push(`**Book leg ${i + 1}:**`)
      lines.push(...bookLinks)
    }
    lines.push('')
  }
  lines.push(`**Total: ${totalPrice(itin.legs)}**`)
  if (itin.note) lines.push(`\n> ${itin.note}`)
  return lines.join('\n')
}

export function formatSearchSection(tag: string, entry: SearchEntry, affiliate: AffiliateConfig | null): string {
  const lines: string[] = []
  lines.push(`### ${tag}`)
  lines.push('')
  lines.push(`> ${entry.query} · ${new Date(entry.timestamp).toLocaleString()}`)
  lines.push('')
  lines.push('| ID | Price | Stops | Duration | Carrier | Date | Dep→Arr |')
  lines.push('|----|------:|-------|----------|---------|------|---------|')
  for (const o of entry.offers.slice(0, 10)) {
    const arr = `${o.arrival}${o.arrival_time_ahead}`
    lines.push(
      `| ${o.id} | ${o.price} | ${stopsLabel(o.stops)} | ${o.duration} | ${o.name} | ${o.departure_date} | ${o.departure}→${arr} |`,
    )
  }
  if (entry.offers.length > 10) lines.push(`\n*…and ${entry.offers.length - 10} more results*`)

  const cheapest = entry.offers[0]
  if (cheapest) {
    const bookLinks = offerBookingLinks(cheapest, affiliate, entry.params)
    if (bookLinks.length) {
      lines.push('')
      lines.push('**Book this route:**')
      lines.push(...bookLinks)
    }
  }
  return lines.join('\n')
}

export function buildMarkdown(
  searches: Array<[string, SearchEntry]>,
  itineraries: Itinerary[],
  affiliate: AffiliateConfig | null,
  title?: string,
): string {
  const sections: string[] = []
  const heading = title ?? 'Flight Search Results'
  const date = new Date().toISOString().slice(0, 10)

  sections.push(`# ${heading}`)
  sections.push(`*Generated ${date}*`)

  if (itineraries.length > 0) {
    sections.push('\n## Recommended Options\n')
    for (const itin of itineraries) sections.push(formatItinerary(itin, affiliate))
  }

  if (searches.length > 0) {
    sections.push('\n## All Searches\n')
    for (const [tag, entry] of searches) {
      sections.push(formatSearchSection(tag, entry, affiliate))
      sections.push('')
    }
  }

  return sections.join('\n')
}
