/**
 * Protobuf encoder for Google Flights tfs parameter.
 * Mirrors flights_impl.py TFSData.as_b64() using hand-rolled protobuf encoding.
 * No external deps — pure TypeScript using Uint8Array.
 */

// Field numbers from flights.proto
// Info: data=3, passengers=8, seat=9, trip=19
// FlightData: date=2, from_flight=13, to_flight=14, max_stops=5
// Airport: airport=2

const SEAT = { economy: 1, 'premium-economy': 2, business: 3, first: 4 } as const
const TRIP = { 'round-trip': 1, 'one-way': 2, 'multi-city': 3 } as const
const PASSENGER = { adult: 1, child: 2, infant_in_seat: 3, infant_on_lap: 4 } as const

type SeatKey = keyof typeof SEAT
type TripKey = keyof typeof TRIP

export interface FlightLeg {
  date: string
  from: string
  to: string
  maxStops?: number
}

export interface PassengerCounts {
  adults: number
  children: number
  infants_in_seat: number
  infants_on_lap: number
}

// --- Minimal protobuf wire encoding ---

function varint(n: number): Uint8Array {
  const buf: number[] = []
  while (n > 127) {
    buf.push((n & 0x7f) | 0x80)
    n >>>= 7
  }
  buf.push(n)
  return new Uint8Array(buf)
}

function fieldTag(field: number, type: number): Uint8Array {
  return varint((field << 3) | type)
}

function lenDelim(field: number, bytes: Uint8Array): Uint8Array {
  return concat(fieldTag(field, 2), varint(bytes.length), bytes)
}

function int32Field(field: number, val: number): Uint8Array {
  return concat(fieldTag(field, 0), varint(val))
}

function stringField(field: number, val: string): Uint8Array {
  const encoded = new TextEncoder().encode(val)
  return lenDelim(field, encoded)
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) {
    out.set(a, offset)
    offset += a.length
  }
  return out
}

// --- Message encoders ---

function encodeAirport(iata: string): Uint8Array {
  return stringField(2, iata)
}

function encodeFlightData(leg: FlightLeg): Uint8Array {
  const parts: Uint8Array[] = [
    stringField(2, leg.date),
    lenDelim(13, encodeAirport(leg.from)),
    lenDelim(14, encodeAirport(leg.to)),
  ]
  if (leg.maxStops !== undefined) parts.push(int32Field(5, leg.maxStops))
  return concat(...parts)
}

function encodeInfo(
  legs: FlightLeg[],
  passengers: PassengerCounts,
  seat: SeatKey,
  trip: TripKey,
): Uint8Array {
  const parts: Uint8Array[] = []

  for (const leg of legs) {
    parts.push(lenDelim(3, encodeFlightData(leg)))
  }

  const pList: number[] = [
    ...Array(passengers.adults).fill(PASSENGER.adult),
    ...Array(passengers.children).fill(PASSENGER.child),
    ...Array(passengers.infants_in_seat).fill(PASSENGER.infant_in_seat),
    ...Array(passengers.infants_on_lap).fill(PASSENGER.infant_on_lap),
  ]
  for (const p of pList) parts.push(int32Field(8, p))

  parts.push(int32Field(9, SEAT[seat]))
  parts.push(int32Field(19, TRIP[trip]))

  return concat(...parts)
}

export function encodeFlightFilter(params: {
  legs: FlightLeg[]
  passengers: PassengerCounts
  seat: SeatKey
  trip: TripKey
}): string {
  const buf = encodeInfo(params.legs, params.passengers, params.seat, params.trip)
  // btoa on Uint8Array via String.fromCharCode
  let binary = ''
  for (const byte of buf) binary += String.fromCharCode(byte)
  return btoa(binary)
}
