import type { SortKey } from '@flights/core'
import { applyFilters, sortOffers } from '@flights/core'
import type { Terminal } from '../terminal'
import { avail } from '../format'
import type { AppState } from './shared'

function parseTime(hhmm: string): string {
  const h = hhmm.slice(0, 2)
  const m = hhmm.slice(2, 4) || '00'
  return `${h}:${m}`
}

function reFilter(filtered: import('@flights/core').Offer[], term: Terminal, state: AppState) {
  state.flights = filtered
  renderCurrent(term, state)
  const note = filtered.length < state.rawFlights.length
    ? `${filtered.length} OF ${state.rawFlights.length} OFFERS (FILTERED)`
    : `${filtered.length} OFFERS`
  term.setStatus(note)
}

function renderCurrent(term: Terminal, state: AppState) {
  if (!state.lastQuery) return
  const q = state.lastQuery
  term.setContent(avail(state.flights, q.from_airport, q.to_airport, q.date))
}

export function handleFilter(cmd: string, term: Terminal, state: AppState): boolean {
  if (cmd === 'QC') {
    reFilter(state.rawFlights, term, state)
    term.setStatus(`${state.flights.length} OFFERS (FILTERS CLEARED)`)
    return true
  }
  if (cmd === 'QD') {
    reFilter(applyFilters(state.rawFlights, { direct: true }), term, state)
    return true
  }
  const qx = cmd.match(/^QX(\d+)$/)
  if (qx) {
    reFilter(applyFilters(state.rawFlights, { maxStops: parseInt(qx[1]) }), term, state)
    return true
  }
  const qa = cmd.match(/^QA([A-Z]{2})$/)
  if (qa) {
    reFilter(applyFilters(state.rawFlights, { carrier: qa[1] }), term, state)
    return true
  }
  const qda = cmd.match(/^QDA(\d{4})$/)
  if (qda) {
    reFilter(applyFilters(state.rawFlights, { depAfter: parseTime(qda[1]) }), term, state)
    return true
  }
  const qdb = cmd.match(/^QDB(\d{4})$/)
  if (qdb) {
    reFilter(applyFilters(state.rawFlights, { depBefore: parseTime(qdb[1]) }), term, state)
    return true
  }
  const qaa = cmd.match(/^QAA(\d{4})$/)
  if (qaa) {
    reFilter(applyFilters(state.rawFlights, { arrAfter: parseTime(qaa[1]) }), term, state)
    return true
  }
  const qab = cmd.match(/^QAB(\d{4})$/)
  if (qab) {
    reFilter(applyFilters(state.rawFlights, { arrBefore: parseTime(qab[1]) }), term, state)
    return true
  }
  const qm = cmd.match(/^QM(\d+)$/)
  if (qm) {
    reFilter(applyFilters(state.rawFlights, { maxDur: parseInt(qm[1]) }), term, state)
    return true
  }
  return false
}

export function handleSort(cmd: string, term: Terminal, state: AppState): boolean {
  const sortMap: Record<string, SortKey> = {
    SP: 'price', SD: 'dur', SX: 'stops', ST: 'dep',
  }
  const key = sortMap[cmd]
  if (!key) return false
  state.flights = sortOffers(state.flights, key)
  renderCurrent(term, state)
  term.setStatus(`${state.flights.length} OFFERS (SORTED BY ${cmd.slice(1) === 'P' ? 'PRICE' : cmd.slice(1) === 'D' ? 'DURATION' : cmd.slice(1) === 'X' ? 'STOPS' : 'DEPARTURE'})`)
  return true
}
