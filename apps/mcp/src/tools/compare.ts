import {
  LONG_RT_STAY_DAYS,
  type Offer,
  type SearchQuery,
  type SeatType,
  applyFilters,
  ensureActiveSession,
  parsePrice,
  rtStayDays,
  saveSession,
  setLatestSearch,
  sortOffers,
} from '@flights/core'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  ToolError,
  assertAirport,
  assertDate,
  fetchAndCache,
  guard,
  withSession,
} from '../shared'
import { filterShape, paxShape, toFilterOpts } from './search'

export function registerCompare(server: McpServer): void {
  server.registerTool(
    'compare',
    {
      title: 'Compare routes',
      description:
        'Compare cheapest prices across multiple origins or destinations for one date ' +
        '(optionally round trip). Only one side may list multiple airports.',
      inputSchema: {
        from: z.array(z.string()).min(1).describe('Origin IATA code(s)'),
        to: z.array(z.string()).min(1).describe('Destination IATA code(s)'),
        date: z.string().describe('Departure date'),
        returnDate: z.string().optional().describe('Return date (round-trip compare)'),
        seat: z.enum(['economy', 'premium-economy', 'business', 'first']).default('economy'),
        ...paxShape,
        currency: z.string().default('EUR'),
        ...filterShape,
        refresh: z.boolean().default(false).describe('Force fresh fetch, skip cache'),
      },
    },
    guard(async (a) => {
      const origins = a.from.map((c) => assertAirport(c, 'Origin'))
      const dests = a.to.map((c) => assertAirport(c, 'Destination'))
      if (origins.length > 1 && dests.length > 1) {
        throw new ToolError(
          'BAD_INPUT',
          'Only one side can have multiple airports. Use several origins OR several destinations.',
        )
      }
      const date = assertDate(a.date, 'Departure date')
      const returnDate = a.returnDate ? assertDate(a.returnDate, 'Return date') : null

      const filterOpts = toFilterOpts(a)
      const session = await withSession()
      const routeLabel =
        origins.length > 1
          ? `${origins.join('/')} → ${dests[0]}`
          : `${origins[0]} → ${dests.join('/')}`
      const label = returnDate ? `${routeLabel} return ${returnDate}` : routeLabel
      ensureActiveSession(session, label)

      const pairs = origins.flatMap((o) => dests.map((d) => [o, d] as const))
      const rows = []
      const allOffers: Offer[] = []
      const allRefs: string[] = []

      for (const [from, to] of pairs) {
        const query: SearchQuery = {
          from_airport: from,
          to_airport: to,
          date,
          return_date: returnDate ?? undefined,
          adults: a.adults,
          children: a.children,
          infants_in_seat: a.infantsInSeat,
          infants_on_lap: a.infantsOnLap,
          seat: a.seat as SeatType,
          max_stops: a.maxStops,
          currency: a.currency,
        }

        const { offers, ref, err } = await fetchAndCache(date, returnDate, query, session, a.refresh)
        if (ref) allRefs.push(ref)
        const filtered = applyFilters(offers, filterOpts)
        allOffers.push(...filtered)

        if (filtered.length === 0) {
          rows.push({ route: `${from} → ${to}`, cheapest: null, ...(err ? { err } : {}) })
          continue
        }
        const best = sortOffers(filtered, 'price')[0]
        rows.push({
          route: `${from} → ${to}`,
          cheapest: best.price,
          carrier: best.name,
          stops: best.stops,
          duration: best.duration,
          id: best.id,
          ref,
        })
      }

      setLatestSearch(session, allOffers, label, allRefs)
      await saveSession(session)

      rows.sort((x, y) => parsePrice(x.cheapest ?? '-') - parsePrice(y.cheapest ?? '-'))
      const notes: string[] = []
      if (
        returnDate &&
        rtStayDays(date, returnDate) > LONG_RT_STAY_DAYS &&
        rows.some((r) => r.cheapest === null)
      ) {
        notes.push(
          `Stays over ~${LONG_RT_STAY_DAYS} days often return no round-trip fares (Google max-stay); try two one-way compares.`,
        )
      }
      return { compare: label, rows, refs: allRefs, ...(notes.length ? { notes } : {}) }
    }),
  )
}
