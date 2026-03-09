import { json, error } from '@sveltejs/kit'
import { parseSearchQuery, buildDatePairs, searchSingle } from '@flights/core/search'

export async function GET({ url }) {
  const q = parseSearchQuery(url)
  if (!q.from_airport || !q.to_airport || !q.date) error(400, 'Missing required params')

  const pairs = buildDatePairs(q)

  const results = await Promise.allSettled(pairs.map(([d, r]) => searchSingle(d, r, q)))

  const allFlights = results.flatMap((r) => (r.status === 'fulfilled' ? r.value.flights : []))
  const firstUrl = results.find(
    (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof searchSingle>>> =>
      r.status === 'fulfilled' && !!r.value.url,
  )?.value.url ?? ''

  if (!allFlights.length && !firstUrl) error(502, 'No results from flight search')

  return json({ current_price: '', flights: allFlights, google_flights_url: firstUrl })
}
