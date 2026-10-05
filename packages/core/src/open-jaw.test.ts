import { describe, expect, it } from 'vitest'
import { decodeResult } from './decode'
import fixture from './fixtures/shopping-results.json'
import { decodeShoppingResults } from './scrape'
import { type SearchQuery, pickedFlights, searchSingle } from './search'
import { buildCacheKey, buildCacheQuery } from './state'

const query: SearchQuery = {
  from_airport: 'AMS',
  to_airport: 'SGN',
  date: '2026-11-06',
  return_date: '2026-12-05',
  adults: 1,
  children: 0,
  infants_in_seat: 0,
  infants_on_lap: 0,
  seat: 'economy',
  currency: 'EUR',
}

/** Wrap ds:1-shaped data arrays the way GetShoppingResults frames its streamed snapshots. */
function frame(...snapshots: unknown[]): string {
  const rows = snapshots.map((data) => {
    const row = JSON.stringify([['wrb.fr', null, JSON.stringify(data)]])
    return `${row.length}\n${row}\n`
  })
  return `)]}'\n\n${rows.join('')}25\n[["e",4,null,null,131]]\n`
}

describe('decodeShoppingResults', () => {
  it('decodes the wrb.fr payload with the ds:1 decoder', () => {
    const leg = new Array(23).fill(null)
    leg[3] = 'AMS'
    leg[6] = 'DOH'
    leg[8] = [15, 5]
    leg[10] = [23, 25]
    leg[11] = 380
    leg[22] = ['QR', '274', null, 'Qatar Airways']
    const body = new Array(14).fill(null)
    body[0] = 'QR'
    body[1] = ['Qatar Airways']
    body[2] = [leg]
    const flights = decodeShoppingResults(frame([null, null, [[[body]]], []])).flights
    expect(flights).toHaveLength(1)
    expect(flights[0].legs[0].flight_number).toBe('274')
  })

  it('reports no_data without a wrb.fr payload and no_flights for an empty one', () => {
    expect(decodeShoppingResults('[["wrb.fr",null,null,null,null,[13]]]').error).toBe('no_data')
    expect(decodeShoppingResults(frame([null, null, null, null])).error).toBe('no_flights')
  })
})

describe('streamed snapshots', () => {
  const rows = (raw: string) => decodeShoppingResults(raw).flights.map((f) => `${f.name} ${f.departure} ${f.price}`)

  it('decodes the last snapshot, where Google has added fares the first lacked', () => {
    const { first, last } = fixture.outbound
    expect(rows(frame(first))).toEqual(['THAI 14:20 €843'])
    expect(rows(frame(first, last))).toEqual([
      'Qatar Airways 15:05 €769',
      'THAI 14:20 €843',
      'KLM, Vietnam Airlines 08:15 €1,743',
    ])
  })

  it('skips a trailing snapshot without a payload', () => {
    const raw = `${frame(fixture.outbound.last)}42\n[["wrb.fr",null,null,null,null,[13]]]\n`
    expect(rows(raw)).toHaveLength(3)
  })
})

describe('separate tickets', () => {
  const byName = (data: unknown) => Object.fromEntries(decodeResult(data).map((f) => [`${f.name} ${f.departure}`, f]))

  it('flags return rows Google labels "Separate tickets"', () => {
    const rets = byName(fixture.returns.last)
    expect(rets['Etihad 08:15'].separate_tickets).toBe(true)
    expect(rets['THAI 20:25'].separate_tickets).toBe(false)
  })

  it('flags an outbound whose cheapest whole trip combines separate tickets', () => {
    const outs = byName(fixture.outbound.last)
    expect(outs['THAI 14:20'].separate_tickets).toBe(true)
    expect(outs['Qatar Airways 15:05'].separate_tickets).toBe(false)
  })
})

const encodedBy = async (q: SearchQuery, outbound?: Parameters<typeof searchSingle>[4]) => {
  let b64 = ''
  await searchSingle(
    q.date,
    q.return_date ?? null,
    q,
    async (b) => {
      b64 = b
      return { flights: [] }
    },
    outbound,
  )
  return b64
}

describe('return options', () => {
  const thai = decodeResult(fixture.outbound.last).find((f) => f.name === 'THAI')!

  it('picks the outbound by its flights, each with its own date', () => {
    expect(pickedFlights({ ...thai, departure_date: '2026-11-06', return_date: null, countries: [] })).toEqual([
      { from: 'AMS', date: '2026-11-06', to: 'BKK', airline: 'TG', flightNumber: '937' },
      { from: 'BKK', date: '2026-11-07', to: 'SGN', airline: 'TG', flightNumber: '556' },
    ])
  })

  it('cannot pick an outbound cached without leg dates', () => {
    const legs = thai.legs.map(({ departure_date, ...leg }) => leg)
    expect(pickedFlights({ ...thai, legs, departure_date: '2026-11-06', return_date: null, countries: [] })).toBeNull()
  })

  it('encodes the picked flights on the outbound leg', async () => {
    // Loaded in headless Chrome on 5 Oct, this listed the returns for Turkish 18:30 on 6 Nov.
    const turkish = [
      { from: 'AMS', date: '2026-11-06', to: 'IST', airline: 'TK', flightNumber: '1954' },
      { from: 'IST', date: '2026-11-07', to: 'SGN', airline: 'TK', flightNumber: '162' },
    ]
    expect(await encodedBy({ ...query, return_from: 'HAN' }, turkish)).toBe(
      'Gl0SCjIwMjYtMTEtMDYiIAoDQU1TEgoyMDI2LTExLTA2GgNJU1QqAlRLMgQxOTU0Ih8KA0lTVBIKMjAyNi0xMS0wNxoDU0dOKgJUSzIDMTYyagUSA0FNU3IFEgNTR04aGhIKMjAyNi0xMi0wNWoFEgNIQU5yBRIDQU1TQAFIAZgBAw==',
    )
  })
})

describe('open-jaw search', () => {
  it('encodes a multi-city ticket home from return_from', async () => {
    // The exact filter Google Flights rendered as AMS→SGN 6 Nov + HAN→AMS 5 Dec.
    expect(await encodedBy({ ...query, return_from: 'HAN' })).toBe(
      'GhoSCjIwMjYtMTEtMDZqBRIDQU1TcgUSA1NHThoaEgoyMDI2LTEyLTA1agUSA0hBTnIFEgNBTVNAAUgBmAED',
    )
  })

  it('still encodes a plain round trip without return_from', async () => {
    expect(await encodedBy(query)).toBe(
      'GhoSCjIwMjYtMTEtMDZqBRIDQU1TcgUSA1NHThoaEgoyMDI2LTEyLTA1agUSA1NHTnIFEgNBTVNAAUgBmAEB',
    )
  })

  it('caches open-jaw separately and leaves round-trip cache keys unchanged', () => {
    const rt = buildCacheQuery(query, query.date, query.return_date ?? null)
    const oj = buildCacheQuery({ ...query, return_from: 'han' }, query.date, query.return_date ?? null)
    expect('return_from' in rt).toBe(false)
    expect(oj.return_from).toBe('HAN')
    expect(buildCacheKey(oj)).not.toBe(buildCacheKey(rt))
  })
})
