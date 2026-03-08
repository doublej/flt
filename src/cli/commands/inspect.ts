import { defineCommand } from 'citty'
import { formatError } from '../format'
import { listAvailableRefs, loadSession, resolveOffer } from '../state'

export const inspectCommand = defineCommand({
  meta: { name: 'inspect', description: 'Show details of a flight offer by ID' },
  args: {
    id: {
      type: 'positional',
      description: 'Offer ID (e.g. O1 or IAO-MNL@20260324#A1B2C3:O1)',
      required: true,
    },
    fmt: { type: 'string', description: 'Output format: json|table', default: 'json' },
  },
  async run({ args }) {
    const session = await loadSession()
    if (!session) {
      console.log(formatError('NO_SESSION', 'No search results cached. Run `flt search` first.'))
      return
    }

    const offer = await resolveOffer(session, args.id)
    if (!offer) {
      const refs = listAvailableRefs(session)
      const ids = refs.length
        ? refs.join(', ')
        : (session.latest?.offers ?? []).map((o) => o.id).join(', ')
      console.log(formatError('NOT_FOUND', `Offer '${args.id}' not found. Available: ${ids}`))
      return
    }

    if (args.fmt === 'table') {
      const fmtDur = (m: number) => {
        const h = Math.floor(m / 60)
        return h ? `${h}h ${m % 60}m` : `${m}m`
      }
      const entries: [string, string][] = [
        ['ID', offer.id],
        ['Price', offer.price],
        ['Airline', offer.name],
        ['Stops', String(offer.stops)],
        ['Duration', offer.duration],
        ['Departure', `${offer.departure_date} ${offer.departure}`],
        ['Arrival', `${offer.arrival}${offer.arrival_time_ahead}`],
        ['Best', offer.is_best ? 'yes' : 'no'],
        ['URL', offer.url],
      ]
      if (offer.return_date) entries.splice(7, 0, ['Return', offer.return_date])
      for (let i = 0; i < offer.legs.length; i++) {
        const leg = offer.legs[i]
        entries.push([
          `Leg ${i + 1}`,
          `${leg.flight_number} ${leg.departure_airport}→${leg.arrival_airport} ${leg.departure_time}–${leg.arrival_time} ${fmtDur(leg.duration)} ${leg.aircraft}`.trim(),
        ])
        if (i < offer.layovers.length) {
          const lay = offer.layovers[i]
          const warn = lay.duration < 60 ? ' ⚠ tight' : lay.duration > 480 ? ' ℹ long' : ''
          entries.push(['Layover', `${lay.airport} ${fmtDur(lay.duration)}${warn}`])
        }
      }
      const maxKey = Math.max(...entries.map(([k]) => k.length))
      console.log(entries.map(([k, v]) => `${k.padEnd(maxKey)}  ${v}`).join('\n'))
    } else {
      console.log(JSON.stringify(offer, null, 2))
    }
  },
})
