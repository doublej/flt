import type { SearchQuery, SeatType, Offer, CellResult } from '@flights/core'
import {
  applyFilters,
  clearLatestSearch,
  dateRange,
  ensureActiveSession,
  isValidAirport,
  loadCachedSearch,
  mergeExclusions,
  pickCheapest,
  rememberSearch,
  saveCachedSearch,
  saveSession,
  searchSingle,
  setLatestSearch,
  sortOffers,
  throttle,
} from '@flights/core'
import type { Terminal } from '../terminal'
import { M } from '../terminal'
import { avail } from '../format'
import { parseSearchOptions } from '../parse'
import { contextHelp } from '../format/utils'
import type { AppState } from './shared'
import { flags } from './shared'

const MONS: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
}

const SEAT: Record<string, SeatType> = {
  Y: 'economy', W: 'premium-economy', C: 'business', F: 'first',
}

export const SEARCH_RE = /^1\s*([A-Z]{3})\s*([A-Z]{3})\s*(\d{2}[A-Z]{3})(?:\s*\*\s*(\d{2}[A-Z]{3}))?(?:\s*\/\s*([YCWF]))?(.*)$/i
export const MATRIX_RE = /^DM\s*([A-Z]{3})\s*([A-Z]{3})\s*(\d{2}[A-Z]{3})\s*-\s*(\d{2}[A-Z]{3})(?:\s*\*\s*(\d{2}[A-Z]{3})\s*-\s*(\d{2}[A-Z]{3}))?(?:\s*\/\s*([YCWF]))?(.*)$/i

const ERROR_MSG: Record<string, string> = {
  http: 'NETWORK ERROR - CHECK CONNECTION',
  no_script: 'DATA EXTRACTION FAILED',
  no_data: 'NO DATA RETURNED FROM SOURCE',
  no_flights: 'NO FLIGHTS IN RESPONSE',
}

export function parseDate(ddmmm: string): string | null {
  const dd = ddmmm.slice(0, 2)
  const mon = MONS[ddmmm.slice(2).toUpperCase()]
  if (!mon) return null
  const yr = new Date().getFullYear()
  const iso = `${yr}-${mon}-${dd}`
  if (new Date(iso) < new Date(new Date().toISOString().slice(0, 10)))
    return `${yr + 1}-${mon}-${dd}`
  return iso
}

function parsePax(s: string) {
  const ad = parseInt(s.match(/(\d+)AD/i)?.[1] ?? '1')
  const ch = parseInt(s.match(/(\d+)CH/i)?.[1] ?? '0')
  const ins = parseInt(s.match(/(\d+)IS/i)?.[1] ?? '0')
  const inl = parseInt(s.match(/(\d+)IL/i)?.[1] ?? '0')
  return { adults: ad, children: ch, infants_in_seat: ins, infants_on_lap: inl }
}

