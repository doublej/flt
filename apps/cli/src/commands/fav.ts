import { defineCommand } from 'citty'
import { formatError, formatOffers } from '../format'
import {
  addFavorite,
  createEmptySession,
  getFavorites,
  loadSession,
  removeFavorite,
  resolveOffer,
  saveSession,
} from '../state'
import type { Format, View } from '../types'

export const favCommand = defineCommand({
  meta: { name: 'fav', description: 'Star a flight offer as favorite' },
  args: {
    id: {
      type: 'positional',
      description: 'Offer ID (e.g. Fa3b7 or REF:Fa3b7)',
      required: true,
    },
  },
  async run({ args }) {
    const session = (await loadSession()) ?? createEmptySession()

    const offer = await resolveOffer(session, args.id)
    if (!offer) {
      console.log(formatError('NOT_FOUND', `Offer '${args.id}' not found.`))
      return
    }

    const result = addFavorite(session, offer)
    if (result === 'no_session') {
      console.log(formatError('NO_SESSION', 'No active session. Run `flt search` or `flt session start` first.'))
      return
    }
    if (result === 'duplicate') {
      console.log(formatError('ALREADY_FAVORITED', `${offer.id} is already a favorite.`))
      return
    }

    await saveSession(session)
    console.log(JSON.stringify({ ok: true, id: offer.id, price: offer.price, name: offer.name }))
  },
})

export const unfavCommand = defineCommand({
  meta: { name: 'unfav', description: 'Remove a flight from favorites' },
  args: {
    id: {
      type: 'positional',
      description: 'Offer ID to remove (e.g. Fa3b7)',
      required: true,
    },
  },
  async run({ args }) {
    const session = (await loadSession()) ?? createEmptySession()

    if (!removeFavorite(session, args.id)) {
      console.log(formatError('NOT_FOUND', `Offer '${args.id}' is not in favorites.`))
      return
    }

    await saveSession(session)
    console.log(JSON.stringify({ ok: true, removed: args.id }))
  },
})

export const favsCommand = defineCommand({
  meta: { name: 'favs', description: 'List favorited flights in the active session' },
  args: {
    fmt: { type: 'string', description: 'Output format: jsonl|tsv|table|brief', default: 'table' },
    fields: { type: 'string', description: 'Comma-separated fields' },
    view: { type: 'string', description: 'Field preset: min|std|full' },
  },
  async run({ args }) {
    const session = await loadSession()
    if (!session) {
      console.log(formatError('NO_SESSION', 'No active session. Run `flt search` first.'))
      return
    }

    const favorites = getFavorites(session)
    if (!favorites.length) {
      console.log(formatError('EMPTY', 'No favorites yet. Use `flt fav <id>` to star an offer.'))
      return
    }

    console.log(
      formatOffers(favorites, args.fmt as Format, args.fields, args.view as View | undefined),
    )
    console.error(`\n  ${favorites.length} favorite${favorites.length !== 1 ? 's' : ''}`)
  },
})
