import { checkConnections, listAvailableRefs, resolveOffer } from '@flights/core'
import type { Terminal } from '../terminal'
import { itinerary } from '../format'
import type { AppState } from './shared'

export async function doItinerary(argsStr: string, term: Terminal, state: AppState) {
  const refs = argsStr.trim().split(/\s+/)
  const offers: import('@flights/core').Offer[] = []

  for (const ref of refs) {
    const offer = await resolveOffer(state.session, ref)
    if (!offer) {
      const available = listAvailableRefs(state.session)
      const hint = available.length > 0 ? available.slice(0, 5).join(' ') : 'NONE'
      term.setStatus(`OFFER ${ref} NOT FOUND - AVAILABLE: ${hint}`)
      return
    }
    offers.push(offer)
  }

  const warnings = checkConnections(offers)
  term.setContent(itinerary(offers, warnings))
  term.setStatus(`ITINERARY: ${offers.length} LEG${offers.length !== 1 ? 'S' : ''}`)
}
