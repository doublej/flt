/**
 * Shared flight search logic used by both /api/flights and /api/flights/stream.
 * TypeScript port of api/routes/flights.py.
 */

import type { Flight } from './types'
import { type PassengerCounts, encodeFlightFilter } from './proto'
import { type ScrapeError, buildGoogleFlightsUrl, fetchFlights } from './scrape'

export const MAX_RANGE_DAYS = 7
export const MAX_TOTAL_SEARCHES = 21

export type SeatType = 'economy' | 'premium-economy' | 'business' | 'first'
export type TripType = 'round-trip' | 'one-way'

export interface SearchQuery {
  from_airport: string
  to_airport: string
  date: string
  return_date?: string
  date_end?: string
  return_date_end?: string
  adults: number
  children: number
  infants_in_seat: number
  infants_on_lap: number
  seat: SeatType
  max_stops?: number
  currency: string
}

export interface SearchResult {
  dep_date: string
  ret_date: string | null
  flights: Flight[]
  url: string
  error?: ScrapeError
}

function dateRange(start: string, end: string): string[] {
  const s = new Date(start)
  const e = new Date(end)
  const days = Math.min(Math.round((e.getTime() - s.getTime()) / 86400000), MAX_RANGE_DAYS - 1)
  return Array.from({ length: days + 1 }, (_, i) => {
    const d = new Date(s)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

export function buildDatePairs(q: SearchQuery): Array<[string, string | null]> {
  const depDates = q.date_end ? dateRange(q.date, q.date_end) : [q.date]
  const retDates = q.return_date
    ? q.return_date_end
      ? dateRange(q.return_date, q.return_date_end)
      : [q.return_date]
    : null

  if (!retDates) return depDates.map((d) => [d, null])

  const pairs: Array<[string, string]> = []
  for (const d of depDates) {
    for (const r of retDates) {
      if (r >= d) pairs.push([d, r])
    }
  }
  return pairs.slice(0, MAX_TOTAL_SEARCHES) as Array<[string, string | null]>
}

export async function searchSingle(
  dep_date: string,
  ret_date: string | null,
  q: SearchQuery,
): Promise<SearchResult> {
  const passengers: PassengerCounts = {
    adults: q.adults,
    children: q.children,
    infants_in_seat: q.infants_in_seat,
    infants_on_lap: q.infants_on_lap,
  }

  const legs = [{ date: dep_date, from: q.from_airport, to: q.to_airport, maxStops: q.max_stops }]
  const trip: TripType = ret_date ? 'round-trip' : 'one-way'

  if (ret_date) {
    legs.push({ date: ret_date, from: q.to_airport, to: q.from_airport, maxStops: q.max_stops })
  }

  const b64 = encodeFlightFilter({ legs, passengers, seat: q.seat, trip })
  const url = buildGoogleFlightsUrl(b64, q.currency)

  const result = await fetchFlights(b64, q.currency)

  if (result.error) return { dep_date, ret_date, flights: [], url, error: result.error }

  const flights: Flight[] = result.flights.map((f) => ({
    ...f,
    departure_date: dep_date,
    return_date: ret_date,
    countries: [],
  }))

  return { dep_date, ret_date, flights, url }
}

export function parseSearchQuery(url: URL): SearchQuery {
  const get = (k: string) => url.searchParams.get(k) ?? ''
  const getNum = (k: string, def: number) => {
    const v = url.searchParams.get(k)
    return v ? Number.parseInt(v) : def
  }

  const seat = get('seat') as SeatType
  return {
    from_airport: get('from_airport').toUpperCase(),
    to_airport: get('to_airport').toUpperCase(),
    date: get('date'),
    return_date: url.searchParams.get('return_date') ?? undefined,
    date_end: url.searchParams.get('date_end') ?? undefined,
    return_date_end: url.searchParams.get('return_date_end') ?? undefined,
    adults: getNum('adults', 1),
    children: getNum('children', 0),
    infants_in_seat: getNum('infants_in_seat', 0),
    infants_on_lap: getNum('infants_on_lap', 0),
    seat: ['economy', 'premium-economy', 'business', 'first'].includes(seat) ? seat : 'economy',
    max_stops: url.searchParams.has('max_stops') ? getNum('max_stops', 0) : undefined,
    currency: get('currency') || 'EUR',
  }
}
