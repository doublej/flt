import type { Offer, Airport } from '@flights/core'
import { M } from '../terminal'
import { to24h, durC, legDur, acCode, sabreDate, stopsLbl, flightTags, contextHelp } from './utils'

export function avail(flights: Offer[], from: string, to: string, date: string): string[] {
  const lines: string[] = [
    '',
    `${M.G} ** FLIGHT AVAILABILITY **  ${from}-${to}  ${sabreDate(date)}${M.g}`,
    '',
    `${M.d}   #  ID     CARRIER      DEP   ARR       DUR     AC   STOPS      PRICE     TAGS${M.g}`,
    `${M.d}  ──  ─────  ─────────    ────  ──────    ──────  ───  ────────   ──────    ────${M.g}`,
  ]

  for (let i = 0; i < flights.length; i++) {
    const f = flights[i]
    const leg = f.legs[0]
    const ln = String(i + 1).padStart(3)
    const id = f.id.padEnd(5)
    const car = leg
      ? `${leg.airline} ${leg.flight_number}`.padEnd(9)
      : f.name.slice(0, 9).padEnd(9)
    const dep = to24h(f.departure).padEnd(4)
    const arr = to24h(f.arrival)
    const ahead = f.arrival_time_ahead && f.arrival_time_ahead !== '0'
      ? `+${f.arrival_time_ahead}`
      : '  '
    const dur = durC(f.duration).padEnd(6)
    const ac = leg ? acCode(leg.aircraft).padEnd(3) : '---'
    const stops = stopsLbl(f.stops).padEnd(8)
    const tags = flightTags(f)
    const best = f.is_best ? ` ${M.Y}●${M.g}` : ''

    lines.push(
      `  ${M.G}${ln}${M.g}  ${M.d}${id}${M.g}  ${car}    ${dep}  ${arr}${ahead}` +
      `    ${dur}  ${ac}  ${stops}   ${M.y}${f.price}${M.g}` +
      `${tags}${best}`,
    )

    if (f.legs.length > 1) {
      for (let li = 0; li < f.legs.length; li++) {
        const l = f.legs[li]
        const ld = to24h(l.departure_time)
        const la = to24h(l.arrival_time)
        lines.push(
          `${M.d}              ${l.departure_airport}-${l.arrival_airport}` +
          ` ${l.airline}${l.flight_number}  ${ld}-${la}  ${legDur(l.duration)}${M.g}`,
        )
        if (li < f.layovers.length) {
          const lay = f.layovers[li]
          lines.push(`${M.d}              CNX ${lay.airport}  ${legDur(lay.duration)}${M.g}`)
        }
      }
    }
  }

  lines.push('')
  lines.push(
    `  ${flights.length} OFFER${flights.length !== 1 ? 'S' : ''} FOUND` +
    `                   ${M.Y}● BEST${M.g}  ${M.d}/E ETKT  * CODESHARE${M.g}`,
  )
  lines.push(...contextHelp('avail'))
  return lines
}

export function detail(f: Offer, idx: number, bookingUrl?: string): string[] {
  const lines: string[] = [
    '',
    `${M.G} ** FLIGHT DETAIL **  ${f.id}` +
    `                     ${M.y}${f.price}${M.g}`,
    '',
  ]

  for (let i = 0; i < f.legs.length; i++) {
    const l = f.legs[i]
    if (i > 0) lines.push(`${M.d}  ───────────────────────────────────────${M.g}`)
    lines.push(
      `  ${M.G}LEG ${i + 1}${M.g}   ${l.airline} ${l.flight_number}` +
      `   ${l.departure_airport} → ${l.arrival_airport}    ${legDur(l.duration)}`,
    )
    lines.push(`         ${l.aircraft}`)
    if (l.operator)
      lines.push(`${M.d}         OPERATED BY ${l.operator}${M.g}`)
    lines.push(`         DEP ${to24h(l.departure_time)}  ${l.departure_airport}`)
    lines.push(`         ARR ${to24h(l.arrival_time)}  ${l.arrival_airport}`)
    if (l.seat_pitch)
      lines.push(`${M.d}         PITCH ${l.seat_pitch}${M.g}`)

    if (i < f.layovers.length) {
      const lay = f.layovers[i]
      lines.push('')
      lines.push(`  ${M.y}LAYOVER${M.g}  ${lay.airport_name} (${lay.airport})  ${legDur(lay.duration)}`)
    }
    lines.push('')
  }

  lines.push(`  TOTAL: ${f.duration}    ${stopsLbl(f.stops)}    DEP ${sabreDate(f.departure_date)}`)
  if (f.return_date) lines.push(`  RETURN: ${sabreDate(f.return_date)}`)
  if (bookingUrl) lines.push(`  ${M.y}BOOK${M.g}  ${bookingUrl}`)
  lines.push('')
  lines.push(...contextHelp('detail', { id: f.id }))
  return lines
}

export function favsList(favorites: Offer[]): string[] {
  const lines = ['', `${M.G} ** FAVORITES **${M.g}`, '']
  lines.push(`${M.d}   #  ID     ROUTE          DEP        CARRIER      STOPS      PRICE${M.g}`)
  lines.push(`${M.d}  ──  ─────  ───────────    ─────────  ─────────    ────────   ──────${M.g}`)

  for (let i = 0; i < favorites.length; i++) {
    const f = favorites[i]
    const ln = String(i + 1).padStart(3)
    const id = f.id.padEnd(5)
    const from = f.legs[0]?.departure_airport ?? '???'
    const to = f.legs.at(-1)?.arrival_airport ?? '???'
    const route = `${from}-${to}`.padEnd(13)
    const dep = sabreDate(f.departure_date).padEnd(9)
    const carrier = f.name.slice(0, 12).padEnd(12)
    const stops = stopsLbl(f.stops).padEnd(10)
    lines.push(`  ${M.G}${ln}${M.g}  ${M.d}${id}${M.g}  ${route}  ${dep}  ${carrier}  ${stops}  ${M.y}${f.price}${M.g}`)
  }

  lines.push('')
  lines.push(...contextHelp('favs'))
  return lines
}

export function airports(results: Airport[]): string[] {
  const lines = ['', `${M.G} ** AIRPORT SEARCH RESULTS **${M.g}`, '']
  for (const r of results.slice(0, 10)) {
    lines.push(`  ${M.G}${r.code}${M.g}  ${r.name}`)
    lines.push(`${M.d}       ${r.city}, ${r.country}${M.g}`)
  }
  if (!results.length) lines.push(`  ${M.y}NO AIRPORTS FOUND${M.g}`)
  lines.push('')
  return lines
}
