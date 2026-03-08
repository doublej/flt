import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineCommand } from 'citty'
import { parsePrice } from '../filter'
import { formatError } from '../format'
import { loadSession, loadSessionSearches, resolveOffer } from '../state'
import type { Offer, SearchEntry } from '../types'

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
  const codes = [o.legs[0].departure_airport]
  for (const leg of o.legs) codes.push(leg.arrival_airport)
  const unique = codes.filter((c, i) => i === 0 || c !== codes[i - 1])
  return unique.join('→')
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  return h ? `${h}h` : `${m}m`
}

function formatBooking(idx: number, o: Offer): string {
  const lines: string[] = []
  const arr = `${o.arrival}${o.arrival_time_ahead}`
  lines.push(
    `**Booking ${idx}** · ${o.departure_date} · ${legRoute(o)} · ${o.price} · ${o.duration} · ${stopsLabel(o.stops)} · ${o.name} · ${o.departure}→${arr}`,
  )
  if (o.legs.length > 1 || o.layovers.length > 0) {
    lines.push('')
    lines.push('| Flight | Route | Dep | Arr | Duration | Aircraft |')
    lines.push('|--------|-------|-----|-----|----------|----------|')
    for (const [j, leg] of o.legs.entries()) {
      const flt = leg.flight_number ? `${leg.airline} ${leg.flight_number}` : leg.airline_name
      lines.push(
        `| ${flt} | ${leg.departure_airport}→${leg.arrival_airport} | ${leg.departure_time} | ${leg.arrival_time} | ${formatMinutes(leg.duration)} | ${leg.aircraft || '—'} |`,
      )
      if (j < o.layovers.length) {
        const lo = o.layovers[j]
        lines.push(`| | *${lo.airport} layover* | | | *${formatMinutes(lo.duration)}* | |`)
      }
    }
  }
  return lines.join('\n')
}

function formatItinerary(itin: Itinerary): string {
  const lines: string[] = []
  lines.push(`### ${itin.title}`)
  lines.push('')
  for (const [i, o] of itin.legs.entries()) {
    lines.push(formatBooking(i + 1, o))
    lines.push('')
  }
  lines.push(`**Total: ${totalPrice(itin.legs)}**`)
  if (itin.note) lines.push(`\n> ${itin.note}`)

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

function buildMarkdown(
  searches: Array<[string, SearchEntry]>,
  itineraries: Itinerary[],
  title?: string,
): string {
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
  if (searches.length > 0) {
    sections.push('\n## All Searches\n')
    for (const [tag, entry] of searches) {
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
        const offer = await resolveOffer(session, ref)
        if (!offer) {
          console.log(formatError('NOT_FOUND', `Offer '${ref}' not found in session.`))
          return
        }
        legs.push(offer)
      }
      itineraries.push({ title: def.title, note: def.note, legs })
    }

    const searches = await loadSessionSearches(session)
    const md = buildMarkdown(searches, itineraries, args.title)
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const time = now.toTimeString().slice(0, 5).replace(':', '')
    const defaultPath = join(process.env.HOME ?? '.', 'Desktop', `flights-${date}-${time}.md`)
    const outPath = args.output ?? defaultPath

    await writeFile(outPath, md, 'utf-8')
    console.log(
      JSON.stringify({
        ok: true,
        path: outPath,
        searches: searches.length,
        itineraries: itineraries.length,
      }),
    )
  },
})
