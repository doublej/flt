import type { Flight } from '@flights/core'
import { M } from '../terminal'

const HINTS: Record<string, string> = {
  avail: '*N DETAIL  FV N STAR  QD DIRECT  SP SORT  MD/MU SCROLL',
  detail: 'IT {id} ITINERARY  FV {id} STAR  H/ HELP',
  filter: 'QC CLEAR  {count} OF {total} FILTERED',
  session: 'SS/START  SS/REOPEN  SS/REFS  SS/LIST',
  matrix: '1{FROM}{TO}{DATE} SEARCH DATE  H/ HELP',
  itinerary: 'TO TAKEOUT  FV {id} STAR  H/ HELP',
  favs: 'UV {id} UNSTAR  *{id} DETAIL  IT {id} ITINERARY',
  connections: '1{FROM}{VIA}{DATE} SEARCH ROUTE  H/ HELP',
  compare: '*{id} DETAIL  1{ROUTE}{DATE} SEARCH',
  config: 'CF/KEY=VALUE SET  CF/KEY= UNSET  H/ HELP',
  takeout: 'SS/ SESSION  H/ HELP',
}

export function contextHelp(ctx: string, meta?: Record<string, string>): string[] {
  let hint = HINTS[ctx]
  if (!hint) return []
  if (meta) {
    for (const [k, v] of Object.entries(meta)) hint = hint.replaceAll(`{${k}}`, v)
  }
  hint = hint.replace(/\s*\{[^}]+\}/g, '')
  return [`${M.d}  ${hint}${M.g}`]
}

export function to24h(t: string): string {
  if (t === '??:??' || !t) return '----'
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!m) return t.replace(':', '').slice(0, 4).padStart(4, '0')
  let h = parseInt(m[1])
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}${m[2]}`
}

export function durC(d: string): string {
  const m = d.match(/(\d+)\s*hr?\s*(?:(\d+)\s*min)?/)
  if (!m) return d.toUpperCase()
  return `${m[1]}H${(m[2] ?? '0').padStart(2, '0')}M`
}

export function legDur(mins: number): string {
  return `${Math.floor(mins / 60)}H${String(mins % 60).padStart(2, '0')}M`
}

export function acCode(aircraft: string): string {
  const m = aircraft.match(/(\d{3})-?(\d)/)
  if (m) return m[1].slice(0, 2) + m[2]
  const m2 = aircraft.match(/(\d{3})/)
  return m2 ? m2[1] : '---'
}

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const
const MONTH = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const

export function sabreDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return `${DAYS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}${MONTH[d.getMonth()]}${String(d.getFullYear()).slice(2)}`
}

export function stopsLbl(n: number): string {
  if (n === 0) return 'NONSTOP'
  return `${n} STOP${n > 1 ? 'S' : ''}`
}

export function flightTags(f: Flight): string {
  const t: string[] = []
  if (f.legs.some((l) => l.operator)) t.push('*')
  t.push('/E')
  return t.length ? ` ${M.d}${t.join(' ')}${M.g}` : ''
}
