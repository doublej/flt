import { type Offer, type SearchEntry, airportCity, parsePrice } from '@flights/core'

/** Door-to-door minutes: flight legs plus time spent connecting. */
export function durationMin(o: Offer): number {
  const legs = o.legs.reduce((s, l) => s + l.duration, 0)
  const layovers = o.layovers.reduce((s, l) => s + l.duration, 0)
  return legs + layovers
}

export function fmtMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  return h ? `${h}h` : `${m}m`
}

/** Full city name for an airport code, falling back to the code itself. */
export function cityName(code: string): string {
  return airportCity(code) ?? code
}

/** Every airport on the offer as city names: "Amsterdam to Guangzhou to Hanoi". */
export function routeCities(o: Offer): string {
  if (o.legs.length === 0) return '?'
  const codes = [o.legs[0].departure_airport, ...o.legs.map((l) => l.arrival_airport)]
  return codes
    .filter((c, i) => i === 0 || c !== codes[i - 1])
    .map(cityName)
    .join(' to ')
}

/** "Nonstop", or the connection cities with the time waited at each. */
export function viaLabel(o: Offer): string {
  if (o.layovers.length === 0) return 'Nonstop'
  return o.layovers.map((l) => `${cityName(l.airport)} ${fmtMinutes(l.duration)}`).join(', ')
}

function minBy<T>(items: T[], score: (t: T) => number): T | undefined {
  return items.reduce<T | undefined>(
    (best, cur) => (best === undefined || score(cur) < score(best) ? cur : best),
    undefined,
  )
}

/**
 * Balanced pick: price and travel time normalised across the field, lowest
 * combined score wins. Ties break toward fewer stops.
 */
export function bestValue(offers: Offer[]): Offer | undefined {
  if (offers.length === 0) return undefined
  const prices = offers.map((o) => parsePrice(o.price))
  const durations = offers.map(durationMin)
  const span = (xs: number[]) => Math.max(...xs) - Math.min(...xs) || 1
  const [pMin, dMin] = [Math.min(...prices), Math.min(...durations)]
  const [pSpan, dSpan] = [span(prices), span(durations)]
  const score = (o: Offer) =>
    (parsePrice(o.price) - pMin) / pSpan + (durationMin(o) - dMin) / dSpan + o.stops * 0.01
  return minBy(offers, score)
}

export interface Highlight {
  labels: string[]
  why: string
  offer: Offer
}

/**
 * The two or three offers a reader should look at before anything else.
 * `pickId` lets the caller override the balanced pick with a chosen offer.
 */
export function pickHighlights(offers: Offer[], pickId?: string): Highlight[] {
  if (offers.length === 0) return []
  const cheapest = minBy(offers, (o) => parsePrice(o.price))
  const fastest = fastestOffer(offers)
  const picked = pickId ? offers.find((o) => o.id === pickId) : undefined
  const recommended = picked ?? bestValue(offers)

  const out: Highlight[] = []
  const add = (offer: Offer | undefined, label: string, why: string) => {
    if (!offer) return
    const existing = out.find((h) => h.offer.id === offer.id)
    if (existing) {
      existing.labels.push(label)
      return
    }
    out.push({ labels: [label], why, offer })
  }

  add(
    recommended,
    'Our pick',
    picked ? 'Chosen for this trip' : 'Best balance of price and travel time',
  )
  add(cheapest, 'Lowest price', `Cheapest of ${offers.length} options found`)
  const slowest = Math.max(...offers.map(durationMin))
  add(
    fastest,
    'Fastest',
    fastest ? `${fmtMinutes(slowest - durationMin(fastest))} shorter than the slowest option` : '',
  )
  return out
}

/** Short reasons a row stands out, most important first, capped at two. */
export function rowBadges(
  offer: Offer,
  opts: { cheapestId?: string; fastestId?: string; pickId?: string },
): string {
  const badges: string[] = []
  if (offer.id === opts.pickId) badges.push('Our pick')
  if (offer.id === opts.cheapestId) badges.push('Cheapest')
  if (offer.id === opts.fastestId) badges.push('Fastest')
  if (offer.stops === 0 && badges.length < 2) badges.push('Nonstop')
  return badges.slice(0, 2).join(' / ')
}

export function cheapestId(offers: Offer[]): string | undefined {
  return minBy(offers, (o) => parsePrice(o.price))?.id
}

export function fastestId(offers: Offer[]): string | undefined {
  return fastestOffer(offers)?.id
}

/** Shortest travel time; ties broken by price so the cheaper copy wins. */
function fastestOffer(offers: Offer[]): Offer | undefined {
  return minBy(offers, (o) => durationMin(o) * 100000 + parsePrice(o.price))
}

/**
 * Routes and date span covered, for the cover subtitle. A shared origin is
 * stated once rather than repeated for every destination.
 */