export async function doSearch(sm: RegExpMatchArray, term: Terminal, state: AppState) {
  const from = sm[1], to = sm[2]
  const depStr = sm[3], retStr = sm[4] || null
  const seat = SEAT[(sm[5] || 'Y').toUpperCase()] ?? 'economy'
  const optStr = sm[6] || ''
  const opts = parseSearchOptions(optStr)

  if (!isValidAirport(from)) { term.setStatus(`INVALID AIRPORT - ${from}`); return }
  if (!isValidAirport(to)) { term.setStatus(`INVALID AIRPORT - ${to}`); return }

  const depDate = parseDate(depStr)
  if (!depDate) { term.setStatus(`INVALID DATE - ${depStr}`); return }
  const retDate = retStr ? parseDate(retStr) : null
  if (retStr && !retDate) { term.setStatus(`INVALID DATE - ${retStr}`); return }

  const currency = opts.currency ?? state.currency
  const pax = opts.pax ? parsePax(opts.pax) : { adults: 1, children: 0, infants_in_seat: 0, infants_on_lap: 0 }

  const ctx = retStr
    ? `${from}-${to} ${depStr.toUpperCase()}*${retStr.toUpperCase()}`
    : `${from}-${to} ${depStr.toUpperCase()}`
  flags.busy = true
  term.setContext(ctx)
  term.startSpinner()
  term.setStatus('PROCESSING')
  term.setContent([])
  term.startLoading(`SEARCHING ${from}-${to}`)
  term.setLoadingProgress(0.1)

  try {
    const q: SearchQuery = {
      from_airport: from, to_airport: to, date: depDate,
      return_date: retDate ?? undefined,
      ...pax,
      seat, currency,
      max_stops: opts.maxStops ?? undefined,
    }

    ensureActiveSession(state.session, `${from}-${to}`)

    // Check cache first (unless /R refresh)
    if (!opts.refresh) {
      term.setLoadingProgress(0.3)
      const cached = await loadCachedSearch(q, depDate, retDate)
      if (cached) {
        term.setLoadingProgress(1)
        rememberSearch(state.session, cached)
        state.lastRef = cached.ref
        finishSearch(cached.offers.map(o => ({ ...o })), q, opts, term, state, true)
        return
      }
    }

    term.setLoadingProgress(0.4)
    await throttle()
    term.setLoadingProgress(0.6)
    const res = await searchSingle(depDate, retDate, q)
    term.setLoadingProgress(0.85)

    if (res.error) {
      term.stopLoading()
      term.setContent(['', `  ${ERROR_MSG[res.error] ?? String(res.error)}`])
      term.setStatus('ERROR')
      return
    }

    if (!res.flights.length) {
      term.stopLoading()
      term.setContent(['', `  NO FLIGHTS FOUND  ${from}-${to}  ${depStr.toUpperCase()}`])
      term.setStatus('0 OFFERS')
      return
    }

    term.setLoadingProgress(0.95)

    // Save to cache
    const entry = await saveCachedSearch(
      q, depDate, retDate,
      res.flights.map(f => ({ ...f, url: res.url })),
    )
    rememberSearch(state.session, entry)
    state.lastRef = entry.ref

    term.setLoadingProgress(1)
    finishSearch(entry.offers, q, opts, term, state, false)
  } catch (e) {
    term.stopLoading()
    term.setContent(['', `  ${e instanceof Error ? e.message : String(e)}`])
    term.setStatus('ERROR')
  } finally {
    flags.busy = false
    term.stopSpinner()
  }
}

function finishSearch(
  offers: Offer[],
  q: SearchQuery,
  opts: ReturnType<typeof parseSearchOptions>,
  term: Terminal,
  state: AppState,
  cached: boolean,
) {
  state.rawFlights = offers
  state.lastQuery = q

  const excludeHub = mergeExclusions(opts.excludeHub ?? undefined, opts.excludeRegion ?? undefined)
  let filtered = applyFilters(offers, {
    ...opts.filters,
    maxStops: opts.maxStops ?? undefined,
    carrier: opts.carrier ?? undefined,
    excludeHub,
  })
  if (opts.sort) filtered = sortOffers(filtered, opts.sort)
  const limit = opts.limit ?? 100
  filtered = filtered.slice(0, limit)
  state.flights = filtered

  setLatestSearch(state.session, filtered, `${q.from_airport} ${q.to_airport} ${q.date}`, state.lastRef ? [state.lastRef] : [])
  saveSession(state.session).catch(() => {})

  const from = q.from_airport, to = q.to_airport
  term.stopLoading()
  term.setContentAnimated(avail(filtered, from, to, q.date))

  const filterNote = filtered.length < offers.length ? ` (${filtered.length} OF ${offers.length} FILTERED)` : ''
  const cacheNote = cached ? ' CACHED' : ''
  term.setStatus(`${filtered.length} OFFERS${filterNote}${cacheNote}`)

  flags.busy = false
  term.stopSpinner()
}

