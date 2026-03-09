/**
 * Generate slim data files for @flights/core from the enriched dataset.
 *
 * Usage: cd packages/core/src/data && bun run generate.ts
 *
 * Reads from data/out/ (workspace root) and writes:
 * - route-graph.json — adjacency list: airport → destination[]
 * - airport-coords.json — airport → [lat, lon] (only connected airports)
 * - airport-meta.json — airport → { name, city, country, countryName, continent, timezone }
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DATA_DIR = join(import.meta.dir, '../../../../data/out')

interface RouteConnection {
  dst: string
  airlines: string[]
  direct: boolean
}

interface AirportData {
  name: string
  city: string | null
  country: string
  countryName: string | null
  continent: string | null
  lat: number
  lon: number
  timezone: string | null
  scheduledService: boolean
}

// Load enriched data
const routeIndex: Record<string, RouteConnection[]> = JSON.parse(
  readFileSync(join(DATA_DIR, 'route-index.json'), 'utf-8'),
)
const airports: Record<string, AirportData> = JSON.parse(
  readFileSync(join(DATA_DIR, 'airports.json'), 'utf-8'),
)

// Build route graph: airport → sorted destination IATA codes (direct only)
const routeGraph: Record<string, string[]> = {}
for (const [src, connections] of Object.entries(routeIndex)) {
  const dests = connections.filter((c) => c.direct).map((c) => c.dst)
  if (dests.length > 0) routeGraph[src] = dests.sort()
}

// Build coords: only airports that appear in the route graph (as src or dst)
const connectedAirports = new Set<string>()
for (const [src, dests] of Object.entries(routeGraph)) {
  connectedAirports.add(src)
  for (const dst of dests) connectedAirports.add(dst)
}

const coords: Record<string, [number, number]> = {}
const meta: Record<string, { name: string; city: string | null; country: string; countryName: string | null; continent: string | null; timezone: string | null }> = {}

for (const iata of [...connectedAirports].sort()) {
  const ap = airports[iata]
  if (!ap) continue
  coords[iata] = [Math.round(ap.lat * 1e4) / 1e4, Math.round(ap.lon * 1e4) / 1e4]
  meta[iata] = {
    name: ap.name,
    city: ap.city,
    country: ap.country,
    countryName: ap.countryName,
    continent: ap.continent,
    timezone: ap.timezone,
  }
}

// Write output files
const write = (name: string, data: unknown) => {
  const path = join(import.meta.dir, name)
  writeFileSync(path, JSON.stringify(data))
  const size = readFileSync(path).length
  console.log(`${name}: ${(size / 1024).toFixed(0)} KB (${Object.keys(data as Record<string, unknown>).length} entries)`)
}

write('route-graph.json', routeGraph)
write('airport-coords.json', coords)
write('airport-meta.json', meta)

console.log(`\nConnected airports: ${connectedAirports.size}`)
console.log(`Airports with coords: ${Object.keys(coords).length}`)
