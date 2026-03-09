import type { Offer } from './offer'
import { parseDur, parsePrice } from './filter'

export interface CellResult {
  dep: string
  ret: string | null
  cheapest: string
  carrier: string
  stops: number
  duration: string
}

export function dateRange(start: string, end: string): string[] {
  const s = new Date(start)
  const e = new Date(end)
  const days = Math.round((e.getTime() - s.getTime()) / 86400000)
  return Array.from({ length: days + 1 }, (_, i) => {
    const d = new Date(s)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

export function pickCheapest(offers: Offer[], maxDur?: number): CellResult | null {
  let flights = offers
  if (maxDur) flights = flights.filter((f) => parseDur(f.duration) <= maxDur)
  if (flights.length === 0) return null

  let best = flights[0]
  for (const f of flights) {
    if (parsePrice(f.price) < parsePrice(best.price)) best = f
  }
  return {
    dep: best.departure_date,
    ret: best.return_date,
    cheapest: best.price,
    carrier: best.name,
    stops: best.stops,
    duration: best.duration,
  }
}
