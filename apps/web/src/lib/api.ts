import type { Airport, Flight, SearchParams, SearchResult } from './types'

export async function searchAirports(query: string): Promise<Airport[]> {
  if (query.length < 2) return []
  const res = await fetch(`/api/airports?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Airport search failed')
  return res.json()
}

const optionalParams: (keyof SearchParams)[] = [
  'return_date',
  'date_end',
  'return_date_end',
  'adults',
  'children',
  'infants_in_seat',
  'infants_on_lap',
  'seat',
  'max_stops',
  'currency',
]

function buildFlightUrl(params: SearchParams, path: string): URL {
  const url = new URL(path, window.location.origin)
  url.searchParams.set('from_airport', params.from_airport)
  url.searchParams.set('to_airport', params.to_airport)
  url.searchParams.set('date', params.date)
  for (const key of optionalParams) {
    const val = params[key]
    if (val !== undefined && val !== '') url.searchParams.set(key, String(val))
  }
  return url
}

export async function searchFlights(params: SearchParams): Promise<SearchResult> {
  const res = await fetch(buildFlightUrl(params, '/api/flights'))
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Search failed' }))
    throw new Error(body.detail || 'Search failed')
  }
  return res.json()
}

export interface StreamCallbacks {
  onFlights: (flights: Flight[]) => void
  onProgress: (completed: number, total: number) => void
  onDone: (meta: { current_price: string; google_flights_url: string }) => void
  onError: (detail: string) => void
}

interface SSEEvent {
  event: string
  data: string
}

function parseSingleBlock(block: string): SSEEvent | null {
  let event = ''
  let data = ''
  for (const line of block.split('\n')) {
    if (line.startsWith('event: ')) event = line.slice(7)
    else if (line.startsWith('data: ')) data = line.slice(6)
  }
  return event && data ? { event, data } : null
}

function parseSSEChunk(chunk: string, buffer: string): { events: SSEEvent[]; remaining: string } {
  const blocks = (buffer + chunk).split('\n\n')
  const remaining = blocks.pop() ?? ''
  const events = blocks.map(parseSingleBlock).filter((e): e is SSEEvent => e !== null)
  return { events, remaining }
}

function dispatchSSEEvent(ev: SSEEvent, cb: StreamCallbacks) {
  if (ev.event === 'flights') cb.onFlights(JSON.parse(ev.data))
  else if (ev.event === 'progress') {
    const p = JSON.parse(ev.data)
    cb.onProgress(p.completed, p.total)
  } else if (ev.event === 'done') cb.onDone(JSON.parse(ev.data))
  else if (ev.event === 'error') cb.onError(JSON.parse(ev.data).detail)
}

async function readStream(body: ReadableStream<Uint8Array>, cb: StreamCallbacks) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const result = parseSSEChunk(decoder.decode(value, { stream: true }), buffer)
    buffer = result.remaining
    for (const ev of result.events) dispatchSSEEvent(ev, cb)
  }
}

export function searchFlightsStream(params: SearchParams, cb: StreamCallbacks): () => void {
  const controller = new AbortController()
  fetch(buildFlightUrl(params, '/api/flights/stream'), {
    signal: controller.signal,
    headers: { Accept: 'text/event-stream' },
  })
    .then(async (res) => {
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({ detail: 'Search failed' }))
        cb.onError(body.detail || `HTTP ${res.status}`)
        return
      }
      await readStream(res.body, cb)
    })
    .catch(() => {
      if (!controller.signal.aborted) cb.onError('Connection failed')
    })

  return () => controller.abort()
}
