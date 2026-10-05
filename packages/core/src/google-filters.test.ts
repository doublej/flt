import { describe, expect, it } from 'vitest'
import { readProto } from './decode'
import { type GoogleFilters, encodeFlightFilter } from './proto'
import { type SearchQuery, searchSingle } from './search'
import { buildCacheKey, buildCacheQuery } from './state'

// Mirrors fast-flights tests/test_querying.py (#110): decode the tfs and check fields.
function encode(filters?: GoogleFilters) {
  const b64 = encodeFlightFilter({
    legs: [{ date: '2099-01-02', from: 'MSP', to: 'SLC' }],
    passengers: { adults: 1, children: 0, infants_in_seat: 0, infants_on_lap: 0 },
    seat: 'economy',
    trip: 'one-way',
    filters,
  })
  const info = readProto(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))
  const flight = readProto(info.get(3)?.[0] as Uint8Array)
  return { info, flight }
}

const text = (v: unknown) => new TextDecoder().decode(v as Uint8Array)

describe('Google-side filters', () => {
  it('adds no optional fields by default', () => {
    const { info, flight } = encode()
    expect([...info.keys()].sort((a, b) => a - b)).toEqual([3, 8, 9, 19])
    expect([...flight.keys()].sort((a, b) => a - b)).toEqual([2, 13, 14])
  })

  it('serializes per-leg filters', () => {
    const { flight } = encode({
      airlines: ['DL', 'STAR_ALLIANCE'],
      earliestDepartureHour: 7,
      latestDepartureHour: 18,
      earliestArrivalHour: 10,
      latestArrivalHour: 23,
      maxDurationMinutes: 720,
      connectingAirports: ['DEN', 'ORD'],
      minLayoverMinutes: 60,
      maxLayoverMinutes: 240,
      lessEmissionsOnly: true,
    })
    expect(flight.get(6)?.map(text)).toEqual(['DL', 'STAR_ALLIANCE'])
    expect([8, 9, 10, 11, 12].map((n) => flight.get(n)?.[0])).toEqual([7, 18, 10, 23, 720])
    expect(flight.get(15)?.map(text)).toEqual(['DEN', 'ORD'])
    expect([flight.get(17)?.[0], flight.get(18)?.[0]]).toEqual([60, 240])
    // Packed repeated enum: one field whose payload is the varint LESS_EMISSIONS = 1.
    expect([...(flight.get(19)?.[0] as Uint8Array)]).toEqual([1])
  })

  it('serializes whole-search filters', () => {
    const { info } = encode({
      maxPrice: 500,
      carryOnBags: 1,
      checkedBags: 2,
      hideSelfTransfer: true,
      excludeBasicEconomy: true,
    })
    expect(info.get(12)?.[0]).toBe(500)
    const baggage = readProto(info.get(13)?.[0] as Uint8Array)
    expect([baggage.get(2)?.[0], baggage.get(3)?.[0]]).toEqual([1, 2])
    expect([info.get(17)?.[0], info.get(25)?.[0]]).toEqual([1, 1])
  })

  it('sends both bag counts when only one is asked for', () => {
    const baggage = readProto(encode({ checkedBags: 1 }).info.get(13)?.[0] as Uint8Array)
    expect([baggage.get(2)?.[0], baggage.get(3)?.[0]]).toEqual([0, 1])
  })
})

describe('Google-side filter cache keys', () => {
  const q: SearchQuery = {
    from_airport: 'AMS',
    to_airport: 'SGN',
    date: '2026-11-06',
    adults: 1,
    children: 0,
    infants_in_seat: 0,
    infants_on_lap: 0,
    seat: 'economy',
    currency: 'EUR',
  }

  it('caches filtered searches separately and leaves unfiltered keys unchanged', () => {
    const plain = buildCacheQuery(q, q.date, null)
    const filtered = buildCacheQuery({ ...q, filters: { maxPrice: 600 } }, q.date, null)
    expect('filters' in plain).toBe(false)
    const unset = buildCacheQuery(
      { ...q, filters: { maxPrice: undefined, connectingAirports: [], lessEmissionsOnly: false } },
      q.date,
      null,
    )
    expect(buildCacheKey(unset)).toBe(buildCacheKey(plain))
    expect(buildCacheKey(filtered)).not.toBe(buildCacheKey(plain))
  })
})

describe('max price', () => {
  it('drops itineraries Google returned without a fare', async () => {
    const flight = (price: string) => ({ price, name: 'X', legs: [], layovers: [] }) as never
    const q: SearchQuery = {
      from_airport: 'AMS',
      to_airport: 'BCN',
      date: '2026-11-12',
      adults: 1,
      children: 0,
      infants_in_seat: 0,
      infants_on_lap: 0,
      seat: 'economy',
      currency: 'EUR',
      filters: { maxPrice: 50 },
    }
    const res = await searchSingle(q.date, null, q, async () => ({ flights: [flight('€45'), flight('')] }))
    expect(res.flights.map((f) => f.price)).toEqual(['€45'])
  })
})
