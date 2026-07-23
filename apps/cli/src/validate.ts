import { isValidAirport, parseFlexDate } from '@flights/core'

/**
 * Pure date check: flexible input → YYYY-MM-DD, or an error code.
 * Shared with @flights/mcp, which reports errors instead of exiting.
 */
export function tryNormalizeDate(
  d: string,
): { iso: string } | { err: 'BAD_DATE' | 'PAST_DATE'; iso?: string; today: string } {
  const today = new Date().toISOString().slice(0, 10)
  const iso = parseFlexDate(d)
  if (!iso) return { err: 'BAD_DATE', today }
  if (iso < today) return { err: 'PAST_DATE', iso, today }
  return { iso }
}

/** Normalize flexible date input → YYYY-MM-DD, or exit with error. */
export function normalizeDate(d: string, label: string): string {
  const res = tryNormalizeDate(d)
  if (!('err' in res)) return res.iso
  const hint =
    res.err === 'BAD_DATE'
      ? `${label} '${d}' is not a valid date. Use YYYY-MM-DD, DD/MM/YYYY, or 'tomorrow'.`
      : `${label} ${res.iso} is in the past (today: ${res.today}).`
  console.log(JSON.stringify({ err: res.err, hint }))
  process.exit(1)
}

export function validateAirport(code: string, label: string): void {
  if (!isValidAirport(code)) {
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
