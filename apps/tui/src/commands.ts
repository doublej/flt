import { createEmptySession, getActiveSession, loadConfig, loadSession, searchAirports } from '@flights/core'
import type { Terminal } from './terminal'
import { detail, help, airports } from './format'
import { type AppState, flags } from './commands/shared'
import { doSearch, doMatrix, SEARCH_RE, MATRIX_RE } from './commands/search'
import { handleFilter, handleSort } from './commands/filter'
import { handleSession } from './commands/session'
import { handleConfig } from './commands/config'
import { doItinerary } from './commands/itinerary'
import { doTakeout } from './commands/takeout'

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

  // Inspect offer (*N)
  const im = cmd.match(/^\*(\d+)$/)
  if (im) {
    const n = parseInt(im[1])
    if (n < 1 || n > state.flights.length) {
      term.setStatus(`NO OFFER ${n} - HAVE ${state.flights.length}`)
      return
    }
    term.setContent(detail(state.flights[n - 1], n))
    term.setStatus(`OFFER ${n} OF ${state.flights.length}`)
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

  if (cmd.startsWith('SS/') || cmd === 'SS/') { await handleSession(cmd, input, term, state); return }
  if (cmd.startsWith('CF/') || cmd === 'CF/') { await handleConfig(cmd, input, term, state); return }
  if (cmd.startsWith('Q') && state.rawFlights.length > 0 && handleFilter(cmd, term, state)) return
  if (cmd.match(/^S[PDXT]$/) && state.rawFlights.length > 0 && handleSort(cmd, term, state)) return
  if (cmd === 'TO' || cmd.startsWith('TO/')) { await doTakeout(cmd, input, term, state); return }

  const itm = cmd.match(/^IT\s+(.+)$/i)
  if (itm) { await doItinerary(itm[1], term, state); return }

  const dm = cmd.match(MATRIX_RE)
  if (dm) { await doMatrix(dm, term, state); return }

  const sm = cmd.match(SEARCH_RE)
  if (sm) { await doSearch(sm, term, state); return }

  term.setStatus(`FORMAT ERROR - ${cmd}`)
}
