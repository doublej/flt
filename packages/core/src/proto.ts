/**
 * Protobuf encoder for Google Flights tfs parameter.
 * Mirrors flights_impl.py TFSData.as_b64() using hand-rolled protobuf encoding.
 * No external deps — pure TypeScript using Uint8Array.
 */

// Field numbers from flights.proto
// Info: data=3, passengers=8, seat=9, max_price=12, baggage=13,
//   hide_separate_and_self_transfer=17, trip=19, exclude_basic_economy=25
// FlightData: date=2, selected_flights=4, max_stops=5, airlines=6, earliest/latest_departure_hour=8/9,
//   earliest/latest_arrival_hour=10/11, max_duration_minutes=12, from_flight=13,
//   to_flight=14, connecting_airports=15, min/max_layover_minutes=17/18, emissions=19
// Baggage: carry_on_bags=2, checked_bags=3
// SelectedFlight: from_airport=1, date=2, to_airport=3, airline=5, flight_number=6
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
  /** Flights already picked for this leg; Google then lists the options for the next leg. */
  selected?: SelectedFlight[]
}

/** One flight of a picked itinerary, as the URL holds it after you click a result. */
export interface SelectedFlight {
  from: string
  /** YYYY-MM-DD, the day this flight departs. */
  date: string
  to: string
  airline: string
  flightNumber: string
}

/**
 * Filters Google applies before returning results (fast-flights #110).
 * The leg fields are applied to every leg of the trip.
 */
export interface GoogleFilters {
  /** 2-letter IATA codes or SKYTEAM / STAR_ALLIANCE / ONEWORLD. */
  airlines?: string[]
  earliestDepartureHour?: number
  /** Inclusive: 18 keeps departures through 18:59. */
  latestDepartureHour?: number
  earliestArrivalHour?: number
  latestArrivalHour?: number
  maxDurationMinutes?: number
  connectingAirports?: string[]
  minLayoverMinutes?: number
  maxLayoverMinutes?: number
  lessEmissionsOnly?: boolean
  /** In the search currency. */
  maxPrice?: number
  /**
   * Bag counts should make Google add its bag fees to prices. Live check 2026-10-05:
   * the ds:1 prices did not change, and neither did results with hideSelfTransfer.
   */
  carryOnBags?: number
  checkedBags?: number
  hideSelfTransfer?: boolean
  excludeBasicEconomy?: boolean
}

const LESS_EMISSIONS = 1

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

function optionalInt(field: number, val: number | undefined): Uint8Array[] {
  return val === undefined ? [] : [int32Field(field, val)]
}

function encodeSelectedFlight(s: SelectedFlight): Uint8Array {
  return concat(
    stringField(1, s.from),
    stringField(2, s.date),
    stringField(3, s.to),
    stringField(5, s.airline),
    stringField(6, s.flightNumber),
  )
}

function encodeFlightData(leg: FlightLeg, f: GoogleFilters): Uint8Array {
  const parts: Uint8Array[] = [
    stringField(2, leg.date),
    ...(leg.selected ?? []).map((s) => lenDelim(4, encodeSelectedFlight(s))),
    lenDelim(13, encodeAirport(leg.from)),
    lenDelim(14, encodeAirport(leg.to)),
  ]
  if (leg.maxStops !== undefined) parts.push(int32Field(5, leg.maxStops))
  for (const a of f.airlines ?? []) parts.push(stringField(6, a))
  parts.push(
    ...optionalInt(8, f.earliestDepartureHour),
    ...optionalInt(9, f.latestDepartureHour),
    ...optionalInt(10, f.earliestArrivalHour),
    ...optionalInt(11, f.latestArrivalHour),
    ...optionalInt(12, f.maxDurationMinutes),
  )
  for (const a of f.connectingAirports ?? []) parts.push(stringField(15, a))
  parts.push(...optionalInt(17, f.minLayoverMinutes), ...optionalInt(18, f.maxLayoverMinutes))
  // proto3 packs repeated enums: one length-delimited field holding the varints.
  if (f.lessEmissionsOnly) parts.push(lenDelim(19, varint(LESS_EMISSIONS)))
  return concat(...parts)
}

function encodeInfo(
  legs: FlightLeg[],
  passengers: PassengerCounts,
  seat: SeatKey,
  trip: TripKey,
  f: GoogleFilters,
): Uint8Array {
  const parts: Uint8Array[] = []

  for (const leg of legs) {
    parts.push(lenDelim(3, encodeFlightData(leg, f)))
  }

  const pList: number[] = [
    ...Array(passengers.adults).fill(PASSENGER.adult),
    ...Array(passengers.children).fill(PASSENGER.child),
    ...Array(passengers.infants_in_seat).fill(PASSENGER.infant_in_seat),
    ...Array(passengers.infants_on_lap).fill(PASSENGER.infant_on_lap),
  ]
  for (const p of pList) parts.push(int32Field(8, p))

  parts.push(int32Field(9, SEAT[seat]))
  parts.push(...optionalInt(12, f.maxPrice))
  // Same as fast-flights: a Baggage message only when a bag is asked for, then both counts.
  if (f.carryOnBags || f.checkedBags) {
    parts.push(lenDelim(13, concat(int32Field(2, f.carryOnBags ?? 0), int32Field(3, f.checkedBags ?? 0))))
  }
  if (f.hideSelfTransfer) parts.push(int32Field(17, 1))
  parts.push(int32Field(19, TRIP[trip]))
  if (f.excludeBasicEconomy) parts.push(int32Field(25, 1))

  return concat(...parts)
}

export function encodeFlightFilter(params: {
  legs: FlightLeg[]
  passengers: PassengerCounts
  seat: SeatKey
  trip: TripKey
  filters?: GoogleFilters
}): string {
  const buf = encodeInfo(params.legs, params.passengers, params.seat, params.trip, params.filters ?? {})
  // btoa on Uint8Array via String.fromCharCode
  let binary = ''
  for (const byte of buf) binary += String.fromCharCode(byte)
  return btoa(binary)
}
