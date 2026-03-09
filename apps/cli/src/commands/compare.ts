import { type SearchQuery, type SeatType, mergeExclusions, searchSingle } from '@flights/core'
import { defineCommand } from 'citty'
import { loadConfig, withDefaults } from '../config'
import { applyFilters, parsePrice, sortOffers } from '../filter'
import { formatError } from '../format'
import {
  createEmptySession,
  ensureActiveSession,
  loadCachedSearch,
  loadSession,
  rememberSearch,
  saveCachedSearch,
  saveSession,
  setLatestSearch,
  throttle,
} from '../state'
import type { Offer } from '../types'
import { normalizeDate, parsePax, validateAirport } from '../validate'

interface Row {
  route: string
  cheapest: string
  carrier: string
  stops: number
  duration: string
  id: string
}

function stopsLabel(n: number): string {
  if (n < 0) return '-'
  if (n === 0) return 'direct'
  return `${n} stop${n > 1 ? 's' : ''}`
}

function printRows(rows: Row[], fmt: string): void {
  if (fmt === 'jsonl') {
    for (const r of rows) console.log(JSON.stringify(r))
    return
  }
  if (fmt === 'brief') {
    for (const r of rows)
      console.log(
        `${r.id} ${r.cheapest} ${r.route} ${r.carrier} ${stopsLabel(r.stops)} ${r.duration}`,
      )
    return
  }
  const headers = ['route', 'cheapest', 'carrier', 'stops', 'duration', 'id']
  const data = rows.map((r) => [
    r.route,
    r.cheapest,
    r.carrier,
    stopsLabel(r.stops),
    r.duration,
    r.id,
  ])
  const widths = headers.map((h, i) => Math.max(h.length, ...data.map((r) => r[i].length)))
  console.log(headers.map((h, i) => h.padEnd(widths[i])).join('  '))
  for (const r of data) console.log(r.map((v, i) => v.padEnd(widths[i])).join('  '))
}

export const compareCommand = defineCommand({
  meta: {
    name: 'compare',
    description: 'Compare cheapest prices across multiple origins or destinations',
  },
  args: {
    from: {
      type: 'positional',
      description: 'Origin(s) — comma-separated IATA codes',
      required: true,
    },
    to: {
      type: 'positional',
      description: 'Destination(s) — comma-separated IATA codes',
      required: true,
    },
    date: { type: 'positional', description: 'Departure date (YYYY-MM-DD)', required: true },
    seat: { type: 'string', default: 'economy' },
    pax: { type: 'string', default: '1ad' },
    'max-stops': { type: 'string' },
    currency: { type: 'string', default: 'EUR' },
    fmt: { type: 'string', default: 'table' },
    direct: { type: 'boolean', default: false },
    carrier: { type: 'string' },
    'exclude-carrier': { type: 'string' },
    'exclude-hub': { type: 'string' },
    'exclude-region': { type: 'string' },
    'max-dur': { type: 'string' },
    refresh: { type: 'boolean', default: false },
  },
  async run({ args: rawArgs }) {
    const config = await loadConfig()
    const args = withDefaults(rawArgs, config, ['currency', 'fmt', 'seat', 'pax'])

    const origins = args.from.split(',').map((s: string) => s.trim().toUpperCase())
    const dests = args.to.split(',').map((s: string) => s.trim().toUpperCase())
    if (origins.length > 1 && dests.length > 1) {
      console.log(
        formatError(
          'BAD_INPUT',
          'Only one side can have multiple airports. Use A,B,C TO or FROM A,B,C.',
        ),
      )
      return
    }

    const date = normalizeDate(args.date, 'Departure date')
    const pairs = origins.flatMap((o: string) => dests.map((d: string) => [o, d] as const))
    for (const [o, d] of pairs) {
      validateAirport(o, 'Origin')
      validateAirport(d, 'Destination')
    }

    const pax = parsePax(args.pax)
    const maxStops = args['max-stops'] != null ? Number.parseInt(args['max-stops']) : undefined
    const excludeHub = mergeExclusions(args['exclude-hub'], args['exclude-region'])
    const filterOpts = {
      maxDur: args['max-dur'] ? Number.parseInt(args['max-dur']) : undefined,
      maxStops,
      direct: args.direct,
      carrier: args.carrier,
      excludeCarrier: args['exclude-carrier'],
      excludeHub,
    }

    const session = (await loadSession()) ?? createEmptySession()
    const label =
      origins.length > 1
        ? `${origins.join('/')} → ${dests[0]}`
        : `${origins[0]} → ${dests.join('/')}`
    const { autoStarted } = ensureActiveSession(session, label)
    if (autoStarted) console.error(`[session] Auto-started "${label}".`)

    const rows: Row[] = []
    const allOffers: Offer[] = []
    const allRefs: string[] = []

    for (const [from, to] of pairs) {
      const query: SearchQuery = {
        from_airport: from,
        to_airport: to,
        date,
        ...pax,
        seat: args.seat as SeatType,
        max_stops: maxStops,
        currency: args.currency,
      }

      const cached = args.refresh ? null : await loadCachedSearch(query, date, null)
      let offers: Offer[]
      let ref = ''

      if (cached) {
        rememberSearch(session, cached)
        offers = cached.offers
        ref = cached.ref
      } else {
        await throttle()
        const res = await searchSingle(date, null, query)
        if (!res.flights.length) {
          rows.push({
            route: `${from} → ${to}`,
            cheapest: '-',
            carrier: '-',
            stops: -1,
            duration: '-',
            id: '-',
          })
          continue
        }
        const entry = await saveCachedSearch(
          query,
          date,
          null,
          res.flights.map((f) => ({ ...f, url: res.url })),
        )
        rememberSearch(session, entry)
        offers = entry.offers
        ref = entry.ref
      }

      if (ref) allRefs.push(ref)
      const filtered = applyFilters(offers, filterOpts)
      allOffers.push(...filtered)

      if (filtered.length === 0) {
        rows.push({
          route: `${from} → ${to}`,
          cheapest: '-',
          carrier: '-',
          stops: -1,
          duration: '-',
          id: '-',
        })
      } else {
        const best = sortOffers(filtered, 'price')[0]
        rows.push({
          route: `${from} → ${to}`,
          cheapest: best.price,
          carrier: best.name,
          stops: best.stops,
          duration: best.duration,
          id: best.id,
        })
      }
    }

    setLatestSearch(session, allOffers, label, allRefs)
    await saveSession(session)

    rows.sort((a, b) => parsePrice(a.cheapest) - parsePrice(b.cheapest))
    printRows(rows, args.fmt)
    if (allRefs.length) console.log(`\n  refs: ${allRefs.join(', ')}`)
  },
})
