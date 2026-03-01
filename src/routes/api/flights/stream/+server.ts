import { parseSearchQuery, buildDatePairs, searchSingle } from '$lib/server/flights/search'

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET({ url }) {
  const q = parseSearchQuery(url)
  const pairs = buildDatePairs(q)
  const enc = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (s: string) => controller.enqueue(enc.encode(s))

      enqueue(sseEvent('progress', { completed: 0, total: pairs.length }))

      let completed = 0
      let firstUrl = ''

      await Promise.allSettled(
        pairs.map(async ([d, r]) => {
          try {
            const result = await searchSingle(d, r, q)
            if (result.flights.length) enqueue(sseEvent('flights', result.flights))
            if (!firstUrl && result.url) firstUrl = result.url
          } catch (e) {
            const msg = e instanceof Error ? e.message.split('\n')[0] : String(e)
            enqueue(sseEvent('error', { detail: msg }))
          } finally {
            completed++
            enqueue(sseEvent('progress', { completed, total: pairs.length }))
          }
        }),
      )

      enqueue(sseEvent('done', { current_price: '', google_flights_url: firstUrl }))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
