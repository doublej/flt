import type { Offer, SortKey } from './offer'

export interface FilterOpts {
  depAfter?: string
  depBefore?: string
  arrAfter?: string
  arrBefore?: string
  maxDur?: number
  maxStops?: number
  direct?: boolean
  carrier?: string
  excludeCarrier?: string
  excludeHub?: string
}

function timeToMin(t: string): number | null {
  if (!t || t === '??:??') return null
  const [h, m] = t.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function parseDur(dur: string): number {
  const h = dur.match(/(\d+)h/)?.[1] ?? '0'
  const m = dur.match(/(\d+)m/)?.[1] ?? '0'
  return Number(h) * 60 + Number(m)
}

export function parsePrice(price: string): number {
  const num = price.replace(/[^0-9.]/g, '')
  return num ? Number.parseFloat(num) : Number.POSITIVE_INFINITY
}

export function applyFilters(offers: Offer[], opts: FilterOpts): Offer[] {
  return offers.filter((o) => {
    if (opts.direct && o.stops > 0) return false
    if (opts.maxStops != null && o.stops > opts.maxStops) return false
    if (opts.carrier) {
      const carriers = opts.carrier.split(',').map((s) => s.trim().toLowerCase())
      const nameMatch = carriers.some(
        (c) => o.name.toLowerCase() === c || o.name.toLowerCase().includes(c),
      )
      const codeMatch = carriers.some(
        (c) => c.length === 2 && o.legs.some((l) => l.flight_number.toLowerCase().startsWith(c)),
      )
      if (!nameMatch && !codeMatch) return false
    }
    if (opts.excludeCarrier) {
      const excluded = opts.excludeCarrier.split(',').map((s) => s.trim().toLowerCase())
      const nameHit = excluded.some((c) => o.name.toLowerCase().includes(c))
      const codeHit = excluded.some(
        (c) => c.length === 2 && o.legs.some((l) => l.flight_number.toLowerCase().startsWith(c)),
      )
      if (nameHit || codeHit) return false
    }
    if (opts.excludeHub) {
      const hubs = new Set(opts.excludeHub.split(',').map((s) => s.trim().toUpperCase()))
      const hasHub = o.layovers.some((l) => hubs.has(l.airport))
      if (hasHub) return false
    }
    const dep = timeToMin(o.departure)
    const arr = timeToMin(o.arrival)
    if (opts.depAfter && (dep == null || dep < (timeToMin(opts.depAfter) ?? 0))) return false
    if (opts.depBefore && (dep == null || dep > (timeToMin(opts.depBefore) ?? 1440))) return false
    if (opts.arrAfter && (arr == null || arr < (timeToMin(opts.arrAfter) ?? 0))) return false
    if (opts.arrBefore && (arr == null || arr > (timeToMin(opts.arrBefore) ?? 1440))) return false
    if (opts.maxDur && parseDur(o.duration) > opts.maxDur) return false
    return true
  })
}

export function sortOffers(offers: Offer[], key: SortKey): Offer[] {
  const sorted = [...offers]
  sorted.sort((a, b) => {
    switch (key) {
      case 'price':
        return parsePrice(a.price) - parsePrice(b.price)
      case 'dur':
        return parseDur(a.duration) - parseDur(b.duration)
      case 'stops':
        return a.stops - b.stops
      case 'dep':
        return (timeToMin(a.departure) ?? 9999) - (timeToMin(b.departure) ?? 9999)
    }
  })
  return sorted
}
