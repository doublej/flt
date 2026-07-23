import {
  LONG_RT_STAY_DAYS,
  type CellResult,
  type Offer,
  type SearchQuery,
  type SeatType,
  applyFilters,
  dateRange,
  describeSearchRequest,
  ensureActiveSession,
  parsePrice,
  pickCheapest,
  rtStayDays,
  saveSession,
  setLatestSearch,
} from '@flights/core'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { ToolError, assertAirport, assertDate, fetchAndCache, guard, withSession } from '../shared'
import { filterShape, paxShape, toFilterOpts } from './search'

const EMPTY_CELL: CellResult = {
  dep: '',
  ret: null,
  cheapest: '-',
  carrier: '-',
  stops: -1,
  duration: '-',
}

export function registerMatrix(server: McpServer): void {
  server.registerTool(
    'matrix',
    {
      title: 'Date-flex price grid',
      description:
        'Cheapest price per date across a departure date range (one-way) or per ' +
        'departure/return combination (round trip, max 21 combinations).',
      inputSchema: {
        from: z.string().describe('Origin IATA code'),
        to: z.string().describe('Destination IATA code'),
        dateStart: z.string().describe('Departure range start date'),
        dateEnd: z.string().describe('Departure range end date'),
        returnStart: z.string().optional().describe('Return range start date (round trip)'),
        returnEnd: z.string().optional().describe('Return range end date (round trip)'),
        seat: z.enum(['economy', 'premium-economy', 'business', 'first']).default('economy'),
        ...paxShape,
        currency: z.string().default('EUR'),
        ...filterShape,
        sort: z
          .enum(['price', 'dep'])
          .default('dep')
          .describe('One-way only: sort cells by price or date'),
        limit: z.number().int().min(1).max(120).default(50).describe('One-way only: max cells'),
        refresh: z.boolean().default(false).describe('Force fresh fetch, skip cache'),
      },
    },
    guard(async (a) => {
      const from = assertAirport(a.from, 'Origin')
      const to = assertAirport(a.to, 'Destination')
      const dateStart = assertDate(a.dateStart, 'Start date')
      const dateEnd = assertDate(a.dateEnd, 'End date')
      const returnStart = a.returnStart ? assertDate(a.returnStart, 'Return start') : undefined
      const returnEnd = a.returnEnd ? assertDate(a.returnEnd, 'Return end') : undefined

      const query: SearchQuery = {
        from_airport: from,
        to_airport: to,
        date: dateStart,
        adults: a.adults,
        children: a.children,
        infants_in_seat: a.infantsInSeat,
        infants_on_lap: a.infantsOnLap,
        seat: a.seat as SeatType,
        max_stops: a.maxStops,
        currency: a.currency,
      }

      const session = await withSession()
      const route = `${from} → ${to}`
      ensureActiveSession(session, route)

      const filterOpts = toFilterOpts(a)
      const hasFilter = !!(a.carrier || a.excludeCarrier || filterOpts.excludeHub || a.direct || a.maxDur)
      const filterOffers = (offers: Offer[]) => (hasFilter ? applyFilters(offers, filterOpts) : offers)

      const depDates = dateRange(dateStart, dateEnd)
      const retDates = returnStart && returnEnd ? dateRange(returnStart, returnEnd) : null

      const allOffers: Offer[] = []
      const allRefs: string[] = []

      if (!retDates) {
        const cells: CellResult[] = []
        for (const d of depDates) {
          const { offers, ref, err } = await fetchAndCache(d, null, query, session, a.refresh)
          const filtered = filterOffers(offers)
          allOffers.push(...filtered)
          if (ref) allRefs.push(ref)
          const cell = pickCheapest(filtered, a.maxDur)
          cells.push(cell ?? { ...EMPTY_CELL, dep: d, err: err ?? 'filtered' })
        }
        setLatestSearch(session, allOffers, describeSearchRequest(query), allRefs)
        await saveSession(session)
        if (a.sort === 'price') cells.sort((x, y) => parsePrice(x.cheapest) - parsePrice(y.cheapest))
        if (cells.length > a.limit) cells.splice(a.limit)
        return { route, cells, refs: allRefs }
      }

      const pairs: Array<[string, string]> = []
      for (const d of depDates) {
        for (const r of retDates) {
          if (r >= d) pairs.push([d, r])
        }
      }
      if (pairs.length > 21) {
        throw new ToolError('TOO_MANY', `${pairs.length} combinations exceed max 21. Narrow dates.`)
      }

      const cells: CellResult[] = []
      for (const [d, r] of pairs) {
        const { offers, ref, err } = await fetchAndCache(d, r, query, session, a.refresh)
        const filtered = filterOffers(offers)
        allOffers.push(...filtered)
        if (ref) allRefs.push(ref)
        const cell = pickCheapest(filtered, a.maxDur)
        cells.push(cell ?? { ...EMPTY_CELL, dep: d, ret: r, err: err ?? 'filtered' })
      }
      setLatestSearch(session, allOffers, describeSearchRequest(query), allRefs)
      await saveSession(session)

      const notes: string[] = []
      if (
        cells.some(
          (c) => c.err === 'no_flights' && c.ret && rtStayDays(c.dep, c.ret) > LONG_RT_STAY_DAYS,
        )
      ) {
        notes.push(
          `Stays over ~${LONG_RT_STAY_DAYS} days often return no round-trip fares (Google max-stay); try two one-way matrices.`,
        )
      }
      return { route, cells, refs: allRefs, ...(notes.length ? { notes } : {}) }
    }),
  )
}