export async function fetchAndCache(
  dep: string, ret: string | null, q: SearchQuery, state: AppState,
): Promise<Offer[]> {
  const cached = await loadCachedSearch(q, dep, ret)
  if (cached) {
    rememberSearch(state.session, cached)
    return cached.offers
  }
  await throttle()
  const result = await searchSingle(dep, ret, q)
  const entry = await saveCachedSearch(q, dep, ret, result.flights.map(f => ({ ...f, url: result.url })))
  rememberSearch(state.session, entry)
  return entry.offers
}

export async function doMatrix(dm: RegExpMatchArray, term: Terminal, state: AppState) {
  const from = dm[1], to = dm[2]
  const depStartStr = dm[3], depEndStr = dm[4]
  const retStartStr = dm[5] || null, retEndStr = dm[6] || null
  const seat = SEAT[(dm[7] || 'Y').toUpperCase()] ?? 'economy'
  const optStr = dm[8] || ''
  const opts = parseSearchOptions(optStr)

  if (!isValidAirport(from)) { term.setStatus(`INVALID AIRPORT - ${from}`); return }
  if (!isValidAirport(to)) { term.setStatus(`INVALID AIRPORT - ${to}`); return }

  const depStart = parseDate(depStartStr)
  const depEnd = parseDate(depEndStr)
  if (!depStart || !depEnd) { term.setStatus('INVALID DATE RANGE'); return }

  const retStart = retStartStr ? parseDate(retStartStr) : null
  const retEnd = retEndStr ? parseDate(retEndStr) : null
  if (retStartStr && (!retStart || !retEnd)) { term.setStatus('INVALID RETURN DATE RANGE'); return }

  const currency = opts.currency ?? state.currency
  const q: SearchQuery = {
    from_airport: from, to_airport: to, date: depStart,
    adults: 1, children: 0, infants_in_seat: 0, infants_on_lap: 0,
    seat, currency,
    max_stops: opts.maxStops ?? undefined,
  }

  const depDates = dateRange(depStart, depEnd)
  const retDates = retStart && retEnd ? dateRange(retStart, retEnd) : null

  if (retDates) {
    const pairs = depDates.length * retDates.length
    if (pairs > 21) {
      term.setStatus(`${pairs} COMBINATIONS EXCEED MAX 21 - NARROW DATES`)
      return
    }
  }

  flags.busy = true
  term.setContext(`DM ${from}-${to}`)
  term.startSpinner()
  term.setStatus('PROCESSING MATRIX')
  term.setContent([])
  term.startLoading(`MATRIX ${from}-${to}`)

  const route = `${from}-${to}`
  ensureActiveSession(state.session, route)

  try {
    const EMPTY: CellResult = { dep: '', ret: null, cheapest: '-', carrier: '-', stops: -1, duration: '-' }

    if (!retDates) {
      const cells: CellResult[] = []
      for (let i = 0; i < depDates.length; i++) {
        term.setLoadingProgress((i + 1) / depDates.length)
        const offers = await fetchAndCache(depDates[i], null, q, state)
        cells.push(pickCheapest(offers) ?? { ...EMPTY, dep: depDates[i] })
      }
      clearLatestSearch(state.session)
      await saveSession(state.session)
      term.stopLoading()
      term.setContentAnimated(matrixOneWay(cells, from, to))
      term.setStatus(`${depDates.length} DATES SEARCHED`)
    } else {
      const pairs: [string, string][] = []
      for (const d of depDates) for (const r of retDates) if (r >= d) pairs.push([d, r])
      const cells: CellResult[] = []
      for (let i = 0; i < pairs.length; i++) {
        term.setLoadingProgress((i + 1) / pairs.length)
        const [d, r] = pairs[i]
        const offers = await fetchAndCache(d, r, q, state)
        cells.push(pickCheapest(offers) ?? { ...EMPTY, dep: d, ret: r })
      }
      clearLatestSearch(state.session)
      await saveSession(state.session)
      term.stopLoading()
      term.setContentAnimated(matrixGrid(depDates, retDates, cells, from, to))
      term.setStatus(`${cells.length} COMBINATIONS SEARCHED`)
    }
  } catch (e) {
    term.stopLoading()
    term.setContent(['', `  ${e instanceof Error ? e.message : String(e)}`])
    term.setStatus('ERROR')
  } finally {
    flags.busy = false
    term.stopSpinner()
  }
}

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

