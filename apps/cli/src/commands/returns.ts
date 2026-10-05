import { type SearchQuery, assignFlightIds, pickedFlights, searchSingle } from '@flights/core'
import { defineCommand } from 'citty'
import { fetcherFor } from '../chrome'
import { loadConfig, withDefaults } from '../config'
import { sortOffers } from '../filter'
import { formatError, formatOffers } from '../format'
import { printWithLegend } from '../legend'
import { loadSearchByRef, loadSession, throttle } from '../state'
import { type CacheQuery, type Format, type Offer, RETURN_FIELDS } from '../types'

export const returnsCommand = defineCommand({
  meta: { name: 'returns', description: 'List the return flights for an outbound from a trip search' },
  args: {
    id: { type: 'positional', description: 'Outbound offer ID from a trip search (e.g. Fa3b7)', required: true },
    fmt: { type: 'string', description: 'Output format: jsonl|tsv|table|brief', default: 'table' },
    fields: { type: 'string', description: 'Comma-separated fields' },
  },
  async run({ args: rawArgs }) {
    const args = withDefaults(rawArgs, await loadConfig(), ['fmt'])
    const session = await loadSession()
    if (!session) {
      console.log(formatError('NO_SESSION', 'No search results cached. Run `flt search` with a return date first.'))
      return
    }

    // The search that produced the ID holds the query the returns depend on; latest search first.
    const [ref, id] = args.id.includes(':') ? args.id.split(':') : ['', args.id]
    const refs = ref ? [ref] : [...(session.latest?.refs ?? []), ...Object.keys(session.searches).reverse()]
    let found: { offer: Offer; params: CacheQuery } | null = null
    for (const r of refs) {
      const entry = await loadSearchByRef(session, r)
      const offer = entry?.offers.find((o) => o.id.toUpperCase() === id.toUpperCase())
      if (offer && entry?.params) {
        found = { offer, params: entry.params }
        break
      }
    }
    if (!found) {
      console.log(formatError('NOT_FOUND', `Offer '${args.id}' not found in this session's searches.`))
      return
    }

    const { offer, params } = found
    if (!params.return_date) {
      console.log(formatError('NOT_A_TRIP', `${offer.id} comes from a one-way search; returns need a return date.`))
      return
    }
    const picked = pickedFlights(offer)
    if (!picked) {
      console.log(formatError('STALE', `${offer.id} was cached before flt read leg dates. Rerun the search with --refresh.`))
      return
    }

    const query: SearchQuery = {
      from_airport: params.from_airport,
      to_airport: params.to_airport,
      date: params.departure_date,
      return_date: params.return_date,
      return_from: params.return_from,
      adults: params.adults,
      children: params.children,
      infants_in_seat: params.infants_in_seat,
      infants_on_lap: params.infants_on_lap,
      seat: params.seat,
      max_stops: params.max_stops ?? undefined,
      currency: params.currency,
      filters: params.filters,
    }
    await throttle()
    const res = await searchSingle(params.departure_date, params.return_date, query, fetcherFor(query), picked)
    if (!res.flights.length) {
      console.log(formatError((res.error ?? 'no_flights').toUpperCase(), 'Google listed no return flights for this outbound. Try again.', res.url))
      return
    }

    // ponytail: return options aren't cached or kept in the session; save them when inspect/fav needs them
    const returns = assignFlightIds(
      res.flights.map((f) => ({ ...f, departure_date: f.legs[0]?.departure_date ?? params.return_date ?? '', url: res.url })),
    )
    printWithLegend(formatOffers(sortOffers(returns, 'price'), args.fmt as Format, args.fields ?? RETURN_FIELDS))
    console.log(
      `\n  outbound: ${offer.id} ${offer.name} ${offer.departure_date} ${offer.departure}→${offer.arrival}${offer.arrival_time_ahead}` +
        ` · home from ${query.return_from ?? query.to_airport} ${params.return_date}` +
        `\n  Prices are for the whole trip with this outbound.`,
    )
  },
})
