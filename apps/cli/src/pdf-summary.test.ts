import type { Offer } from '@flights/core'
import { describe, expect, it } from 'vitest'
import {
  durationMin,
  groupByRoute,
  pickHighlights,
  pricePerDay,
  routeCities,
  rowBadges,
  viaLabel,
} from './pdf-summary'

function offer(id: string, price: string, legMins: number[], layMins: number[] = []): Offer {
  return {
    id,
    url: '',
    is_best: false,
    name: 'Test Air',
    departure: '10:00',
    arrival: '20:00',
    arrival_time_ahead: '',
    duration: '',
    stops: layMins.length,
    delay: null,
    price,
    departure_date: '2026-11-03',
    return_date: null,
    countries: [],
    legs: legMins.map((d, i) => ({
      airline: 'TA',
      airline_name: 'Test Air',
      flight_number: `${100 + i}`,
      aircraft: 'A350',
      departure_airport: i === 0 ? 'AMS' : 'CAN',
      arrival_airport: i === legMins.length - 1 ? 'HAN' : 'CAN',
      departure_time: '10:00',
      arrival_time: '20:00',
      duration: d,
    })),
    layovers: layMins.map((d) => ({ airport: 'CAN', airport_name: 'Guangzhou', duration: d })),
  }
}

describe('pdf summary', () => {
  const nonstop = offer('Fnon', '€520', [670])
  const cheap = offer('Fchp', '€320', [690, 135], [75])
  const slow = offer('Fslw', '€320', [690, 125], [360])

  it('counts layover time in door-to-door duration', () => {
    expect(durationMin(nonstop)).toBe(670)
    expect(durationMin(cheap)).toBe(900)
    expect(durationMin(slow)).toBe(1175)
  })

  it('names the connection city in full, never the airport code', () => {
    expect(viaLabel(nonstop)).toBe('Nonstop')
    expect(viaLabel(cheap)).toBe('Guangzhou 1h 15m')
    expect(routeCities(cheap)).toBe('Amsterdam to Guangzhou to Hanoi')
  })

  it('reports the lowest and average fare for each departure date', () => {
    const entry = (offers: Offer[]) => ({ offers, query: '', timestamp: 0, ref: 'r' })
    // cheap appears in both searches; dedup by id must not skew the average.
    const { days, currency } = pricePerDay([
      ['a', entry([cheap, nonstop])],
      ['b', entry([cheap, slow])],
    ])
    expect(currency).toBe('€')
    expect(days).toHaveLength(1)
    expect(days[0]).toMatchObject({ date: '2026-11-03', low: 320, count: 3 })
    expect(days[0].avg).toBeCloseTo((320 + 520 + 320) / 3)
  })

  it('surfaces cheapest and fastest, merging labels when one offer is both', () => {
    const h = pickHighlights([nonstop, cheap, slow])
    const byId = Object.fromEntries(h.map((x) => [x.offer.id, x.labels]))
    expect(byId.Fchp).toContain('Lowest price')
    expect(byId.Fnon).toContain('Fastest')
    expect(h.filter((x) => x.offer.id === 'Fchp')).toHaveLength(1)
  })

  it('lets an explicit pick override the balanced choice', () => {
    const h = pickHighlights([nonstop, cheap, slow], 'Fnon')
    expect(h[0].offer.id).toBe('Fnon')
    expect(h[0].labels).toContain('Our pick')
  })

  it('caps row badges at two, most important first', () => {
    const badges = rowBadges(nonstop, { cheapestId: 'Fnon', fastestId: 'Fnon', pickId: 'Fnon' })
    expect(badges).toBe('Our pick / Cheapest')
  })
})

describe('route grouping', () => {
  const leg = (from: string, to: string) => ({
    airline: 'TA',
    airline_name: 'Test Air',
    flight_number: '1',
    aircraft: 'A350',
    departure_airport: from,
    arrival_airport: to,
    departure_time: '10:00',
    arrival_time: '20:00',
    duration: 600,
  })
  const mk = (id: string, price: string, from: string, to: string): Offer => ({
    ...offer(id, price, [600]),
    legs: [leg(from, to)],
  })
  const entry = (offers: Offer[]) => ({ offers, query: '', timestamp: 0, ref: 'r' })

  it('keeps each destination in its own group, cheapest route first', () => {
    const groups = groupByRoute([
      ['AMS-SGN@20261103#A', entry([mk('F1', '€900', 'AMS', 'SGN')])],
      ['AMS-HAN@20261103#B', entry([mk('F2', '€320', 'AMS', 'HAN')])],
      ['AMS-HAN@20261105#C', entry([mk('F3', '€450', 'AMS', 'HAN')])],
    ])
    expect(groups.map((g) => g.key)).toEqual(['AMS-HAN', 'AMS-SGN'])
    expect(groups[0].label).toBe('Amsterdam to Hanoi')
    expect(groups[0].searches).toHaveLength(2)
    expect(groups[0].cheapest).toBe(320)
    expect(groups[1].offers).toHaveLength(1)
  })
})

describe('unpriced offers', () => {
  it('ignores offers with no parseable price instead of averaging to Infinity', () => {
    const priced = offer('Fa', '€400', [600])
    const unpriced = offer('Fb', 'Price unavailable', [600])
    const { days } = pricePerDay([
      ['AMS-HAN@20261103#A', { offers: [priced, unpriced], query: '', timestamp: 0, ref: 'r' }],
    ])
    expect(days[0].count).toBe(1)
    expect(days[0].avg).toBe(400)
    expect(Number.isFinite(days[0].avg)).toBe(true)
  })
})
