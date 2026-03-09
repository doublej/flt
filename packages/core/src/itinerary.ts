import type { Offer } from './offer'
import { parsePrice } from './filter'

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function formatGap(minutes: number): string {
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  const sign = minutes < 0 ? '-' : ''
  if (h && m) return `${sign}${h}h ${m}m`
  return h ? `${sign}${h}h` : `${sign}${m}m`
}

function isKnownTime(t: string): boolean {
  return !!t && t !== '??:??'
}

export function connectionGapMin(curr: Offer, next: Offer): number | null {
  if (!isKnownTime(curr.arrival) || !isKnownTime(next.departure)) return null
  const arrDate = curr.arrival_time_ahead
    ? addDays(curr.departure_date, Number.parseInt(curr.arrival_time_ahead))
    : curr.departure_date
  const arrMs = new Date(`${arrDate}T${curr.arrival}`).getTime()
  const depMs = new Date(`${next.departure_date}T${next.departure}`).getTime()
  return Math.round((depMs - arrMs) / 60000)
}

/** Total door-to-door time from first departure to last arrival, including inter-leg layovers */
export function totalTravelTime(offers: Offer[]): string | null {
  const first = offers[0]
  const last = offers[offers.length - 1]
  if (!isKnownTime(first.departure) || !isKnownTime(last.arrival)) return null

  const depMs = new Date(`${first.departure_date}T${first.departure}`).getTime()
  const arrDate = last.arrival_time_ahead
    ? addDays(last.departure_date, Number.parseInt(last.arrival_time_ahead))
    : last.departure_date
  const arrMs = new Date(`${arrDate}T${last.arrival}`).getTime()
  const totalMin = Math.round((arrMs - depMs) / 60000)
  if (totalMin <= 0) return null
  return formatGap(totalMin)
}

export function classifyGap(gap: number, legIdx: number): string | null {
  const label = `Leg ${legIdx + 1}→${legIdx + 2}`
  if (gap < 0) return `⚠ ${label}: departs before previous arrival (${formatGap(gap)})`
  if (gap < 120) return `⚠ ${label}: tight connection (${formatGap(gap)} layover)`
  if (gap > 1440) return `ℹ ${label}: long layover (${formatGap(gap)})`
  return null
}

export function checkConnections(offers: Offer[]): string[] {
  const warnings: string[] = []
  for (let i = 0; i < offers.length - 1; i++) {
    const gap = connectionGapMin(offers[i], offers[i + 1])
    if (gap == null) continue
    const warning = classifyGap(gap, i)
    if (warning) warnings.push(warning)
  }
  return warnings
}

function extractCurrency(price: string): string {
  return price.replace(/[0-9.,\s]/g, '') || '€'
}

export function formatTotal(offers: Offer[]): string {
  const total = offers.reduce((sum, o) => sum + parsePrice(o.price), 0)
  const cur = extractCurrency(offers[0]?.price ?? '€0')
  return `${cur}${Math.round(total)}`
}
