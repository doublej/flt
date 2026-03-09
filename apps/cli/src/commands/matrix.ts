import { type SearchQuery, type SeatType, mergeExclusions, parseFlexDate, searchSingle } from '@flights/core'
import { type CellResult, dateRange, pickCheapest } from '@flights/core'
import { defineCommand } from 'citty'
import { applyFilters, parsePrice } from '../filter'
import { loadConfig, withDefaults } from '../config'
import { formatError } from '../format'
import {
  createEmptySession,
  describeSearchRequest,
  ensureActiveSession,
  loadCachedSearch,
  loadSession,
  rememberSearch,
  saveCachedSearch,
  saveSession,
  setLatestSearch,
  throttle,
} from '../state'
import type { Offer, SessionState, SortKey } from '../types'
import { normalizeDate, parsePax, validateAirport } from '../validate'

async function fetchAndCache(
  dep: string,
  ret: string | null,
  query: SearchQuery,
  session: SessionState,
): Promise<{ offers: Offer[]; ref: string }> {
  const cached = await loadCachedSearch(query, dep, ret)
  if (cached) {
    rememberSearch(session, cached)
    return { offers: cached.offers, ref: cached.ref }
  }

  await throttle()
  const result = await searchSingle(dep, ret, query)
  const entry = await saveCachedSearch(
    query,
    dep,
    ret,
    result.flights.map((f) => ({ ...f, url: result.url })),
  )
  rememberSearch(session, entry)
  return { offers: entry.offers, ref: entry.ref }
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
    carrier: { type: 'string', description: 'Filter by airline name/code' },
    'exclude-carrier': {
      type: 'string',
      description: 'Exclude airlines (comma-separated names/codes)',
    },
    'exclude-hub': {
      type: 'string',
      description: 'Exclude layover airports (comma-separated IATA codes)',
    },
    'exclude-region': {
      type: 'string',
      description: 'Exclude hub regions: gulf, middleeast, russia, belarus (comma-separated, mixable with IATA codes)',
    },
    direct: { type: 'boolean', description: 'Direct flights only', default: false },
    currency: { type: 'string', default: 'EUR' },
    fmt: { type: 'string', description: 'Output format: table|tsv|jsonl', default: 'table' },
    sort: { type: 'string', description: 'Sort one-way results by: price|dep (default: dep)', default: 'dep' },
    limit: { type: 'string', description: 'Max rows for one-way results', default: '50' },
  },
  async run({ args: rawArgs }) {
    const config = await loadConfig()
    const args = withDefaults(rawArgs, config, ['currency', 'fmt', 'seat', 'pax', 'limit', 'exclude_hub', 'exclude_region'])

    validateAirport(args.from.toUpperCase(), 'Origin')
    validateAirport(args.to.toUpperCase(), 'Destination')
    const dateStart = normalizeDate(args.dateStart, 'Start date')
    const dateEnd = normalizeDate(args.dateEnd, 'End date')
    // Guard: citty may bleed flag values (e.g. --sort price) into optional positionals.
    // Probe with parseFlexDate first — if it's not a date, treat as one-way.
    const returnStart =
      args.returnStart && parseFlexDate(args.returnStart)
        ? normalizeDate(args.returnStart, 'Return start')
        : undefined
    const returnEnd =
      args.returnEnd && parseFlexDate(args.returnEnd)
        ? normalizeDate(args.returnEnd, 'Return end')
        : undefined

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

    const session: SessionState = (await loadSession()) ?? createEmptySession()
    const route = `${query.from_airport} → ${query.to_airport}`
    const { session_: activeSession, autoStarted } = ensureActiveSession(session, route)
    if (autoStarted) {
      console.error(
        `[session] Auto-started "${activeSession.name}" (${activeSession.id}). Use \`flt session start "name"\` to name sessions, or \`flt session close\` to end one.`,
      )
    }

    const excludeHub = mergeExclusions(args['exclude-hub'], args['exclude-region'])
    const filterOpts = {
      maxDur,
      maxStops,
      direct: args.direct,
      carrier: args.carrier,
      excludeCarrier: args['exclude-carrier'],
      excludeHub,
    }
    const hasFilter = !!(args.carrier || args['exclude-carrier'] || args['exclude-hub'] || args.direct)
    const filterOffers = (offers: Offer[]) =>
      hasFilter ? applyFilters(offers, filterOpts) : offers

    const depDates = dateRange(dateStart, dateEnd)
    const retDates = returnStart && returnEnd ? dateRange(returnStart, returnEnd) : null

    const allOffers: Offer[] = []
    const allRefs: string[] = []

    if (!retDates) {
      const cells: CellResult[] = []
      for (const d of depDates) {
        const { offers, ref } = await fetchAndCache(d, null, query, session)
        const filtered = filterOffers(offers)
        allOffers.push(...filtered)
        if (ref) allRefs.push(ref)
        cells.push(pickCheapest(filtered, maxDur) ?? { ...EMPTY_CELL, dep: d })
      }
      setLatestSearch(session, allOffers, describeSearchRequest(query), allRefs)
      await saveSession(session)
      const sortKey = (args.sort as SortKey) ?? 'dep'
      if (sortKey === 'price') cells.sort((a, b) => parsePrice(a.cheapest) - parsePrice(b.cheapest))
      const limit = Number.parseInt(args.limit)
      if (limit > 0 && cells.length > limit) cells.splice(limit)
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
      const { offers, ref } = await fetchAndCache(d, r, query, session)
      const filtered = filterOffers(offers)
      allOffers.push(...filtered)
      if (ref) allRefs.push(ref)
      cells.push(pickCheapest(filtered, maxDur) ?? { ...EMPTY_CELL, dep: d, ret: r })
    }
    setLatestSearch(session, allOffers, describeSearchRequest(query), allRefs)
    await saveSession(session)
    printGrid(depDates, retDates, cells, args.fmt)
  },
})
