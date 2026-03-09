/**
 * Airport search — TypeScript port of api/routes/airports.py.
 * Loads bundled airports.json, runs same scoring algorithm.
 */

import type { Airport } from './types'
import data from './airports.json'

interface AirportEntry {
  name: string
  city: string
  country: string
}

const _airports = data as Record<string, AirportEntry>

const _index: Array<{ text: string; code: string; entry: AirportEntry }> = Object.entries(
  _airports,
).map(([code, a]) => ({
  text: `${code} ${a.name} ${a.city} ${a.country}`.toLowerCase(),
  code,
  entry: a,
}))

function score(search: string, code: string, entry: AirportEntry): number {
  const iata = code.toLowerCase()
  const city = entry.city.toLowerCase()
  if (iata === search) return 0
  if (iata.startsWith(search)) return 1
  if (city === search) return 2
  if (city.startsWith(search)) return 3
  if (entry.name.toLowerCase().includes(search)) return 4
  return 5
}

export function searchAirports(q: string): Airport[] {
  const search = q.toLowerCase().trim()
  const matches = _index
    .filter((a) => a.text.includes(search))
    .map((a) => ({ a, s: score(search, a.code, a.entry) }))
  matches.sort((x, y) => x.s - y.s || x.a.entry.name.localeCompare(y.a.entry.name))
  // Drop weak matches when strong matches exist:
  // best 0-1 (IATA match) → keep only score ≤ 3 (city-level)
  // best 2-3 (city match) → keep only score ≤ 4 (name-level)
  const bestScore = matches[0]?.s ?? 5
  const cutoff = bestScore <= 1 ? 4 : bestScore <= 3 ? 5 : 6
  const filtered = matches.filter((m) => m.s < cutoff)
  const results = filtered.length > 0 ? filtered : matches
  return results.slice(0, 20).map(({ a }) => ({
    name: a.entry.name,
    code: a.code,
    city: a.entry.city,
    country: a.entry.country,
  }))
}

/** Check if a code is a known IATA airport code */
export function isValidAirport(code: string): boolean {
  return code in _airports
}

/** Get city name for an IATA code, or null if unknown */
export function airportCity(code: string): string | null {
  return _airports[code]?.city ?? null
}
