/**
 * Decoder for Google Flights JS data source.
 * Port of fast-flights decoder.py + flights_impl.ItinerarySummary.from_b64()
 *
 * Google embeds AF_initDataCallback({...data:[...]...}) in <script class="ds:1">.
 * The nested list structure is decoded using fixed index paths from the Python source.
 */

// --- Minimal protobuf reader ---

function readVarint(buf: Uint8Array, pos: number): [number, number] {
  let result = 0
  let shift = 0
  while (pos < buf.length) {
    const byte = buf[pos++]
    result |= (byte & 0x7f) << shift
    if (!(byte & 0x80)) break
    shift += 7
  }
  return [result, pos]
}

type ProtoFields = Map<number, Array<number | Uint8Array>>

function readProto(buf: Uint8Array): ProtoFields {
  const fields: ProtoFields = new Map()
  let pos = 0
  while (pos < buf.length) {
    const [tag, p1] = readVarint(buf, pos)
    pos = p1
    const fieldNum = tag >> 3
    const wireType = tag & 0x7
    const list = fields.get(fieldNum) ?? []
    if (wireType === 0) {
      const [val, p2] = readVarint(buf, pos)
      pos = p2
      list.push(val)
    } else if (wireType === 2) {
      const [len, p2] = readVarint(buf, pos)
      pos = p2
      list.push(buf.slice(pos, pos + len))
      pos += len
    } else if (wireType === 1) {
      pos += 8
    } else if (wireType === 5) {
      pos += 4
    }
    fields.set(fieldNum, list)
  }
  return fields
}

// --- ItinerarySummary proto decoding ---
// proto: ItinerarySummary { string flights=2; Price price=3; }
// proto: Price { int32 price=1; string currency=3; }

const CURRENCY_SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', JPY: '¥' }

function decodeSummary(b64: string): { priceStr: string } {
  try {
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)

    const summary = readProto(bytes)
    const priceBytes = summary.get(3)?.[0]
    if (!(priceBytes instanceof Uint8Array)) return { priceStr: '' }

    const price = readProto(priceBytes)
    const rawPrice = price.get(1)?.[0]
    const currencyBytes = price.get(3)?.[0]

    const amount = typeof rawPrice === 'number' ? Math.round(rawPrice / 100) : 0
    const currency = currencyBytes instanceof Uint8Array
      ? new TextDecoder().decode(currencyBytes)
      : ''
    const symbol = CURRENCY_SYMBOLS[currency] ?? ''
    const priceStr = symbol
      ? `${symbol}${amount.toLocaleString()}`
      : `${amount.toLocaleString()} ${currency}`
    return { priceStr }
  } catch {
    return { priceStr: '' }
  }
}

// --- Nested list helpers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NL = any

function at(data: NL, ...path: number[]): NL {
  let cur = data
  for (const i of path) {
    if (!Array.isArray(cur) || i >= cur.length || cur[i] == null) return null
    cur = cur[i]
  }
  return cur
}

function formatTime(t: NL): string {
  if (!Array.isArray(t) || t.length < 2) return ''
  return `${String(t[0]).padStart(2, '0')}:${String(t[1]).padStart(2, '0')}`
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  return h ? `${h}h` : `${m}m`
}

function daysAhead(dep: NL, arr: NL): string {
  if (!dep || !arr) return ''
  const diff = Math.round(
    (Date.UTC(arr[0], arr[1] - 1, arr[2]) - Date.UTC(dep[0], dep[1] - 1, dep[2])) / 86400000,
  )
  return diff > 0 ? `+${diff}` : ''
}

// --- Itinerary decoding ---
// Paths from ItineraryDecoder in decoder.py

export interface DecodedFlight {
  is_best: boolean
  name: string
  departure: string
  arrival: string
  arrival_time_ahead: string
  duration: string
  stops: number
  delay: null
  price: string
}

function decodeItinerary(el: NL, is_best: boolean): DecodedFlight | null {
  try {
    const body = at(el, 0)
    const airlineNames: string[] = at(body, 1) ?? []
    const layovers: NL[] = at(body, 13) ?? []
    const depTime = at(body, 5)
    const arrTime = at(body, 8)
    const depDate = at(body, 4)
    const arrDate = at(body, 7)
    const travelTime = at(body, 9) ?? 0
    const summaryB64 = at(el, 1, 1) as string | null
    const { priceStr } = summaryB64 ? decodeSummary(summaryB64) : { priceStr: '' }
    const name = airlineNames.join(', ') || (at(body, 0) as string) || ''

    return {
      is_best,
      name,
      departure: formatTime(depTime),
      arrival: formatTime(arrTime),
      arrival_time_ahead: daysAhead(depDate, arrDate),
      duration: formatDuration(travelTime),
      stops: Array.isArray(layovers) ? layovers.length : 0,
      delay: null,
      price: priceStr,
    }
  } catch {
    return null
  }
}

// ResultDecoder paths: best=data[2][0], other=data[3][0]
export function decodeResult(data: NL): DecodedFlight[] {
  const best: NL[] = at(data, 2, 0) ?? []
  const other: NL[] = at(data, 3, 0) ?? []
  const flights: DecodedFlight[] = []
  for (const el of best) {
    const f = decodeItinerary(el, true)
    if (f) flights.push(f)
  }
  for (const el of other) {
    const f = decodeItinerary(el, false)
    if (f) flights.push(f)
  }
  return flights
}

// Extract JSON array from AF_initDataCallback script content.
// Uses bracket counting to find the matching ].
export function extractDataArray(script: string): NL | null {
  const marker = 'data:'
  const markerIdx = script.indexOf(marker)
  if (markerIdx === -1) return null

  const start = script.indexOf('[', markerIdx)
  if (start === -1) return null

  let depth = 0
  let end = start
  for (; end < script.length; end++) {
    if (script[end] === '[') depth++
    else if (script[end] === ']') {
      depth--
      if (depth === 0) break
    }
  }
  if (depth !== 0) return null

  try {
    return JSON.parse(script.slice(start, end + 1))
  } catch {
    return null
  }
}
