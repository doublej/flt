import type { Offer } from '@flights/core'
import { formatTotal, totalTravelTime, connectionGapMin, formatGap } from '@flights/core'
import { M } from '../terminal'
import { to24h, durC, legDur, sabreDate, stopsLbl, contextHelp } from './utils'

export function itinerary(offers: Offer[], warnings: string[]): string[] {
  const lines = ['', `${M.G} ** ITINERARY **${M.g}`, '']

  for (let i = 0; i < offers.length; i++) {
    const o = offers[i]
    const route = o.legs.length >= 2
      ? `${o.legs[0].departure_airport}-${o.legs.at(-1)?.arrival_airport}`
      : `${o.legs[0]?.departure_airport ?? '?'}-${o.legs[0]?.arrival_airport ?? '?'}`

    lines.push(`  ${M.G}LEG ${i + 1}${M.g}  ${M.d}${o.id}${M.g}  ${route}  ${sabreDate(o.departure_date)}`)
    lines.push(`         ${o.name}  ${to24h(o.departure)}-${to24h(o.arrival)}${o.arrival_time_ahead && o.arrival_time_ahead !== '0' ? `+${o.arrival_time_ahead}` : ''}  ${durC(o.duration)}  ${stopsLbl(o.stops)}`)
    lines.push(`         ${M.y}${o.price}${M.g}`)

    if (o.legs.length > 1) {
      for (let li = 0; li < o.legs.length; li++) {
        const l = o.legs[li]
        lines.push(`${M.d}         ${l.departure_airport}-${l.arrival_airport} ${l.airline}${l.flight_number}  ${to24h(l.departure_time)}-${to24h(l.arrival_time)}  ${legDur(l.duration)}${M.g}`)
        if (li < o.layovers.length) {
          const lay = o.layovers[li]
          lines.push(`${M.d}         CNX ${lay.airport}  ${legDur(lay.duration)}${M.g}`)
        }
      }
    }

    if (i < offers.length - 1) {
      const gap = connectionGapMin(o, offers[i + 1])
      if (gap != null) {
        lines.push('')
        lines.push(`${M.d}  ── LAYOVER ${formatGap(gap).toUpperCase()} ──${M.g}`)
      }
    }
    lines.push('')
  }

  const total = formatTotal(offers)
  const travel = totalTravelTime(offers)
  lines.push(`  ${M.G}TOTAL${M.g}  ${M.Y}${total}${M.g}${travel ? `  DOOR-TO-DOOR ${travel.toUpperCase()}` : ''}`)
  lines.push('')

  if (warnings.length) {
    for (const w of warnings) lines.push(`  ${M.y}${w.toUpperCase()}${M.g}`)
    lines.push('')
  }

  const ids = offers.map(o => o.id)
  lines.push(...contextHelp('itinerary', { id: ids[0] ?? '' }))
  return lines
}
