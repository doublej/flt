/**
 * Airport search — TypeScript port of api/routes/airports.py.
 * Loads bundled airports.json, runs same scoring algorithm.
 */

import type { Airport } from '$lib/types'
import data from '../airports.json'

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
  return matches.slice(0, 20).map(({ a }) => ({
    name: a.entry.name,
    code: a.code,
    city: a.entry.city,
    country: a.entry.country,
  }))
}
