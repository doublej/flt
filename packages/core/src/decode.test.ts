import { describe, expect, it } from 'vitest'
import { decodeLeg, decodeLayover, decodeResult } from './decode'

describe('decodeLeg', () => {
  it('extracts fields from a leg array', () => {
    const leg = new Array(23).fill(null)
    leg[2] = 'Operated by Partner Air'
    leg[3] = 'AMS'
    leg[5] = 'NRT'
    leg[8] = [14, 5]
    leg[10] = [9, 30]
    leg[11] = 660
    leg[14] = '32 in'
    leg[17] = 'Boeing 787'
    leg[22] = ['KL', '861', null, 'KLM']

    const result = decodeLeg(leg)
    expect(result).toEqual({
      airline: 'KL',
      airline_name: 'KLM',
      flight_number: '861',
      aircraft: 'Boeing 787',
      departure_airport: 'AMS',
      arrival_airport: 'NRT',
      departure_time: '14:05',
      arrival_time: '09:30',
      duration: 660,
      operator: 'Operated by Partner Air',
      seat_pitch: '32 in',
    })
  })

  it('returns null for non-array input', () => {
    expect(decodeLeg(null)).toBeNull()
    expect(decodeLeg('bad')).toBeNull()
  })

  it('handles missing optional fields', () => {
    const leg = new Array(23).fill(null)
    leg[3] = 'AMS'
    leg[5] = 'NRT'
    leg[8] = [10, 0]
    leg[10] = [14, 0]
    leg[11] = 240
    leg[22] = ['KL', '861', null, 'KLM']

    const result = decodeLeg(leg)!
    expect(result.operator).toBeUndefined()
    expect(result.seat_pitch).toBeUndefined()
    expect(result.aircraft).toBe('')
  })
})

describe('decodeLayover', () => {
  it('extracts fields from a layover array', () => {
    const lay = [120, 'ICN', null, null, 'Incheon International Airport']
    const result = decodeLayover(lay)
    expect(result).toEqual({
      duration: 120,
      airport: 'ICN',
      airport_name: 'Incheon International Airport',
    })
  })

  it('returns null for non-array input', () => {
    expect(decodeLayover(null)).toBeNull()
  })
})

describe('decodeResult', () => {
  it('decodes legs and layovers from full result structure', () => {
    const leg1 = new Array(23).fill(null)
    leg1[3] = 'AMS'
    leg1[5] = 'ICN'
    leg1[8] = [10, 0]
    leg1[10] = [5, 0]
    leg1[11] = 600
    leg1[22] = ['KL', '855', null, 'KLM']

    const leg2 = new Array(23).fill(null)
    leg2[3] = 'ICN'
    leg2[5] = 'NRT'
    leg2[8] = [7, 0]
    leg2[10] = [9, 15]
    leg2[11] = 135
    leg2[22] = ['KE', '711', null, 'Korean Air']

    const layover = [120, 'ICN', null, null, 'Incheon International']
    const body = new Array(14).fill(null)
    body[0] = 'KL'
    body[1] = ['KLM', 'Korean Air']
    body[2] = [leg1, leg2]
    body[4] = [2026, 3, 10]
    body[5] = [10, 0]
    body[7] = [2026, 3, 11]
    body[8] = [9, 15]
    body[9] = 855
    body[13] = [layover]

    const itinerary = [body]
    // data structure: [null, null, [[best_itineraries]], [[other_itineraries]]]
    const data = [null, null, [[itinerary]], []]

    const flights = decodeResult(data)
    expect(flights).toHaveLength(1)
    expect(flights[0].legs).toHaveLength(2)
    expect(flights[0].legs[0].departure_airport).toBe('AMS')
    expect(flights[0].legs[1].departure_airport).toBe('ICN')
    expect(flights[0].layovers).toHaveLength(1)
    expect(flights[0].layovers[0].airport).toBe('ICN')
    expect(flights[0].layovers[0].duration).toBe(120)
  })
})
