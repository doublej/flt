import { listItineraries } from '$lib/itinerary-store'
import type { Flight, FlightLayover, FlightLeg, Offer, SearchResult } from '$lib/types'
import type { AffiliateConfig, BookingFilters } from '@flights/core/booking'
import { formatDateShort } from '@flights/core/dates'
import { type Itinerary, buildMarkdown } from '@flights/core/takeout'

function fmtMins(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  return h ? `${h}h` : `${m}m`
}

function fmtStops(stops: number): string {
  if (stops === 0) return 'Nonstop'
  return `${stops} stop${stops > 1 ? 's' : ''}`
}

function legLines(leg: FlightLeg): string[] {
  const header = [leg.airline_name, `${leg.airline} ${leg.flight_number}`]
  if (leg.aircraft) header.push(leg.aircraft)
  return [
    `  - **${header.join(' · ')}**`,
    `    ${leg.departure_time} ${leg.departure_airport} → ${leg.arrival_time} ${leg.arrival_airport} · ${fmtMins(leg.duration)}`,
  ]
}

function layoverLine(l: FlightLayover): string {
  return `  - ⏱ ${fmtMins(l.duration)} layover · ${l.airport_name} (${l.airport})`
}

function flightBlock(f: Flight, showDate: boolean): string[] {
  const badge = f.is_best ? '⭐ ' : ''
  const datePart = showDate
    ? ` · ${formatDateShort(f.departure_date)}${f.return_date ? ` / ${formatDateShort(f.return_date)}` : ''}`
    : ''
  const ahead = f.arrival_time_ahead ? ` +${f.arrival_time_ahead}` : ''
  const delay = f.delay ? ` ⚠ ${f.delay}` : ''

  const lines: string[] = [
    `### ${badge}${f.name} · ${f.price}`,
    `**${f.departure} → ${f.arrival}${ahead}**${datePart} · ${f.duration} · ${fmtStops(f.stops)}${delay}`,
  ]

  if (f.legs.length > 0) {
    lines.push('')
    f.legs.forEach((leg, i) => {
      lines.push(...legLines(leg))
      if (i < f.layovers.length) {
        lines.push(layoverLine(f.layovers[i]))
      }
    })
  }

  return lines
}

export function resultToMarkdown(
  result: SearchResult,
  flights: Flight[],
  showDate: boolean,
): string {
  const blocks = flights.flatMap((f) => [...flightBlock(f, showDate), ''])
  const lines = ['# Flight Results', '', ...blocks]
  if (result.google_flights_url) {
    lines.push(`[View on Google Flights](${result.google_flights_url})`)
  }
  return lines.join('\n')
}

const AFFILIATE: AffiliateConfig = { marker: '709151', trs: '505891' }

export function buildTakeout(offers: Offer[], filters?: BookingFilters): string {
  const itineraries: Itinerary[] = listItineraries().map((it) => ({
    title: it.name,
    legs: it.legs,
    filters,
  }))

  const searchEntry = {
    offers,
    query: 'Web search',
    timestamp: Date.now(),
    ref: 'web',
  }

  return buildMarkdown(offers.length > 0 ? [['Latest search', searchEntry]] : [], itineraries, {
    affiliate: AFFILIATE,
    filters,
  })
}
