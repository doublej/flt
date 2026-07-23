import {
  LONG_RT_STAY_DAYS,
  type Offer,
  type SearchQuery,
  type SeatType,
  type SortKey,
  applyFilters,
  buildDatePairs,
  describeSearchRequest,
  ensureActiveSession,
  mergeExclusions,
  rtStayDays,
  saveSession,
  setLatestSearch,
  sortOffers,
} from '@flights/core'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  SCRAPE_HINTS,
  ToolError,
  assertAirport,
  assertDate,
  fetchAndCache,
  guard,
  summarizeOffer,
  withSession,
} from '../shared'

export const paxShape = {
  adults: z.number().int().min(1).max(9).default(1).describe('Adult passengers'),
  children: z.number().int().min(0).max(8).default(0).describe('Child passengers'),
  infantsInSeat: z.number().int().min(0).max(4).default(0).describe('Infants with a seat'),
  infantsOnLap: z.number().int().min(0).max(4).default(0).describe('Lap infants'),
}

export const filterShape = {
  maxStops: z.number().int().min(0).max(3).optional().describe('Max stops (0 = direct only)'),
  direct: z.boolean().default(false).describe('Direct flights only'),
  carrier: z.string().optional().describe('Only this airline (name or code)'),
  excludeCarrier: z.string().optional().describe('Exclude airlines, comma-separated names/codes'),
  excludeHub: z.string().optional().describe('Exclude layover airports, comma-separated IATA codes'),
  excludeRegion: z
    .string()
    .optional()
    .describe('Exclude hub regions: gulf, middleeast, russia, belarus (comma-separated, mixable with IATA codes)'),
  maxDur: z.number().int().optional().describe('Max total duration in minutes'),
}

export function toFilterOpts(a: {
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
  excludeRegion?: string
}) {
  return {
    depAfter: a.depAfter,
    depBefore: a.depBefore,
    arrAfter: a.arrAfter,
    arrBefore: a.arrBefore,
    maxDur: a.maxDur,
    maxStops: a.maxStops,
    direct: a.direct ?? false,
    carrier: a.carrier,
    excludeCarrier: a.excludeCarrier,
    excludeHub: mergeExclusions(a.excludeHub, a.excludeRegion),
  }
}

export function registerSearch(server: McpServer): void {
  server.registerTool(
    'search',
    {
      title: 'Search flights',
      description:
        'Search Google Flights for a route and date (one-way or round trip). Results are cached ' +
        '(6h TTL, shared with the flt CLI) and recorded in the shared session so offer IDs and ' +
        "refs work across MCP and CLI (inspect, itinerary). Dates accept YYYY-MM-DD, DD/MM/YYYY, or 'tomorrow'.",
      inputSchema: {
        from: z.string().describe('Origin IATA code, e.g. AMS'),
        to: z.string().describe('Destination IATA code, e.g. DLM'),
        date: z.string().describe('Departure date'),
        returnDate: z.string().optional().describe('Return date (round trip)'),
        dateEnd: z.string().optional().describe('Flexible departure window end date'),
        returnDateEnd: z.string().optional().describe('Flexible return window end date'),
        seat: z
          .enum(['economy', 'premium-economy', 'business', 'first'])
          .default('economy')
          .describe('Cabin class'),
        ...paxShape,
        currency: z.string().default('EUR').describe('Currency code'),
        depAfter: z.string().optional().describe('Depart after HH:MM'),
        depBefore: z.string().optional().describe('Depart before HH:MM'),
        arrAfter: z.string().optional().describe('Arrive after HH:MM'),
        arrBefore: z.string().optional().describe('Arrive before HH:MM'),
        ...filterShape,
        sort: z.enum(['price', 'dur', 'stops', 'dep']).default('price').describe('Sort key'),
        limit: z.number().int().min(1).max(200).default(50).describe('Max results returned'),
        view: z
          .enum(['summary', 'full'])
          .default('summary')
          .describe('summary = compact offers; full = raw offers with legs and layovers'),
        refresh: z.boolean().default(false).describe('Force fresh fetch, skip cache'),
      },
    },
    guard(async (a) => {
      const from = assertAirport(a.from, 'Origin')
      const to = assertAirport(a.to, 'Destination')
      const date = assertDate(a.date, 'Departure date')
      const returnDate = a.returnDate ? assertDate(a.returnDate, 'Return date') : undefined
      const dateEnd = a.dateEnd ? assertDate(a.dateEnd, 'Departure end date') : undefined
      const returnDateEnd = a.returnDateEnd
        ? assertDate(a.returnDateEnd, 'Return end date')
        : undefined

      const query: SearchQuery = {
        from_airport: from,
        to_airport: to,
        date,
        return_date: returnDate,
        date_end: dateEnd,
        return_date_end: returnDateEnd,
        adults: a.adults,
        children: a.children,
        infants_in_seat: a.infantsInSeat,
        infants_on_lap: a.infantsOnLap,
        seat: a.seat as SeatType,
        max_stops: a.maxStops,
        currency: a.currency,
      }

      const pairs = buildDatePairs(query)
      const session = await withSession()
      ensureActiveSession(session, `${from} → ${to}`)

      const results = []
      for (const [d, r] of pairs) {
        results.push(await fetchAndCache(d, r, query, session, a.refresh))
      }

      const allFlights = results.flatMap((r) => r.offers)
      if (allFlights.length === 0) {
        const err = results.find((r) => r.err)?.err ?? 'no_flights'
        let hint = SCRAPE_HINTS[err] ?? SCRAPE_HINTS.no_flights
        // Long-stay round trips often return nothing (fare max-stay rules).
        if (
          returnDate &&
          (err === 'no_flights' || err === undefined) &&
          rtStayDays(date, returnDate) > LONG_RT_STAY_DAYS
        ) {
          hint =
            `Round trips with stays over ~${LONG_RT_STAY_DAYS} days often return nothing ` +
            `(fare max-stay limits). Search each direction as a one-way instead.`
        }
        const code = err === 'http' || err === 'no_script' ? 'BLOCKED' : err.toUpperCase()
        throw new ToolError(code, hint, results[0]?.url)
      }

      const rawCount = allFlights.length
      const filterOpts = toFilterOpts(a)
      const hasFilter = !!(
        a.carrier ||
        a.excludeCarrier ||
        filterOpts.excludeHub ||
        a.direct ||
        a.depAfter ||
        a.depBefore ||
        a.arrAfter ||
        a.arrBefore ||
        a.maxDur
      )
      let offers = applyFilters(allFlights, filterOpts)
      if (hasFilter && offers.length === 0) {
        throw new ToolError(
          'NO_RESULTS',
          `All ${rawCount} results filtered out, 0 remaining. Relax filters and retry.`,
        )
      }
      offers = sortOffers(offers, a.sort as SortKey)
      const totalAfterFilter = offers.length
      offers = offers.slice(0, a.limit)

      const refs = results.flatMap((r) => (r.ref ? [r.ref] : []))
      setLatestSearch(session, offers, describeSearchRequest(query), refs)
      await saveSession(session)

      return {
        route: `${from} → ${to}`,
        refs,
        total: totalAfterFilter,
        returned: offers.length,
        truncated: totalAfterFilter > offers.length,
        offers: a.view === 'full' ? offers : offers.map(summarizeOffer),
      }
    }),
  )
}

export type { Offer }
