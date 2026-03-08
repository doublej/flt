import { defineCommand } from 'citty'
import { parsePrice } from '../filter'
import { formatError } from '../format'
import { listAvailableRefs, loadSession, resolveOffer } from '../state'
import type { Offer } from '../types'

function stopsLabel(n: number): string {
  if (n === 0) return 'direct'
  return `${n} stop${n > 1 ? 's' : ''}`
}

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatGap(minutes: number): string {
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

function connectionGapMin(curr: Offer, next: Offer): number | null {
  if (!isKnownTime(curr.arrival) || !isKnownTime(next.departure)) return null
  const arrDate = curr.arrival_time_ahead
    ? addDays(curr.departure_date, Number.parseInt(curr.arrival_time_ahead))
    : curr.departure_date
  const arrMs = new Date(`${arrDate}T${curr.arrival}`).getTime()
  const depMs = new Date(`${next.departure_date}T${next.departure}`).getTime()
  return Math.round((depMs - arrMs) / 60000)
}

/** Total door-to-door time from first departure to last arrival, including inter-leg layovers */
function totalTravelTime(offers: Offer[]): string | null {
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

function classifyGap(gap: number, legIdx: number): string | null {
  const label = `Leg ${legIdx + 1}→${legIdx + 2}`
  if (gap < 0) return `⚠ ${label}: departs before previous arrival (${formatGap(gap)})`
  if (gap < 120) return `⚠ ${label}: tight connection (${formatGap(gap)} layover)`
  if (gap > 1440) return `ℹ ${label}: long layover (${formatGap(gap)})`
  return null
}

function checkConnections(offers: Offer[]): string[] {
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

function formatTotal(offers: Offer[]): string {
  const total = offers.reduce((sum, o) => sum + parsePrice(o.price), 0)
  const cur = extractCurrency(offers[0]?.price ?? '€0')
  return `${cur}${Math.round(total)}`
}

function renderTable(offers: Offer[], title?: string, note?: string): string {
  const cols = ['#', 'Date', 'Route', 'Price', 'Dur', 'Stops', 'Carrier', 'Dep', 'Arr'] as const
  type Col = (typeof cols)[number]

  const rows: Record<Col, string>[] = offers.map((o, i) => ({
    '#': String(i + 1),
    Date: o.departure_date,
    Route:
      o.legs.length >= 2
        ? `${o.legs[0].departure_airport}→${o.legs.at(-1)?.arrival_airport}`
        : `${o.legs[0]?.departure_airport ?? '?'}→${o.legs[0]?.arrival_airport ?? '?'}`,
    Price: o.price,
    Dur: o.duration,
    Stops: stopsLabel(o.stops),
    Carrier: o.name,
    Dep: o.departure === '??:??' ? '—' : o.departure,
    Arr: `${o.arrival === '??:??' ? '—' : o.arrival}${o.arrival_time_ahead}`,
  }))

  const widths = cols.map((c) => Math.max(c.length, ...rows.map((r) => r[c].length)))
  const tableWidth = widths.reduce((a, b) => a + b, 0) + (cols.length - 1) * 2

  const lines: string[] = []

  if (title) {
    const label = ` ${title} `
    const pad = Math.max(0, tableWidth - label.length)
    lines.push(`──${label}${'─'.repeat(pad)}`)
  }

  lines.push(cols.map((c, i) => c.padEnd(widths[i])).join('  '))
  for (const row of rows) {
    lines.push(cols.map((c, i) => row[c].padEnd(widths[i])).join('  '))
  }

  const separator = '─'.repeat(tableWidth + 2)
  lines.push(separator)
  lines.push(...buildFooter(offers, note))

  return lines.join('\n')
}

function buildFooter(offers: Offer[], note?: string): string[] {
  const lines: string[] = []
  const parts = [`Total: ${formatTotal(offers)}`]

  const travelTime = totalTravelTime(offers)
  if (travelTime) parts.push(`door-to-door: ${travelTime}`)

  const layoverParts = offers
    .slice(0, -1)
    .map((o, i) => {
      const gap = connectionGapMin(o, offers[i + 1])
      if (gap == null) return null
      return `${o.legs.at(-1)?.arrival_airport ?? '?'} ${formatGap(gap)}`
    })
    .filter(Boolean)
  if (layoverParts.length) parts.push(`layovers: ${layoverParts.join(', ')}`)
  if (note) parts.push(note)

  lines.push(parts.join(' · '))

  for (const [i, o] of offers.entries()) {
    if (o.url) lines.push(`Leg ${i + 1}: ${o.url}`)
  }
  return lines
}

export const itineraryCommand = defineCommand({
  meta: { name: 'itinerary', description: 'Compose a multi-leg itinerary from cached offers' },
  args: {
    refs: {
      type: 'positional',
      description: 'Offer refs: REF:ID (e.g. IAO-MNL@20260324#A1B2C3:O1)',
      required: true,
    },
    title: { type: 'string', description: 'Itinerary title' },
    note: { type: 'string', description: 'Note to display below the table' },
  },
  async run({ args }) {
    const session = await loadSession()
    if (!session) {
      console.log(formatError('NO_SESSION', 'No search results cached. Run `flt search` first.'))
      return
    }

    // citty puts all positionals in args._ (first is also in args.refs)
    const rawArgs = (args as Record<string, unknown>)._ as string[] | undefined
    const refs = (rawArgs ?? [args.refs]).filter((r) => r && !r.startsWith('--'))

    const offers: Offer[] = []
    for (const ref of refs) {
      const offer = await resolveOffer(session, ref)
      if (!offer) {
        const available = listAvailableRefs(session)
        console.log(
          formatError('NOT_FOUND', `Offer '${ref}' not found. Available: ${available.join(', ')}`),
        )
        return
      }
      offers.push(offer)
    }

    console.log(renderTable(offers, args.title, args.note))

    const warnings = checkConnections(offers)
    if (warnings.length) console.log(`\n${warnings.join('\n')}`)
  },
})
