import { addFavorite, removeFavorite, getFavorites, resolveOffer, saveSession, ensureActiveSession } from '@flights/core'
import type { Terminal } from '../terminal'
import { favsList } from '../format'
import type { AppState } from './shared'

export async function handleFav(ref: string, term: Terminal, state: AppState) {
  ensureActiveSession(state.session)

  let offer: import('@flights/core').Offer | null = null
  const n = parseInt(ref)
  if (!isNaN(n) && n >= 1 && n <= state.flights.length) {
    offer = state.flights[n - 1]
  } else {
    offer = await resolveOffer(state.session, ref)
  }

  if (!offer) {
    term.setStatus(`OFFER ${ref.toUpperCase()} NOT FOUND`)
    return
  }

  const result = addFavorite(state.session, offer)
  if (result === 'no_session') {
    term.setStatus('NO ACTIVE SESSION - USE SS/START')
    return
  }
  if (result === 'duplicate') {
    term.setStatus(`ALREADY STARRED: ${offer.id}`)
    return
  }

  await saveSession(state.session)
  term.setStatus(`STARRED ${offer.id} - ${offer.name} ${offer.price}`)
}

export async function handleUnfav(ref: string, term: Terminal, state: AppState) {
  let offerId = ref.toUpperCase()
  const n = parseInt(ref)
  if (!isNaN(n) && n >= 1 && n <= state.flights.length) {
    offerId = state.flights[n - 1].id
  }

  const removed = removeFavorite(state.session, offerId)
  if (!removed) {
    term.setStatus(`NOT STARRED: ${offerId}`)
    return
  }

  await saveSession(state.session)
  term.setStatus(`UNSTARRED ${offerId}`)
}

export function handleFavsList(term: Terminal, state: AppState) {
  const favorites = getFavorites(state.session)
  if (!favorites.length) {
    term.setStatus('NO FAVORITES')
    return
  }
  term.setContent(favsList(favorites))
  term.setStatus(`${favorites.length} FAVORITE${favorites.length !== 1 ? 'S' : ''}`)
}
