import { defineCommand } from 'citty'
import {
  checkConnections,
  connectionGapMin,
  formatGap,
  formatTotal,
  totalTravelTime,
} from '@flights/core'
import { formatError } from '../format'
import { listAvailableRefs, loadSession, resolveOffer } from '../state'
import type { Offer } from '../types'

function stopsLabel(n: number): string {
  if (n === 0) return 'direct'
  return `${n} stop${n > 1 ? 's' : ''}`
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
        const available = await listAvailableRefs(session)
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
