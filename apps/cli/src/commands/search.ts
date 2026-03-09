import { type SearchQuery, type SeatType, buildDatePairs, mergeExclusions, searchSingle } from '@flights/core'
import { defineCommand } from 'citty'
import { loadConfig, withDefaults } from '../config'
import { applyFilters, sortOffers } from '../filter'
import { formatError, formatOffers } from '../format'
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
import type { Format, Offer, SortKey, View } from '../types'
import { normalizeDate, parsePax, validateAirport } from '../validate'

export const searchCommand = defineCommand({
  meta: { name: 'search', description: 'Search flights' },
  args: {
    from: { type: 'positional', description: 'Origin airport (IATA)', required: true },
    to: { type: 'positional', description: 'Destination airport (IATA)', required: true },
    date: { type: 'positional', description: 'Departure date (YYYY-MM-DD)', required: true },
    returnDate: { type: 'positional', description: 'Return date (YYYY-MM-DD)', required: false },
    'date-end': { type: 'string', description: 'Flexible departure end date' },
    'return-date-end': { type: 'string', description: 'Flexible return end date' },
    seat: { type: 'string', description: 'Cabin class', default: 'economy' },
    pax: { type: 'string', description: 'Passengers: 1ad, 2ad1ch, etc.', default: '1ad' },
    'max-stops': { type: 'string', description: 'Max stops (0, 1, 2)' },
    currency: { type: 'string', description: 'Currency code', default: 'EUR' },
    fmt: { type: 'string', description: 'Output format: jsonl|tsv|table|brief', default: 'table' },
    fields: { type: 'string', description: 'Comma-separated fields' },
    view: { type: 'string', description: 'Field preset: min|std|full' },
    sort: { type: 'string', description: 'Sort by: price|dur|stops|dep', default: 'price' },
    limit: { type: 'string', description: 'Max results', default: '100' },
    'dep-after': { type: 'string', description: 'Depart after HH:MM' },
    'dep-before': { type: 'string', description: 'Depart before HH:MM' },
    'arr-after': { type: 'string', description: 'Arrive after HH:MM' },
    'arr-before': { type: 'string', description: 'Arrive before HH:MM' },
    'max-dur': { type: 'string', description: 'Max duration in minutes' },
    direct: { type: 'boolean', description: 'Direct flights only', default: false },
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
    refresh: { type: 'boolean', description: 'Force fresh fetch (skip cache)', default: false },
  },
  async run({ args: rawArgs }) {
    const config = await loadConfig()
    const args = withDefaults(rawArgs, config, ['currency', 'fmt', 'seat', 'pax', 'limit', 'exclude_hub', 'exclude_region'])

    validateAirport(args.from.toUpperCase(), 'Origin')
    validateAirport(args.to.toUpperCase(), 'Destination')
    const date = normalizeDate(args.date, 'Departure date')
    const returnDate = args.returnDate ? normalizeDate(args.returnDate, 'Return date') : undefined
    const dateEnd = args['date-end']
      ? normalizeDate(args['date-end'], 'Departure end date')
      : undefined
    const returnDateEnd = args['return-date-end']
      ? normalizeDate(args['return-date-end'], 'Return end date')
      : undefined

    const pax = parsePax(args.pax)
    const maxStops = args['max-stops'] != null ? Number.parseInt(args['max-stops']) : undefined

    const query: SearchQuery = {
      from_airport: args.from.toUpperCase(),
      to_airport: args.to.toUpperCase(),
      date,
      return_date: returnDate,
      date_end: dateEnd,
      return_date_end: returnDateEnd,
      ...pax,
      seat: args.seat as SeatType,
      max_stops: maxStops,
      currency: args.currency,
    }

    const pairs = buildDatePairs(query)
    const session = (await loadSession()) ?? createEmptySession()
    const route = `${query.from_airport} → ${query.to_airport}`
    const { session_: activeSession, autoStarted } = ensureActiveSession(session, route)
    if (autoStarted) {
      console.error(
        `[session] Auto-started "${activeSession.name}" (${activeSession.id}). Use \`flt session start "name"\` to name sessions, or \`flt session close\` to end one.`,
      )
    }
    const results: Array<{ offers: Offer[]; ref: string; url: string; error?: string }> = []
    for (const [d, r] of pairs) {
      const cached = args.refresh ? null : await loadCachedSearch(query, d, r)
      if (cached) {
        rememberSearch(session, cached)
        results.push({ offers: cached.offers, ref: cached.ref, url: cached.offers[0]?.url ?? '' })
        continue
      }

      await throttle()
      const res = await searchSingle(d, r, query)
      if (!res.flights.length) {
        results.push({ offers: [], ref: '', url: res.url, error: res.error })
        continue
      }

      const entry = await saveCachedSearch(
        query,
        d,
        r,
        res.flights.map((f) => ({ ...f, url: res.url })),
      )
      rememberSearch(session, entry)
      results.push({ offers: entry.offers, ref: entry.ref, url: res.url, error: res.error })
    }

    const allFlights = results.flatMap((r) => r.offers)

    if (allFlights.length === 0) {
      const err = results.find((r) => r.error)?.error
      const hints: Record<string, string> = {
        http: 'Google returned an HTTP error (likely rate-limited). Try again in a few minutes.',
        no_script: 'Google served a consent/CAPTCHA page. Try again later or from a different IP.',
        no_data:
          'Page loaded but flight data was missing. Google may have changed the page structure.',
        no_flights: 'No flights found for this route/date. Try different dates or fewer stops.',
      }
      const code =
        err === 'http' || err === 'no_script' ? 'BLOCKED' : (err ?? 'NO_RESULTS').toUpperCase()
      console.log(
        formatError(code, hints[err ?? 'no_flights'] ?? hints.no_flights, results[0]?.url),
      )
      return
    }

    const rawCount = allFlights.length
    const excludeHub = mergeExclusions(args['exclude-hub'], args['exclude-region'])
    const hasFilter = !!(
      args.carrier ||
      args['exclude-carrier'] ||
      excludeHub ||
      args.direct ||
      args['dep-after'] ||
      args['dep-before'] ||
      args['arr-after'] ||
      args['arr-before'] ||
      args['max-dur']
    )
    let offers = applyFilters(allFlights, {
      depAfter: args['dep-after'],
      depBefore: args['dep-before'],
      arrAfter: args['arr-after'],
      arrBefore: args['arr-before'],
      maxDur: args['max-dur'] ? Number.parseInt(args['max-dur']) : undefined,
      maxStops,
      direct: args.direct,
      carrier: args.carrier,
      excludeCarrier: args['exclude-carrier'],
      excludeHub,
    })
    if (hasFilter && offers.length === 0) {
      console.log(
        formatError('NO_RESULTS', `All ${rawCount} results filtered out, 0 remaining. Relax filters and retry.`),
      )
      return
    }
    offers = sortOffers(offers, (args.sort as SortKey) ?? 'price')
    const limit = Number.parseInt(args.limit)
    const totalAfterFilter = offers.length
    offers = offers.slice(0, limit)
    const truncated = totalAfterFilter > limit

    // Cache stores per-pair unfiltered results; latest session stores the current filtered view.
    setLatestSearch(
      session,
      offers,
      describeSearchRequest(query),
      results.flatMap((result) => (result.ref ? [result.ref] : [])),
    )
    await saveSession(session)

    console.log(
      formatOffers(offers, args.fmt as Format, args.fields, args.view as View | undefined),
    )

    const refs = results.flatMap((result) => (result.ref ? [result.ref] : []))
    const refLabel = refs.length === 1 ? refs[0] : `${refs.length} refs`
    const notes: string[] = []
    if (truncated) notes.push(`Showing ${limit} of ${totalAfterFilter} results. Use --limit to see more.`)
    notes.push(`ref: ${refLabel}`)
    console.log(`\n  ${notes.join('\n  ')}`)
  },
})
