import data from '$lib/server/airports.json'
import { parseFlexDate } from '$lib/utils/dates'

const _airports = data as Record<string, { name: string; city: string; country: string }>

/** Normalize flexible date input → YYYY-MM-DD, or exit with error. */
export function normalizeDate(d: string, label: string): string {
  const iso = parseFlexDate(d)
  if (!iso) {
    console.log(
      JSON.stringify({
        err: 'BAD_DATE',
        hint: `${label} '${d}' is not a valid date. Use YYYY-MM-DD, DD/MM/YYYY, or 'tomorrow'.`,
      }),
    )
    process.exit(1)
  }
  const today = new Date().toISOString().slice(0, 10)
  if (iso < today) {
    console.log(
      JSON.stringify({
        err: 'PAST_DATE',
        hint: `${label} ${iso} is in the past (today: ${today}).`,
      }),
    )
    process.exit(1)
  }
  return iso
}

export function validateAirport(code: string, label: string): void {
  if (!(code in _airports)) {
    console.log(
      JSON.stringify({ err: 'BAD_AIRPORT', hint: `${label} '${code}' is not a known IATA code.` }),
    )
    process.exit(1)
  }
}

export function parsePax(s: string) {
  const ad = Number.parseInt(s.match(/(\d+)ad/)?.[1] ?? '1')
  const ch = Number.parseInt(s.match(/(\d+)ch/)?.[1] ?? '0')
  const ins = Number.parseInt(s.match(/(\d+)is/)?.[1] ?? '0')
  const inl = Number.parseInt(s.match(/(\d+)il/)?.[1] ?? '0')
  const inf = Number.parseInt(s.match(/(\d+)in(?![sl])/)?.[1] ?? '0')
  return { adults: ad, children: ch, infants_in_seat: ins, infants_on_lap: inl || inf }
}
