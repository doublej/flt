import { createEmptySession, getActiveSession, loadConfig, loadSession, searchAirports, buildBookingUrl, resolveOffer } from '@flights/core'
import type { AffiliateConfig } from '@flights/core'
import type { Terminal } from './terminal'
import { detail, help, airports } from './format'
import { type AppState, flags } from './commands/shared'
import { doSearch, doMatrix, SEARCH_RE, MATRIX_RE } from './commands/search'
import { handleFilter, handleSort } from './commands/filter'
import { handleSession } from './commands/session'
import { handleConfig } from './commands/config'
import { doItinerary } from './commands/itinerary'
import { doTakeout } from './commands/takeout'
import { handleFav, handleUnfav, handleFavsList } from './commands/favorites'
import { handleConnections } from './commands/connections'
import { doCompare, COMPARE_RE } from './commands/compare'

export type { AppState } from './commands/shared'

export async function createState(): Promise<AppState> {
  const session = (await loadSession()) ?? createEmptySession()
  const config = await loadConfig()
  return {
    flights: [],
    rawFlights: [],
    lastQuery: null,
    lastRef: null,
    session,
    config,
    currency: config.currency ?? 'EUR',
  }
}

function buildBookingUrlForOffer(offer: import('@flights/core').Offer, state: AppState): string | undefined {
  if (!state.config.marker || !state.config.trs) return undefined
  const affiliate: AffiliateConfig = { marker: state.config.marker, trs: state.config.trs }
  const from = offer.legs[0]?.departure_airport
  const to = offer.legs.at(-1)?.arrival_airport
  if (!from || !to) return undefined
  return buildBookingUrl(affiliate, 'aviasales', {
    from_airport: from, to_airport: to,
    date: offer.departure_date,
    return_date: offer.return_date ?? undefined,
  })
}

function showDetail(offer: import('@flights/core').Offer, idx: number, total: number, term: Terminal, state: AppState) {
  const bookingUrl = buildBookingUrlForOffer(offer, state)
  term.setContent(detail(offer, idx, bookingUrl))
  term.setStatus(total > 0 ? `OFFER ${idx} OF ${total}  ${offer.id}` : `DETAIL  ${offer.id}`)
}

export async function handleCommand(input: string, term: Terminal, state: AppState): Promise<void> {
  const cmd = input.toUpperCase().trim()

  // Always-available commands (work even during search)
  if (cmd === '/SO' || cmd === 'EXIT' || cmd === 'QUIT') { term.stop(); return }
  if (cmd === 'MD') { term.scrollDown(); return }
  if (cmd === 'MU') { term.scrollUp(); return }
  if (cmd === 'MT') { term.scrollTop(); return }
  if (cmd === 'MB') { term.scrollBottom(); return }

  if (flags.busy) { term.setStatus('PROCESSING - PLEASE WAIT'); return }

  if (cmd === 'H/' || cmd === 'HELP') { term.setContent(help()); term.setStatus(''); return }
  const hm = cmd.match(/^H\/([A-Z]+)$/)
  if (hm) { term.setContent(help(hm[1])); term.setStatus(''); return }
  if (cmd === 'XI') { state.flights = []; state.rawFlights = []; await term.showSplash(); return }

  // Inspect offer (*N by line number)
  const im = cmd.match(/^\*(\d+)$/)
  if (im) {
    const n = parseInt(im[1])
    if (n < 1 || n > state.flights.length) {
      term.setStatus(`NO OFFER ${n} - HAVE ${state.flights.length}`)
      return
    }
    showDetail(state.flights[n - 1], n, state.flights.length, term, state)
    return
  }

  // Inspect offer (*ID by flight ID)
  const idm = cmd.match(/^\*(F[0-9A-F]{3,})$/i)
  if (idm) {
    const id = idm[1]
    // Check current display first
    const idx = state.flights.findIndex(f => f.id.toUpperCase() === id.toUpperCase())
    if (idx >= 0) {
      showDetail(state.flights[idx], idx + 1, state.flights.length, term, state)
      return
    }
    // Resolve from session
    const offer = await resolveOffer(state.session, id)
    if (!offer) { term.setStatus(`OFFER ${id.toUpperCase()} NOT FOUND`); return }
    showDetail(offer, 0, 0, term, state)
    return
  }

  // Airport search (AN <query>)
  const am = input.match(/^AN\s+(.+)$/i)
  if (am) {
    const results = searchAirports(am[1].trim())
    term.setContent(airports(results))
    term.setStatus(`${results.length} AIRPORT${results.length !== 1 ? 'S' : ''} FOUND`)
    return
  }

  // Favorites
  const fvm = cmd.match(/^FV\s+(.+)$/i)
  if (fvm) { await handleFav(fvm[1].trim(), term, state); return }
  const uvm = cmd.match(/^UV\s+(.+)$/i)
  if (uvm) { await handleUnfav(uvm[1].trim(), term, state); return }
  if (cmd === 'FV/' || cmd === 'FV') { handleFavsList(term, state); return }

  // Connections
  const cnm = input.match(/^CN\s+(.+)$/i)
  if (cnm) { handleConnections(cnm[1], term, state); return }

  if (cmd.startsWith('SS/') || cmd === 'SS/') { await handleSession(cmd, input, term, state); return }
  if (cmd.startsWith('CF/') || cmd === 'CF/') { await handleConfig(cmd, input, term, state); return }
  if (cmd.startsWith('Q') && state.rawFlights.length > 0 && handleFilter(cmd, term, state)) return
  if (cmd.match(/^S[PDXT]$/) && state.rawFlights.length > 0 && handleSort(cmd, term, state)) return
  if (cmd === 'TO' || cmd.startsWith('TO/')) { await doTakeout(cmd, input, term, state); return }

  const itm = cmd.match(/^IT\s+(.+)$/i)
  if (itm) { await doItinerary(itm[1], term, state); return }

  // Compare (before matrix/search since CM prefix is distinct)
  const cmp = cmd.match(COMPARE_RE)
  if (cmp) { await doCompare(cmp, term, state); return }

  const dm = cmd.match(MATRIX_RE)
  if (dm) { await doMatrix(dm, term, state); return }

  const sm = cmd.match(SEARCH_RE)
  if (sm) { await doSearch(sm, term, state); return }

  term.setStatus(`FORMAT ERROR - ${cmd}`)
}
