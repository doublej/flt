import { describe, expect, it } from 'vitest'
import { ToolError, assertAirport, assertDate, summarizeOffer } from './shared'

describe('assertAirport', () => {
  it('uppercases and accepts known IATA codes', () => {
    expect(assertAirport('ams', 'Origin')).toBe('AMS')
  })
  it('throws BAD_AIRPORT on unknown codes', () => {
    expect(() => assertAirport('ZZZ', 'Origin')).toThrowError(ToolError)
    try {
      assertAirport('ZZZ', 'Origin')
    } catch (e) {
      expect((e as ToolError).code).toBe('BAD_AIRPORT')
    }
  })
})

describe('assertDate', () => {
  it('accepts ISO dates in the future', () => {
    const future = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10)
    expect(assertDate(future, 'Departure date')).toBe(future)
  })
  it('throws BAD_DATE on junk', () => {
    try {
      assertDate('not-a-date', 'Departure date')
      expect.unreachable()
    } catch (e) {
      expect((e as ToolError).code).toBe('BAD_DATE')
    }
  })
  it('throws PAST_DATE on past dates', () => {
    try {
      assertDate('2020-01-01', 'Departure date')
      expect.unreachable()
    } catch (e) {
      expect((e as ToolError).code).toBe('PAST_DATE')
    }
  })
})

describe('summarizeOffer', () => {
  it('keeps id/price/via and drops leg detail', () => {
    const summary = summarizeOffer({
      id: 'Fabc1',
      url: 'https://example.com',
      is_best: true,
      name: 'AJet',
      departure: '17:45',
      arrival: '01:25',
      arrival_time_ahead: '+1',
      duration: '5h 40m',
      stops: 1,
      delay: null,
      price: '€114',
      departure_date: '2026-09-15',
      legs: [{} as never],
      layovers: [{ airport: 'SAW', duration: 95 } as never],
    } as never)
    expect(summary).toMatchObject({
      id: 'Fabc1',
      price: '€114',
      carrier: 'AJet',
      via: ['SAW'],
      arrival: '01:25+1',
    })
    expect('legs' in summary).toBe(false)
  })
})
