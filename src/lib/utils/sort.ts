import type { Flight } from '$lib/types'

export type SortKey = 'best' | 'price' | 'duration' | 'stops' | 'departure' | 'date'

/** Parse price string like "€123" or "$1,234" to numeric value. */
export function parsePrice(s: string): number {
  const cleaned = s.replace(/[^0-9.]/g, '')
  return Number(cleaned) || Number.MAX_SAFE_INTEGER
}

/** Parse duration like "2h 30m" or "45m" to total minutes. */
export function parseDuration(s: string): number {
  const hours = s.match(/(\d+)\s*h/)?.[1]
  const mins = s.match(/(\d+)\s*m/)?.[1]
  return (Number(hours) || 0) * 60 + (Number(mins) || 0)
}

/** Parse time like "3:45 PM" or "15:30" to minutes since midnight. */
export function parseTime(s: string): number {
  const match = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!match) return 0
  let hours = Number(match[1])
  const mins = Number(match[2])
  const period = match[3]?.toUpperCase()
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return hours * 60 + mins
}

const sorters: Record<Exclude<SortKey, 'best'>, (a: Flight, b: Flight) => number> = {
  price: (a, b) => parsePrice(a.price) - parsePrice(b.price),
  duration: (a, b) => parseDuration(a.duration) - parseDuration(b.duration),
  stops: (a, b) => {
    const sa = typeof a.stops === 'number' ? a.stops : 99
    const sb = typeof b.stops === 'number' ? b.stops : 99
    return sa - sb
  },
  departure: (a, b) => parseTime(a.departure) - parseTime(b.departure),
  date: (a, b) => (a.departure_date ?? '').localeCompare(b.departure_date ?? ''),
}

export function sortFlights(flights: Flight[], key: SortKey): Flight[] {
  if (key === 'best') return flights
  return [...flights].sort(sorters[key])
}
