import type { FilterOpts, SortKey } from '@flights/core'

export interface SearchOptions {
  pax: string | null
  maxStops: number | null
  currency: string | null
  carrier: string | null
  filters: FilterOpts
  sort: SortKey | null
  limit: number | null
  refresh: boolean
}

const OPT_RE = /\/(DA|DB|AA|AB|DM|SP|SD|SS|ST|[$A-Z])([0-9A-Z]*)/g

function parseTime(hhmm: string): string {
  const h = hhmm.slice(0, 2)
  const m = hhmm.slice(2, 4) || '00'
  return `${h}:${m}`
}

export function parseSearchOptions(optStr: string): SearchOptions {
  const opts: SearchOptions = {
    pax: null,
    maxStops: null,
    currency: null,
    carrier: null,
    filters: {},
    sort: null,
    limit: null,
    refresh: false,
  }

  for (const m of optStr.matchAll(OPT_RE)) {
    const key = m[1]
    const val = m[2]

    if (key === 'P' && val) { opts.pax = val; continue }
    if (key === 'X' && val) { opts.maxStops = parseInt(val); continue }
    if (key === '$' && val) { opts.currency = val; continue }
    if (key === 'A' && val && val.length === 2) { opts.carrier = val; continue }
    if (key === 'DA' && val) { opts.filters.depAfter = parseTime(val); continue }
    if (key === 'DB' && val) { opts.filters.depBefore = parseTime(val); continue }
    if (key === 'AA' && val) { opts.filters.arrAfter = parseTime(val); continue }
    if (key === 'AB' && val) { opts.filters.arrBefore = parseTime(val); continue }
    if (key === 'DM' && val) { opts.filters.maxDur = parseInt(val); continue }
    if (key === 'SP') { opts.sort = 'price'; continue }
    if (key === 'SD') { opts.sort = 'dur'; continue }
    if (key === 'SS') { opts.sort = 'stops'; continue }
    if (key === 'ST') { opts.sort = 'dep'; continue }
    if (key === 'L' && val) { opts.limit = parseInt(val); continue }
    if (key === 'R') { opts.refresh = true; continue }
  }

  return opts
}

/** Split a raw search match into base parts and option string */
export function splitSearchOptions(raw: string): { base: string; optStr: string } {
  // Find the first '/' that starts an option suffix (after the seat class slash)
  // The search regex already captured seat as /Y /C etc.
  // Options start after the base pattern - find remaining /KEY patterns
  const idx = raw.indexOf('/')
  if (idx === -1) return { base: raw, optStr: '' }

  // The first slash might be a seat class (/Y /C /W /F)
  // Check if it's a single letter seat class
  const afterSlash = raw.slice(idx + 1)
  const seatMatch = afterSlash.match(/^([YCWF])(?:\/|$)/i)
  if (seatMatch) {
    const afterSeat = idx + 1 + seatMatch[1].length
    return { base: raw.slice(0, afterSeat), optStr: raw.slice(afterSeat) }
  }

  return { base: raw.slice(0, idx), optStr: raw.slice(idx) }
}
