import type { SearchQuery, SeatType, Offer } from '@flights/core'
import {
  ensureActiveSession,
  isValidAirport,
  saveSession,
} from '@flights/core'
import { parsePrice } from '@flights/core'
import type { Terminal } from '../terminal'
import { M } from '../terminal'
import { parseDate, fetchAndCache } from './search'
import { parseSearchOptions } from '../parse'
import { contextHelp, durC, stopsLbl } from '../format/utils'
import type { AppState } from './shared'
import { flags } from './shared'

const SEAT: Record<string, SeatType> = {
  Y: 'economy', W: 'premium-economy', C: 'business', F: 'first',
}

export const COMPARE_RE = /^CM\s+([A-Z]{3}(?:,[A-Z]{3})*)\s+([A-Z]{3}(?:,[A-Z]{3})*)\s+(\d{2}[A-Z]{3})(?:\s*\/\s*([YCWF]))?(.*)$/i

interface RouteResult {
  from: string
  to: string
  cheapest: Offer | null
}

function pickCheapestOffer(offers: Offer[]): Offer | null {
  if (!offers.length) return null
  let best = offers[0]
  for (const f of offers) {
    if (parsePrice(f.price) < parsePrice(best.price)) best = f
  }
  return best
}

export async function doCompare(cm: RegExpMatchArray, term: Terminal, state: AppState) {
  const origins = cm[1].toUpperCase().split(',')
  const dests = cm[2].toUpperCase().split(',')
  const dateStr = cm[3]
  const seat = SEAT[(cm[4] || 'Y').toUpperCase()] ?? 'economy'
  const optStr = cm[5] || ''
  const opts = parseSearchOptions(optStr)

  for (const code of [...origins, ...dests]) {
    if (!isValidAirport(code)) { term.setStatus(`INVALID AIRPORT - ${code}`); return }
  }

  const depDate = parseDate(dateStr)
  if (!depDate) { term.setStatus(`INVALID DATE - ${dateStr}`); return }

  const currency = opts.currency ?? state.currency
  const pairs: [string, string][] = []
  for (const from of origins) for (const to of dests) if (from !== to) pairs.push([from, to])

  if (!pairs.length) { term.setStatus('NO VALID ROUTE PAIRS'); return }

  flags.busy = true
  term.setContext(`CM ${origins.join(',')}→${dests.join(',')}`)
  term.startSpinner()
  term.setStatus('COMPARING')
  term.setContent([])
  term.startLoading(`COMPARING ${pairs.length} ROUTE${pairs.length !== 1 ? 'S' : ''}`)

  ensureActiveSession(state.session, `${origins[0]}-${dests[0]}`)

  try {
    const results: RouteResult[] = []
    for (let i = 0; i < pairs.length; i++) {
      const [from, to] = pairs[i]
      term.setLoadingProgress((i + 1) / pairs.length)

      const q: SearchQuery = {
        from_airport: from, to_airport: to, date: depDate,
        adults: 1, children: 0, infants_in_seat: 0, infants_on_lap: 0,
        seat, currency,
        max_stops: opts.maxStops ?? undefined,
      }

      const offers = await fetchAndCache(depDate, null, q, state)
      results.push({ from, to, cheapest: pickCheapestOffer(offers) })
    }

    await saveSession(state.session)
    term.stopLoading()
    term.setContentAnimated(compareTable(results, depDate, dateStr.toUpperCase()))
    term.setStatus(`${pairs.length} ROUTE${pairs.length !== 1 ? 'S' : ''} COMPARED`)
  } catch (e) {
    term.stopLoading()
    term.setContent(['', `  ${e instanceof Error ? e.message : String(e)}`])
    term.setStatus('ERROR')
  } finally {
    flags.busy = false
    term.stopSpinner()
  }
}

function compareTable(results: RouteResult[], depDate: string, dateLabel: string): string[] {
  const d = new Date(depDate + 'T12:00:00')
  const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const
  const day = DAYS[d.getDay()]

  const lines = ['', `${M.G} ** ROUTE COMPARISON **  ${day} ${dateLabel}${M.g}`, '']
  lines.push(`${M.d}   ROUTE          CHEAPEST     CARRIER          STOPS      DUR       ID${M.g}`)
  lines.push(`${M.d}   ───────────    ──────────   ──────────────   ────────   ──────    ─────${M.g}`)

  for (const r of results) {
    const route = `${r.from} → ${r.to}`.padEnd(13)
    if (!r.cheapest) {
      lines.push(`   ${route}  ${M.d}---${M.g}`)
      continue
    }
    const o = r.cheapest
    const price = o.price.padEnd(11)
    const carrier = o.name.slice(0, 16).padEnd(16)
    const stops = stopsLbl(o.stops).padEnd(10)
    const dur = durC(o.duration).padEnd(8)
    lines.push(`   ${route}  ${M.y}${price}${M.g}  ${carrier}  ${stops}  ${dur}  ${M.d}${o.id}${M.g}`)
  }

  lines.push('')
  lines.push(...contextHelp('compare'))
  return lines
}
