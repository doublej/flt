import {
  type Offer,
  checkConnections,
  connectionGapMin,
  formatGap,
  formatTotal,
  listAvailableRefs,
  loadSession,
  resolveOffer,
  totalTravelTime,
} from '@flights/core'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { ToolError, guard } from '../shared'

export function registerInspect(server: McpServer): void {
  server.registerTool(
    'inspect',
    {
      title: 'Inspect an offer',
      description:
        'Show full details of a flight offer by ID (legs, layovers, booking URL). IDs come from ' +
        'search/compare results; use REF:ID for offers outside the latest search. Shared with the flt CLI.',
      inputSchema: {
        id: z.string().describe('Offer ID (e.g. Fa3b7 or REF:Fa3b7)'),
      },
    },
    guard(async (a) => {
      const session = await loadSession()
      if (!session) {
        throw new ToolError('NO_SESSION', 'No search results cached. Run the search tool first.')
      }
      const offer = await resolveOffer(session, a.id)
      if (!offer) {
        const latestIds = (session.latest?.offers ?? []).map((o) => o.id)
        if (latestIds.length) {
          throw new ToolError(
            'NOT_FOUND',
            `Offer '${a.id}' not found. Available in latest search: ${latestIds.join(', ')}`,
          )
        }
        const refs = Object.keys(session.searches).slice(-10)
        throw new ToolError(
          'NOT_FOUND',
          `Offer '${a.id}' not found. No latest search. Use REF:ID format. Recent refs: ${refs.join(', ')}`,
        )
      }
      return offer
    }),
  )
}

export function registerItinerary(server: McpServer): void {
  server.registerTool(
    'itinerary',
    {
      title: 'Compose an itinerary',
      description:
        'Compose a multi-leg itinerary from cached offers (REF:ID each). Returns totals, ' +
        'layover gaps, and connection warnings (tight/long/overnight).',
      inputSchema: {
        refs: z
          .array(z.string())
          .min(1)
          .describe('Offer refs in travel order, e.g. ["IAO-MNL@20260324#A1B2C3:O1", ...]'),
        title: z.string().optional().describe('Itinerary title'),
        note: z.string().optional().describe('Free-form note'),
      },
    },
    guard(async (a) => {
      const session = await loadSession()
      if (!session) {
        throw new ToolError('NO_SESSION', 'No search results cached. Run the search tool first.')
      }

      const offers: Offer[] = []
      for (const ref of a.refs) {
        const offer = await resolveOffer(session, ref)
        if (!offer) {
          const available = await listAvailableRefs(session)
          throw new ToolError(
            'NOT_FOUND',
            `Offer '${ref}' not found. Available: ${available.join(', ')}`,
          )
        }
        offers.push(offer)
      }

      const layovers = offers
        .slice(0, -1)
        .map((o, i) => {
          const gap = connectionGapMin(o, offers[i + 1])
          if (gap == null) return null
          return {
            airport: o.legs.at(-1)?.arrival_airport ?? '?',
            gap: formatGap(gap),
            minutes: gap,
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)

      return {
        ...(a.title ? { title: a.title } : {}),
        legs: offers,
        total: formatTotal(offers),
        doorToDoor: totalTravelTime(offers),
        layovers,
        warnings: checkConnections(offers),
        bookingUrls: offers.map((o) => o.url).filter(Boolean),
        ...(a.note ? { note: a.note } : {}),
      }
    }),
  )
}
