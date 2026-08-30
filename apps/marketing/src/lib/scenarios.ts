/** Four real jobs, run end to end. Every number below came off disk after the
 *  run — session.json for the search log, the result cache for the offers.
 *  Regenerate with apps/cli/scripts/scenario-stats.py. */

export type Scenario = {
  id: string
  /** What the traveller actually asked for. */
  ask: string
  route: string
  window: string
  queries: number
  options: number
  days: number
  routes: number
  carriers: number
  priceLow: number
  priceHigh: number
  /** Wall clock, first search to last. */
  seconds: number
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'gateway',
    ask: 'Hanoi in November. I can start from any airport I can reach by train.',
    route: 'Amsterdam · Brussels · Paris · Düsseldorf · Frankfurt → Hanoi',
    window: '3 November',
    queries: 5,
    options: 135,
    days: 1,
    routes: 5,
    carriers: 19,
    priceLow: 320,
    priceHigh: 2312,
    seconds: 12,
  },
  {
    id: 'ski',
    ask: 'Somewhere with snow, some time in the third week of January.',
    route: 'Amsterdam → Geneva · Innsbruck · Lyon · Turin',
    window: '16–22 January',
    queries: 28,
    options: 575,
    days: 7,
    routes: 4,
    carriers: 16,
    priceLow: 84,
    priceHigh: 412,
    seconds: 75,
  },
  {
    id: 'cabin',
    ask: 'Singapore in November. Is premium economy worth the money that week?',
    route: 'Amsterdam → Singapore, economy and premium economy',
    window: '3–9 November',
    queries: 14,
    options: 1060,
    days: 7,
    routes: 1,
    carriers: 36,
    priceLow: 335,
    priceHigh: 4586,
    seconds: 37,
  },
  {
    id: 'holidays',
    ask: 'New York for Christmas — or close enough that I can take a train in.',
    route: 'Amsterdam → JFK · Newark · Boston · Philadelphia',
    window: '19–25 December',
    queries: 28,
    options: 1172,
    days: 7,
    routes: 4,
    carriers: 29,
    priceLow: 400,
    priceHigh: 4775,
    seconds: 76,
  },
]

/** Totals across all four. Distinct counts, so they are lower than the column sums:
 *  the same carrier flies more than one of these routes. */
export const TOTALS = {
  queries: 75,
  options: 2942,
  days: 21,
  routes: 14,
  carriers: 58,
  aircraftTypes: 34,
  seconds: 235,
}

/** Seconds to run one search by hand: type the route, wait, scan, note the price.
 *  Shown on the page, because it is the only estimate in this section. */
export const MANUAL_S = 90

export const byHandHours = (queries: number) => (queries * MANUAL_S) / 3600

/* ── Avoiding hubs, airlines and regions ──────────────────────────────────
 * A filter applied to the options that came back, matching on each option's
 * layover airports. Not a constraint sent to Google — we read everything, then
 * throw out what you said you did not want. Measured on the runs above. */

export type Avoidance = {
  route: string
  options: number
  /** Options routing through a Gulf hub: DXB DOH AUH BAH MCT KWI. */
  viaGulf: number
  cheapest: number
  cheapestAvoiding: number
}

export const AVOIDING: Avoidance[] = [
  {
    route: 'Amsterdam → Singapore',
    options: 1060,
    viaGulf: 113,
    cheapest: 335,
    cheapestAvoiding: 408,
  },
  {
    route: 'Five cities → Hanoi',
    options: 135,
    viaGulf: 50,
    cheapest: 320,
    cheapestAvoiding: 320,
  },
]

/** The six airports that swallowed the most connections across all 2,942 options. */
export const LAYOVER_TOP = [
  { code: 'LHR', count: 486 },
  { code: 'CDG', count: 437 },
  { code: 'FRA', count: 355 },
  { code: 'MUC', count: 271 },
  { code: 'BKK', count: 120 },
  { code: 'ZRH', count: 111 },
]
export const LAYOVER_DISTINCT = 66

/* ── Discovering possible routes ──────────────────────────────────────────
 * A local walk over a static route graph. No searching, no prices, nothing
 * bookable — a map of what connects to what, used before deciding what to
 * search. Built from OpenFlights and OurAirports. */

export const GRAPH = { airports: 3425, connections: 19257 }

export const DISCOVERY = {
  route: 'Amsterdam → Hanoi',
  /** Routes found, by how many stops you will tolerate. */
  byStops: [
    { stops: 1, routes: 16 },
    { stops: 2, routes: 1034 },
    { stops: 3, routes: 62425 },
  ],
  /** Same query with Gulf hubs excluded, at up to 3 stops. */
  noGulfAt3: 57035,
  seconds: 0.16,
}