export function coverSubtitle(searches: Array<[string, SearchEntry]>): string {
  const offers = searches.flatMap(([, e]) => e.offers)
  if (offers.length === 0) return ''
  const origins = new Set<string>()
  const destinations: string[] = []
  for (const [tag] of searches) {
    const m = tag.match(/^([A-Z]{3})-([A-Z]{3})@/)
    if (!m) continue
    origins.add(cityName(m[1]))
    const to = cityName(m[2])
    if (!destinations.includes(to)) destinations.push(to)
  }
  const dates = offers.map((o) => o.departure_date).sort()
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  const first = dates[0]
  const last = dates[dates.length - 1]
  const when = first === last ? fmt(first) : `${fmt(first)} - ${fmt(last)}`
  const route =
    origins.size === 1 && destinations.length > 0
      ? `${[...origins][0]} to ${listWords(destinations)}`
      : destinations.join(', ')
  return route ? `${route} - ${when}` : when
}

/** "a, b and c" */
function listWords(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** Plain-language meaning of every column in the options tables. */
export const COLUMN_GLOSSARY: Array<[string, string]> = [
  ['#', 'Position in this list. Cheapest first.'],
  ['Price', 'Total fare for the passengers searched, in the currency shown.'],
  ['Airline', 'Who markets the ticket. Two names means the trip is split across two carriers.'],
  [
    'Via',
    'The city where you change plane and how long you wait there. "Nonstop" means no change at all.',
  ],
  ['Total time', 'Door-to-door travel time, including time spent connecting.'],
  ['Depart / Arrive', 'Local times at each airport. "+1" means you land the next calendar day.'],
  ['ID', 'Stable code for this exact flight. Quote it to pull up full detail or to book.'],
  ['Note', 'Why the row stands out: our pick, cheapest, fastest, or nonstop.'],
]

export const READING_TIPS: string[] = [
  'Connections under 1h 30m are tight for an international transfer. One delayed inbound and the onward flight is gone.',
  'Two rows at the same price with very different total times differ by layover length, not by route quality.',
  'Prices are what the search showed at the time stamped on each section. They move daily.',
  'Baggage allowance, fare rules and seat selection are not covered here. Check them before you pay.',
]

export interface DayPrice {
  date: string
  low: number
  avg: number
  count: number
}

/**
 * Lowest and average fare per departure date, across every search in the
 * report. Offers are deduplicated by id so a flight that appears in two
 * searches of the same day is not counted twice.
 */
export function pricePerDay(searches: Array<[string, SearchEntry]>): {
  days: DayPrice[]
  currency: string
} {
  const byDate = new Map<string, Map<string, number>>()
  let currency = ''
  for (const [, entry] of searches) {
    for (const o of entry.offers) {
      const price = parsePrice(o.price)
      if (!Number.isFinite(price)) continue
      if (!currency) currency = o.price.replace(/[0-9.,\s]/g, '')
      const day = byDate.get(o.departure_date) ?? new Map<string, number>()
      day.set(o.id, Math.min(day.get(o.id) ?? price, price))
      byDate.set(o.departure_date, day)
    }
  }
  const days = [...byDate.entries()]
    .filter(([, offers]) => offers.size > 0)
    .map(([date, offers]) => {
      const prices = [...offers.values()]
      const sum = prices.reduce((a, b) => a + b, 0)
      return { date, low: Math.min(...prices), avg: sum / prices.length, count: prices.length }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
  return { days, currency: currency || '' }
}

export interface RouteGroup {
  key: string
  label: string
  searches: Array<[string, SearchEntry]>
  offers: Offer[]
  cheapest: number
}

/**
 * Split a report into one group per origin/destination pair. Everything the
 * reader sees is scoped to a group, so two destinations never share a table,
 * a chart or a headline number.
 */
export function groupByRoute(searches: Array<[string, SearchEntry]>): RouteGroup[] {
  const groups = new Map<string, Array<[string, SearchEntry]>>()
  for (const item of searches) {
    const key = item[0].match(/^([A-Z]{3}-[A-Z]{3})@/)?.[1] ?? item[0]
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return [...groups.entries()]
    .map(([key, items]) => {
      const offers = items.flatMap(([, e]) => e.offers)
      const priced = offers.map((o) => parsePrice(o.price)).filter(Number.isFinite)
      const [from, to] = key.split('-')
      return {
        key,
        label: to ? `${cityName(from)} to ${cityName(to)}` : key,
        searches: items,
        offers,
        cheapest: priced.length ? Math.min(...priced) : Number.NaN,
      }
    })
    .sort(
      (a, b) => (a.cheapest || Number.POSITIVE_INFINITY) - (b.cheapest || Number.POSITIVE_INFINITY),
    )
}
