import { type GoogleFilters, isValidAirport, parseFlexDate } from '@flights/core'

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

/** Upper-cased --return-from airport, or exit when it is unknown or has no return date. */
export function parseReturnFrom(code: string | undefined, hasReturnDate: boolean): string | undefined {
  if (!code) return undefined
  validateAirport(code.toUpperCase(), 'Return airport')
  if (!hasReturnDate) {
    console.log(JSON.stringify({ err: 'USAGE', hint: '--return-from needs a return date.' }))
    process.exit(1)
  }
  return code.toUpperCase()
}

/** Whole number from an optional flag; exits with USAGE on anything else. */
export function parseCount(s: string | undefined, flag: string): number | undefined {
  if (s == null) return undefined
  if (/^\d+$/.test(s)) return Number(s)
  console.log(JSON.stringify({ err: 'USAGE', hint: `${flag} '${s}' must be a whole number.` }))
  process.exit(1)
}

/** Google-side filters from the search flags; unset flags stay undefined. */
export function parseGoogleFilters(args: Record<string, unknown>): GoogleFilters {
  const str = (k: string) => args[k] as string | undefined
  const via = str('via')?.split(',').map((c) => c.trim().toUpperCase())
  for (const c of via ?? []) validateAirport(c, '--via airport')
  return {
    maxPrice: parseCount(str('max-price'), '--max-price'),
    connectingAirports: via,
    minLayoverMinutes: parseCount(str('min-layover'), '--min-layover'),
    maxLayoverMinutes: parseCount(str('max-layover'), '--max-layover'),
    lessEmissionsOnly: args['less-emissions'] === true,
    excludeBasicEconomy: args['exclude-basic-economy'] === true,
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
