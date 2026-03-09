import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineCommand } from 'citty'
import { type AffiliateConfig, type Itinerary, buildMarkdown } from '@flights/core'
import { loadConfig } from '../config'
import { formatError } from '../format'
import {
  closeActiveSession,
  getActiveSession,
  loadSearchByRef,
  loadSession,
  loadSessionScopedSearches,
  resolveOffer,
  saveSession,
} from '../state'
import type { Offer } from '../types'

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
    'keep-session': {
      type: 'boolean',
      description: 'Keep session open after export (default: closes it)',
      default: false,
    },
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
      // Derive booking filters from the first ref's search entry
      const firstRef = (def.legs as unknown as string[])[0]
      const searchRef = firstRef?.includes(':') ? firstRef.split(':')[0] : undefined
      const refEntry = searchRef ? await loadSearchByRef(session, searchRef) : null
      itineraries.push({ title: def.title, note: def.note, legs, filters: refEntry?.params })
    }

    const searches = await loadSessionScopedSearches(session)
    const config = await loadConfig()
    const affiliate: AffiliateConfig | null =
      config.marker && config.trs ? { marker: config.marker, trs: config.trs } : null
    const md = buildMarkdown(searches, itineraries, { affiliate, title: args.title })
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const time = now.toTimeString().slice(0, 5).replace(':', '')
    const defaultPath = join(process.env.HOME ?? '.', 'Desktop', `flights-${date}-${time}.md`)
    const outPath = args.output ?? defaultPath

    await writeFile(outPath, md, 'utf-8')

    const active = getActiveSession(session)
    if (active && !args['keep-session']) {
      closeActiveSession(session)
      await saveSession(session)
      console.error(
        `[session] Closed "${active.name}" (${active.id}) after takeout. Use \`--keep-session\` to keep it open, or \`flt session start\` to begin a new one.`,
      )
    }

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
