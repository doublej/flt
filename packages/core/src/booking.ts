/**
 * Affiliate booking link generator.
 * Constructs Travelpayouts redirect URLs from flight search data.
 */

import { isValidAirport, searchAirports } from './airports'
import type { SearchParams } from './types'

export interface AffiliateConfig {
  marker: string
  trs: string
}

export interface BookingFilters {
  adults?: number
  children?: number
  infants_in_seat?: number
  infants_on_lap?: number
  seat?: 'economy' | 'premium-economy' | 'business' | 'first'
}

interface ProgramDef {
  label: string
  campaignId: number
  p: number
  buildUrl: (from: string, to: string, date: string, returnDate?: string, filters?: BookingFilters) => string
}

function formatDDMM(isoDate: string): string {
  const [, m, d] = isoDate.split('-')
  return `${d}${m}`
}

/** Compact class prefix: c=business, f=first, w=premium-economy, omitted=economy */
function seatPrefix(seat?: BookingFilters['seat']): string {
  if (seat === 'business') return 'c'
  if (seat === 'first') return 'f'
  if (seat === 'premium-economy') return 'w'
  return ''
}

/** Encode passengers as trailing digits with zeros stripped: {adults}{children?}{infants?} */
function passengerSuffix(filters?: BookingFilters): string {
  const adults = filters?.adults ?? 1
  const children = (filters?.children ?? 0) + (filters?.infants_in_seat ?? 0)
  const infants = filters?.infants_on_lap ?? 0
  if (infants) return `${adults}${children}${infants}`
  if (children) return `${adults}${children}`
  return `${adults}`
}

const PROGRAMS = {
  aviasales: {
    label: 'Aviasales',
    campaignId: 100,
    p: 4114,
    buildUrl: (from, to, date, returnDate, filters) => {
      const d = formatDDMM(date)
      const cls = seatPrefix(filters?.seat)
      const pax = passengerSuffix(filters)
      const base = `https://www.aviasales.com/search/${from}${d}${to}`
      return returnDate ? `${base}${formatDDMM(returnDate)}${cls}${pax}` : `${base}${cls}${pax}`
    },
  },
  // To add more programs: connect them at app.travelpayouts.com/programs
  // then add an entry here with the campaign_id and p from the dashboard link generator.
} satisfies Record<string, ProgramDef>

export type ProgramName = keyof typeof PROGRAMS

/** Resolve an airport string to a 3-letter IATA code. Returns null if unresolvable. */
export function resolveIata(airport: string): string | null {
  const upper = airport.toUpperCase()
  if (upper.length === 3 && isValidAirport(upper)) return upper
  const results = searchAirports(airport)
  return results[0]?.code ?? null
}

export function buildBookingUrl(
  config: AffiliateConfig,
  program: ProgramName,
  params: Pick<SearchParams, 'from_airport' | 'to_airport' | 'date' | 'return_date'>,
  filters?: BookingFilters,
  subId?: string,
): string {
  const def = PROGRAMS[program]
  if (!def) throw new Error(`Unknown program: ${String(program)}`)

  const destination = def.buildUrl(
    params.from_airport,
    params.to_airport,
    params.date,
    params.return_date ?? undefined,
    filters,
  )

  const qs = new URLSearchParams({
    campaign_id: String(def.campaignId),
    marker: subId ? `${config.marker}.${subId}` : config.marker,
    p: String(def.p),
    trs: config.trs,
  })

  return `https://tp.media/r?${qs}&u=${encodeURIComponent(destination)}`
}

export function buildBookingUrls(
  config: AffiliateConfig,
  params: Pick<SearchParams, 'from_airport' | 'to_airport' | 'date' | 'return_date'>,
  filters?: BookingFilters,
  subId?: string,
): Record<ProgramName, string> {
  const result = {} as Record<ProgramName, string>
  for (const name of PROGRAM_NAMES) {
    result[name] = buildBookingUrl(config, name, params, filters, subId)
  }
  return result
}

export const PROGRAM_NAMES = Object.keys(PROGRAMS) as ProgramName[]

export const PROGRAM_LABELS: Record<ProgramName, string> = Object.fromEntries(
  PROGRAM_NAMES.map((k) => [k, PROGRAMS[k].label]),
) as Record<ProgramName, string>
