import type { Offer, Airport } from '@flights/core'
import { M } from '../terminal'
import { to24h, durC, legDur, acCode, sabreDate, stopsLbl, flightTags, contextHelp, col, rCol, div } from './utils'

export function avail(flights: Offer[], from: string, to: string, date: string): string[] {
  const W = { ln: 3, id: 5, carrier: 9, dep: 4, arr: 4, ahead: 2, dur: 6, ac: 3, stops: 8, price: 6 }

  const lines: string[] = [
    '',
    `${M.G} ** FLIGHT AVAILABILITY **  ${from}-${to}  ${sabreDate(date)}${M.g}`,
    '',
    `${M.d}  ${rCol('#', W.ln)}  ${col('ID', W.id)}  ${col('CARRIER', W.carrier)}    ${col('DEP', W.dep)}  ${col('ARR', W.arr)}${' '.repeat(W.ahead)}    ${col('DUR', W.dur)}  ${col('AC', W.ac)}  ${col('STOPS', W.stops)}   ${col('PRICE', W.price)}     TAGS${M.g}`,
    `${M.d}  ${div(W.ln)}  ${div(W.id)}  ${div(W.carrier)}    ${div(W.dep)}  ${div(W.arr)}${' '.repeat(W.ahead)}    ${div(W.dur)}  ${div(W.ac)}  ${div(W.stops)}   ${div(W.price)}    ${div(4)}${M.g}`,
  ]

  for (let i = 0; i < flights.length; i++) {
    const f = flights[i]
    const leg = f.legs[0]
    const ln = rCol(String(i + 1), W.ln)
    const id = col(f.id, W.id)
    const car = leg
      ? col(`${leg.airline} ${leg.flight_number}`, W.carrier)
      : col(f.name, W.carrier)
    const dep = col(to24h(f.departure), W.dep)
    const arr = col(to24h(f.arrival), W.arr)
    const ahead = f.arrival_time_ahead && f.arrival_time_ahead !== '0'
      ? rCol(`+${f.arrival_time_ahead}`, W.ahead)
      : ' '.repeat(W.ahead)
    const dur = col(durC(f.duration), W.dur)
    const ac = leg ? col(acCode(leg.aircraft), W.ac) : col('---', W.ac)
    const stops = col(stopsLbl(f.stops), W.stops)
    const tags = flightTags(f)
    const best = f.is_best ? ` ${M.Y}●${M.g}` : ''

    lines.push(
      `  ${M.G}${ln}${M.g}  ${M.d}${id}${M.g}  ${car}    ${dep}  ${arr}${ahead}` +
      `    ${dur}  ${ac}  ${stops}   ${M.y}${col(f.price, W.price)}${M.g}` +
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
  const W = { ln: 3, id: 5, route: 13, dep: 9, carrier: 12, stops: 10, price: 6 }

  const lines = ['', `${M.G} ** FAVORITES **${M.g}`, '']
  lines.push(`${M.d}  ${rCol('#', W.ln)}  ${col('ID', W.id)}  ${col('ROUTE', W.route)}  ${col('DEP', W.dep)}  ${col('CARRIER', W.carrier)}  ${col('STOPS', W.stops)}  ${col('PRICE', W.price)}${M.g}`)
  lines.push(`${M.d}  ${div(W.ln)}  ${div(W.id)}  ${div(W.route)}  ${div(W.dep)}  ${div(W.carrier)}  ${div(W.stops)}  ${div(W.price)}${M.g}`)

  for (let i = 0; i < favorites.length; i++) {
    const f = favorites[i]
    const ln = rCol(String(i + 1), W.ln)
    const id = col(f.id, W.id)
    const from = f.legs[0]?.departure_airport ?? '???'
    const to = f.legs.at(-1)?.arrival_airport ?? '???'
    const route = col(`${from}-${to}`, W.route)
    const dep = col(sabreDate(f.departure_date), W.dep)
    const carrier = col(f.name, W.carrier)
    const stops = col(stopsLbl(f.stops), W.stops)
    lines.push(`  ${M.G}${ln}${M.g}  ${M.d}${id}${M.g}  ${route}  ${dep}  ${carrier}  ${stops}  ${M.y}${col(f.price, W.price)}${M.g}`)
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
