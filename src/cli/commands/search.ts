import type { SearchQuery, SeatType } from '$lib/server/flights/search'
import { buildDatePairs, searchSingle } from '$lib/server/flights/search'
import { defineCommand } from 'citty'
import { loadConfig, withDefaults } from '../config'
import { applyFilters, sortOffers } from '../filter'
import { formatError, formatOffers } from '../format'
import { loadSession, routeTag, saveSession, throttle } from '../state'
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
    refresh: { type: 'boolean', description: 'Force fresh fetch (skip cache)', default: false },
  },
  async run({ args: rawArgs }) {
    const config = await loadConfig()
    const args = withDefaults(rawArgs, config, ['currency', 'fmt', 'seat', 'pax', 'limit'])

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
    const prev = await loadSession()
    const results: Array<{ flights: Omit<Offer, 'id'>[]; url: string; error?: string }> = []
    for (const [d, r] of pairs) {
      const tag = routeTag(query.from_airport, query.to_airport, d)
      const cached = prev?.searches?.[tag]
      if (cached && !args.refresh) {
        results.push({ flights: cached.offers, url: cached.offers[0]?.url ?? '' })
      } else {
        await throttle()
        const res = await searchSingle(d, r, query)
        results.push({
          flights: res.flights.map((f) => ({ ...f, url: res.url })),
          url: res.url,
          error: res.error,
        })
      }
    }

    const allFlights = results.flatMap((r) => r.flights)

    if (allFlights.length === 0) {
      const err = results.find((r) => r.error)?.error
      const hints: Record<string, string> = {
        http: 'Google returned an HTTP error (likely rate-limited). Try again in a few minutes.',
        no_script: 'Google served a consent/CAPTCHA page. Try again later or from a different IP.',
        no_data: 'Page loaded but flight data was missing. Google may have changed the page structure.',
        no_flights: 'No flights found for this route/date. Try different dates or fewer stops.',
      }
      const code = err === 'http' || err === 'no_script' ? 'BLOCKED' : (err ?? 'NO_RESULTS').toUpperCase()
      console.log(formatError(code, hints[err ?? 'no_flights'] ?? hints.no_flights, results[0]?.url))
      return
    }

    // Save unfiltered results to cache (so different filter combos don't corrupt it)
    const rawOffers: Offer[] = allFlights.map((f, i) => ({ ...f, id: `O${i + 1}` }))
    const tag = routeTag(query.from_airport, query.to_airport, query.date)
    const queryStr = `${query.from_airport} ${query.to_airport} ${query.date}`
    const rawEntry = { offers: rawOffers, query: queryStr, timestamp: Date.now() }

    let offers = applyFilters(rawOffers, {
      depAfter: args['dep-after'],
      depBefore: args['dep-before'],
      arrAfter: args['arr-after'],
      arrBefore: args['arr-before'],
      maxDur: args['max-dur'] ? Number.parseInt(args['max-dur']) : undefined,
      maxStops,
      direct: args.direct,
      carrier: args.carrier,
    })
    offers = sortOffers(offers, (args.sort as SortKey) ?? 'price')
    const limit = Number.parseInt(args.limit)
    const totalAfterFilter = offers.length
    offers = offers.slice(0, limit)
    offers = offers.map((o, i) => ({ ...o, id: `O${i + 1}` }))
    const truncated = totalAfterFilter > limit

    // Cache stores unfiltered; current session stores filtered (for inspect)
    const displayEntry = { offers, query: queryStr, timestamp: Date.now() }
    await saveSession({
      ...displayEntry,
      searches: { ...prev?.searches, [tag]: rawEntry },
    })

    console.log(
      formatOffers(offers, args.fmt as Format, args.fields, args.view as View | undefined),
    )
    if (truncated) {
      console.log(`\n  Showing ${limit} of ${totalAfterFilter} results. Use --limit to see more.`)
    }
  },
})
