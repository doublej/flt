import type { SearchQuery, SeatType } from '$lib/server/flights/search'
import { searchSingle } from '$lib/server/flights/search'
import { defineCommand } from 'citty'
import { loadConfig, withDefaults } from '../config'
import { parseDur, parsePrice } from '../filter'
import { formatError } from '../format'
import { loadSession, routeTag, saveSession, throttle } from '../state'
import type { Offer, SessionState } from '../types'
import { normalizeDate, parsePax, validateAirport } from '../validate'

function dateRange(start: string, end: string): string[] {
  const s = new Date(start)
  const e = new Date(end)
  const days = Math.round((e.getTime() - s.getTime()) / 86400000)
  return Array.from({ length: days + 1 }, (_, i) => {
    const d = new Date(s)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

interface CellResult {
  dep: string
  ret: string | null
  cheapest: string
  carrier: string
  stops: number
  duration: string
}

function pickCheapest(offers: Offer[], maxDur?: number): CellResult | null {
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

async function fetchAndCache(
  dep: string,
  ret: string | null,
  query: SearchQuery,
  session: SessionState,
): Promise<Offer[]> {
  await throttle()
  const result = await searchSingle(dep, ret, query)
  const offers: Offer[] = result.flights.map((f, i) => ({
    ...f,
    id: `O${i + 1}`,
    url: result.url,
  }))

  // Save to session so `flt search` / `flt inspect` can access the same data
  const tag = routeTag(query.from_airport, query.to_airport, dep)
  const queryStr = `${query.from_airport} ${query.to_airport} ${dep}`
  session.searches = {
    ...session.searches,
    [tag]: { offers, query: queryStr, timestamp: Date.now() },
  }
  return offers
}

function printOneWay(cells: CellResult[], fmt: string): void {
  if (fmt === 'jsonl') {
    for (const c of cells)
      console.log(
        JSON.stringify({
          date: c.dep,
          cheapest: c.cheapest,
          carrier: c.carrier,
          stops: c.stops,
          duration: c.duration,
        }),
      )
    return
  }
  if (fmt === 'tsv') {
    console.log('date\tcheapest\tcarrier\tstops\tduration')
    for (const c of cells)
      console.log(`${c.dep}\t${c.cheapest}\t${c.carrier}\t${c.stops}\t${c.duration}`)
    return
  }
  const rows = cells.map((c) => [c.dep, c.cheapest, c.carrier, String(c.stops), c.duration])
  const headers = ['date', 'cheapest', 'carrier', 'stops', 'duration']
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)))
  console.log(headers.map((h, i) => h.padEnd(widths[i])).join('  '))
  for (const r of rows) console.log(r.map((v, i) => v.padEnd(widths[i])).join('  '))
}

function printGrid(depDates: string[], retDates: string[], cells: CellResult[], fmt: string): void {
  if (fmt === 'jsonl') {
    for (const c of cells)
      console.log(JSON.stringify({ dep: c.dep, ret: c.ret, cheapest: c.cheapest }))
    return
  }
  const grid = new Map<string, string>()
  for (const c of cells) grid.set(`${c.dep}|${c.ret}`, c.cheapest)

  const retLabels = retDates.map((r) => r.slice(5))
  const header = `${'out\\back'.padEnd(12)}${retLabels.map((r) => r.padEnd(8)).join('')}`
  console.log(header)
  for (const d of depDates) {
    const vals = retDates.map((r) => (grid.get(`${d}|${r}`) ?? '-').padEnd(8))
    console.log(`${d.padEnd(12)}${vals.join('')}`)
  }
}

const EMPTY_CELL: CellResult = {
  dep: '',
  ret: null,
  cheapest: '-',
  carrier: '-',
  stops: -1,
  duration: '-',
}

export const matrixCommand = defineCommand({
  meta: { name: 'matrix', description: 'Date-flex price grid' },
  args: {
    from: { type: 'positional', description: 'Origin airport (IATA)', required: true },
    to: { type: 'positional', description: 'Destination airport (IATA)', required: true },
    dateStart: { type: 'positional', description: 'Start date (YYYY-MM-DD)', required: true },
    dateEnd: { type: 'positional', description: 'End date (YYYY-MM-DD)', required: true },
    returnStart: { type: 'positional', description: 'Return start date', required: false },
    returnEnd: { type: 'positional', description: 'Return end date', required: false },
    seat: { type: 'string', default: 'economy' },
    pax: { type: 'string', default: '1ad' },
    'max-stops': { type: 'string' },
    'max-dur': { type: 'string', description: 'Max duration in minutes (filters before cheapest)' },
    currency: { type: 'string', default: 'EUR' },
    fmt: { type: 'string', description: 'Output format: table|tsv|jsonl', default: 'table' },
  },
  async run({ args: rawArgs }) {
    const config = await loadConfig()
    const args = withDefaults(rawArgs, config, ['currency', 'fmt', 'seat', 'pax'])

    validateAirport(args.from.toUpperCase(), 'Origin')
    validateAirport(args.to.toUpperCase(), 'Destination')
    const dateStart = normalizeDate(args.dateStart, 'Start date')
    const dateEnd = normalizeDate(args.dateEnd, 'End date')
    const returnStart = args.returnStart ? normalizeDate(args.returnStart, 'Return start') : undefined
    const returnEnd = args.returnEnd ? normalizeDate(args.returnEnd, 'Return end') : undefined

    const pax = parsePax(args.pax)
    const maxStops = args['max-stops'] != null ? Number.parseInt(args['max-stops']) : undefined
    const maxDur = args['max-dur'] != null ? Number.parseInt(args['max-dur']) : undefined
    const query: SearchQuery = {
      from_airport: args.from.toUpperCase(),
      to_airport: args.to.toUpperCase(),
      date: dateStart,
      ...pax,
      seat: args.seat as SeatType,
      max_stops: maxStops,
      currency: args.currency,
    }

    const session: SessionState = (await loadSession()) ?? {
      offers: [],
      query: '',
      timestamp: Date.now(),
    }

    const depDates = dateRange(dateStart, dateEnd)
    const retDates =
      returnStart && returnEnd ? dateRange(returnStart, returnEnd) : null

    if (!retDates) {
      const cells: CellResult[] = []
      for (const d of depDates) {
        const offers = await fetchAndCache(d, null, query, session)
        cells.push(pickCheapest(offers, maxDur) ?? { ...EMPTY_CELL, dep: d })
      }
      await saveSession(session)
      printOneWay(cells, args.fmt)
      return
    }

    const pairs: Array<[string, string]> = []
    for (const d of depDates) {
      for (const r of retDates) {
        if (r >= d) pairs.push([d, r])
      }
    }
    if (pairs.length > 21) {
      console.log(
        formatError('TOO_MANY', `${pairs.length} combinations exceed max 21. Narrow dates.`),
      )
      return
    }

    const cells: CellResult[] = []
    for (const [d, r] of pairs) {
      const offers = await fetchAndCache(d, r, query, session)
      cells.push(pickCheapest(offers, maxDur) ?? { ...EMPTY_CELL, dep: d, ret: r })
    }
    await saveSession(session)
    printGrid(depDates, retDates, cells, args.fmt)
  },
})