function dayOfWeek(iso: string): string {
  return DAYS[new Date(iso + 'T12:00:00').getDay()]
}

function matrixOneWay(cells: CellResult[], from: string, to: string): string[] {
  const lines = ['', `${M.G} ** DATE MATRIX **  ${from}-${to}  ONE-WAY${M.g}`, '']
  lines.push(`${M.d}  DATE     DAY   PRICE       CARRIER      STOPS      DUR${M.g}`)
  lines.push(`${M.d}  ──────── ───   ──────      ─────────    ──────     ──────${M.g}`)

  let minPrice = Infinity
  for (const c of cells) {
    if (c.cheapest !== '-') {
      const p = parseFloat(c.cheapest.replace(/[^0-9.]/g, ''))
      if (p < minPrice) minPrice = p
    }
  }

  for (const c of cells) {
    const day = dayOfWeek(c.dep)
    const price = c.cheapest.padEnd(10)
    const carrier = c.carrier.slice(0, 12).padEnd(12)
    const stops = c.stops < 0 ? '-'.padEnd(10) : (c.stops === 0 ? 'NONSTOP' : `${c.stops} STOP${c.stops > 1 ? 'S' : ''}`).padEnd(10)
    const dur = c.duration.toUpperCase()
    const isCheapest = c.cheapest !== '-' && parseFloat(c.cheapest.replace(/[^0-9.]/g, '')) === minPrice
    const priceColor = isCheapest ? M.Y : M.y
    lines.push(`  ${c.dep} ${day}   ${priceColor}${price}${M.g}  ${carrier}  ${stops}  ${dur}`)
  }
  lines.push('')
  lines.push(`${M.d}  ${M.Y}●${M.d} CHEAPEST${M.g}`)
  lines.push(...contextHelp('matrix', { FROM: from, TO: to }))
  lines.push('')
  return lines
}

function matrixGrid(depDates: string[], retDates: string[], cells: CellResult[], from: string, to: string): string[] {
  const lines = ['', `${M.G} ** DATE MATRIX **  ${from}-${to}  ROUND-TRIP${M.g}`, '']

  const grid = new Map<string, string>()
  let minPrice = Infinity
  for (const c of cells) {
    grid.set(`${c.dep}|${c.ret}`, c.cheapest)
    if (c.cheapest !== '-') {
      const p = parseFloat(c.cheapest.replace(/[^0-9.]/g, ''))
      if (p < minPrice) minPrice = p
    }
  }

  const retLabels = retDates.map(r => {
    const day = dayOfWeek(r)
    return `${day} ${r.slice(5)}`
  })
  lines.push(`${M.d}  ${'OUT\\BACK'.padEnd(12)}${retLabels.map(r => r.padEnd(12)).join('')}${M.g}`)

  for (const d of depDates) {
    let row = `  ${dayOfWeek(d)} ${d}  `
    for (const r of retDates) {
      const val = grid.get(`${d}|${r}`) ?? '-'
      const isCheapest = val !== '-' && parseFloat(val.replace(/[^0-9.]/g, '')) === minPrice
      row += isCheapest ? `${M.Y}${val.padEnd(12)}${M.g}` : `${M.y}${val.padEnd(12)}${M.g}`
    }
    lines.push(row)
  }

  lines.push('')
  lines.push(`${M.d}  ${M.Y}●${M.d} CHEAPEST${M.g}`)
  lines.push(...contextHelp('matrix', { FROM: from, TO: to }))
  lines.push('')
  return lines
}
