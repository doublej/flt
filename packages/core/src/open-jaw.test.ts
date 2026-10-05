import { describe, expect, it } from 'vitest'
import { decodeShoppingResults } from './scrape'
import { type SearchQuery, searchSingle } from './search'
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

/** Wrap a ds:1-shaped data array the way GetShoppingResults frames it. */
function frame(data: unknown): string {
  const row = JSON.stringify([['wrb.fr', null, JSON.stringify(data)]])
  return `)]}'\n\n${row.length}\n${row}\n25\n[["e",4,null,null,131]]\n`
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

describe('open-jaw search', () => {
  const encodedBy = async (q: SearchQuery) => {
    let b64 = ''
    await searchSingle(q.date, q.return_date ?? null, q, async (b) => {
      b64 = b
      return { flights: [] }
    })
    return b64
  }

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
