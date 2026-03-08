import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineCommand } from 'citty'
import { parsePrice } from '../filter'
import { formatError } from '../format'
import { loadSession, resolveOffer } from '../state'
import type { Offer, SearchEntry, SessionState } from '../types'

interface Itinerary {
  title: string
  note?: string
  legs: Offer[]
}

function stopsLabel(n: number): string {
  if (n === 0) return 'direct'
  return `${n} stop${n > 1 ? 's' : ''}`
}

function totalPrice(offers: Offer[]): string {
  const total = offers.reduce((sum, o) => sum + parsePrice(o.price), 0)
  const cur = (offers[0]?.price ?? '€0').replace(/[0-9.,\s]/g, '') || '€'
  return `${cur}${Math.round(total)}`
}

function legRoute(o: Offer): string {
  if (o.legs.length === 0) return '?→?'
  // Build chain: DEP→STOP1→STOP2→ARR using departure_airport codes (always IATA)
  const codes = [o.legs[0].departure_airport]
  for (const leg of o.legs) codes.push(leg.arrival_airport)
  // Dedupe consecutive (shouldn't happen but defensive)
  const unique = codes.filter((c, i) => i === 0 || c !== codes[i - 1])
  return unique.join('→')
}

function formatItinerary(itin: Itinerary): string {
  const lines: string[] = []
  lines.push(`### ${itin.title}`)
  lines.push('')
  lines.push('| # | Date | Route | Price | Duration | Stops | Carrier | Dep→Arr |')
  lines.push('|---|------|-------|------:|----------|-------|---------|---------|')
  for (const [i, o] of itin.legs.entries()) {
    const arr = `${o.arrival}${o.arrival_time_ahead}`
    lines.push(
      `| ${i + 1} | ${o.departure_date} | ${legRoute(o)} | ${o.price} | ${o.duration} | ${stopsLabel(o.stops)} | ${o.name} | ${o.departure}→${arr} |`,
    )
  }
  lines.push('')
  lines.push(`**Total: ${totalPrice(itin.legs)}**`)
  if (itin.note) lines.push(`\n> ${itin.note}`)

  // Booking URLs
  const urls = itin.legs.filter((o) => o.url)
  if (urls.length) {
    lines.push('')
    for (const [i, o] of urls.entries()) lines.push(`- [Book leg ${i + 1}](${o.url})`)
  }
  return lines.join('\n')
}

function formatSearchSection(tag: string, entry: SearchEntry): string {
  const lines: string[] = []
  lines.push(`### ${tag}`)
  lines.push('')
  lines.push(`> ${entry.query} · ${new Date(entry.timestamp).toLocaleString()}`)
  lines.push('')
  lines.push('| ID | Price | Stops | Duration | Carrier | Date | Dep→Arr |')
  lines.push('|----|------:|-------|----------|---------|------|---------|')
  for (const o of entry.offers.slice(0, 10)) {
    const arr = `${o.arrival}${o.arrival_time_ahead}`
    lines.push(
      `| ${o.id} | ${o.price} | ${stopsLabel(o.stops)} | ${o.duration} | ${o.name} | ${o.departure_date} | ${o.departure}→${arr} |`,
    )
  }
  if (entry.offers.length > 10) lines.push(`\n*…and ${entry.offers.length - 10} more results*`)
  return lines.join('\n')
}

function buildMarkdown(session: SessionState, itineraries: Itinerary[], title?: string): string {
  const sections: string[] = []
  const heading = title ?? 'Flight Search Results'
  const date = new Date().toISOString().slice(0, 10)

  sections.push(`# ${heading}`)
  sections.push(`*Generated ${date}*`)

  // Itineraries first (recommended options)
  if (itineraries.length > 0) {
    sections.push('\n## Recommended Options\n')
    for (const itin of itineraries) sections.push(formatItinerary(itin))
  }

  // All searches
  if (session.searches && Object.keys(session.searches).length > 0) {
    sections.push('\n## All Searches\n')
    for (const [tag, entry] of Object.entries(session.searches)) {
      sections.push(formatSearchSection(tag, entry))
      sections.push('')
    }
  }

  return sections.join('\n')
}

/** Parse one --itin block starting at index after --itin, returns next index */
function parseOneItin(raw: string[], start: number): { itin: Itinerary; next: number } {
  const title = raw[start] ?? 'Untitled'
  const refs: string[] = []
  let i = start + 1
  while (i < raw.length && !raw[i].startsWith('--')) refs.push(raw[i++])
  let note: string | undefined
  if (raw[i] === '--note') {
    note = raw[++i]
    i++
  }
  return { itin: { title, note, legs: refs as unknown as Offer[] }, next: i }
}

function parseItineraryArgs(raw: string[]): Itinerary[] {
  const itineraries: Itinerary[] = []
  let i = 0
  while (i < raw.length) {
    if (raw[i] !== '--itin') {
      i++
      continue
    }
    const { itin, next } = parseOneItin(raw, i + 1)
    itineraries.push(itin)
    i = next
  }
  return itineraries
}

export const takeoutCommand = defineCommand({
  meta: {
    name: 'takeout',
    description: 'Export all search results and itineraries to a markdown file',
  },
  args: {
    output: {
      type: 'string',
      alias: 'o',
      description: 'Output file path (default: ~/Desktop/flights-<date>.md)',
    },
    title: { type: 'string', description: 'Document title' },
  },
  async run({ args }) {
    const session = await loadSession()
    if (!session) {
      console.log(formatError('NO_SESSION', 'No search results cached. Run `flt search` first.'))
      return
    }

    // Parse --itin flags from raw argv (citty doesn't handle repeated flags well)
    const rawArgs = process.argv.slice(2)
    const itinDefs = parseItineraryArgs(rawArgs)

    // Resolve offer refs in itineraries
    const itineraries: Itinerary[] = []
    for (const def of itinDefs) {
      const legs: Offer[] = []
      for (const ref of def.legs as unknown as string[]) {
        const offer = resolveOffer(session, ref)
        if (!offer) {
          console.log(formatError('NOT_FOUND', `Offer '${ref}' not found in session.`))
          return
        }
        legs.push(offer)
      }
      itineraries.push({ title: def.title, note: def.note, legs })
    }

    const md = buildMarkdown(session, itineraries, args.title)
    const date = new Date().toISOString().slice(0, 10)
    const defaultPath = join(process.env.HOME ?? '.', 'Desktop', `flights-${date}.md`)
    const outPath = args.output ?? defaultPath

    await writeFile(outPath, md, 'utf-8')
    console.log(
      JSON.stringify({
        ok: true,
        path: outPath,
        searches: Object.keys(session.searches ?? {}).length,
        itineraries: itineraries.length,
      }),
    )
  },
})
