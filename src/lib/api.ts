import type { Airport, SearchParams, SearchResult } from './types'

export async function searchAirports(query: string): Promise<Airport[]> {
  if (query.length < 2) return []
  const res = await fetch(`/api/airports?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Airport search failed')
  return res.json()
}

export async function searchFlights(params: SearchParams): Promise<SearchResult> {
  const url = new URL('/api/flights', window.location.origin)
  url.searchParams.set('from_airport', params.from_airport)
  url.searchParams.set('to_airport', params.to_airport)
  url.searchParams.set('date', params.date)

  if (params.return_date) url.searchParams.set('return_date', params.return_date)
  if (params.adults) url.searchParams.set('adults', String(params.adults))
  if (params.children) url.searchParams.set('children', String(params.children))
  if (params.infants_in_seat)
    url.searchParams.set('infants_in_seat', String(params.infants_in_seat))
  if (params.infants_on_lap) url.searchParams.set('infants_on_lap', String(params.infants_on_lap))
  if (params.seat) url.searchParams.set('seat', params.seat)
  if (params.max_stops !== undefined) url.searchParams.set('max_stops', String(params.max_stops))
  if (params.currency) url.searchParams.set('currency', params.currency)

  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Search failed' }))
    throw new Error(body.detail || 'Search failed')
  }
  return res.json()
}
