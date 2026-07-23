import {
  airportCity,
  findBridgeHubs,
  findConnectionRoutes,
  mergeExclusions,
  searchAirports,
  summarizeRoute,
} from '@flights/core'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { assertAirport, guard } from '../shared'

function labelCode(code: string): string {
  const city = airportCity(code)
  return city ? `${code} (${city})` : code
}

export function registerAirports(server: McpServer): void {
  server.registerTool(
    'airports',
    {
      title: 'Search airports',
      description: 'Search airports by name, city, or IATA code. Returns structured airport records.',
      inputSchema: {
        query: z.string().describe('City, airport name, or IATA code'),
        limit: z.number().int().min(1).max(100).default(20).describe('Max results'),
      },
    },
    guard(async (a) => {
      const results = searchAirports(a.query).slice(0, a.limit)
      if (results.length === 0) {
        return { airports: [], hint: `No airports matching '${a.query}'.` }
      }
      return { airports: results }
    }),
  )
}

export function registerConnections(server: McpServer): void {
  server.registerTool(
    'connections',
    {
      title: 'Find connection routes',
      description:
        'Find multi-stop routes through real airline connections (route-graph pathfinder). ' +
        'Falls back to bridge-hub suggestions when no route matches.',
      inputSchema: {
        from: z.string().describe('Origin IATA code'),
        to: z.string().describe('Destination IATA code'),
        minStops: z.number().int().min(0).optional().describe('Minimum intermediate stops'),
        maxStops: z.number().int().min(0).optional().describe('Maximum intermediate stops (default 10)'),
        maxResults: z.number().int().min(1).max(200).optional().describe('Max results (default 50)'),
        maxDetour: z
          .number()
          .nullable()
          .optional()
          .describe('Max detour ratio vs direct distance (default 3.0); null = unlimited'),
        via: z.array(z.string()).optional().describe('Required waypoints in order (IATA codes)'),
        exclude: z.array(z.string()).optional().describe('Airports to exclude (IATA codes)'),
        excludeRegion: z
          .string()
          .optional()
          .describe('Exclude hub regions: gulf, middleeast, russia, belarus (comma-separated)'),
        names: z.boolean().default(false).describe('Include city names alongside IATA codes'),
      },
    },
    guard(async (a) => {
      const from = assertAirport(a.from, 'Origin')
      const to = assertAirport(a.to, 'Destination')
      const excludeCodes = mergeExclusions(a.exclude?.join(','), a.excludeRegion)
      const routes = findConnectionRoutes(from, to, {
        minStops: a.minStops,
        maxStops: a.maxStops,
        maxResults: a.maxResults,
        maxDetour: a.maxDetour === null ? null : a.maxDetour,
        via: a.via,
        exclude: excludeCodes?.split(','),
      })

      const label = a.names ? labelCode : (c: string) => c

      if (routes.length === 0) {
        const { fromReach, toReach, bridges } = findBridgeHubs(from, to, 2, {
          exclude: excludeCodes?.split(','),
        })
        return {
          routes: [],
          hint: bridges.length
            ? `No routes found. Bridge hubs reachable from both within 2 hops: ${bridges.slice(0, 15).map(label).join(', ')}. Try via: ['${bridges[0]}'].`
            : 'No routes found and no bridge hubs within 2 hops.',
          bridges: bridges.slice(0, 15),
          fromConnects: fromReach.slice(0, 10),
          toConnects: toReach.slice(0, 10),
        }
      }

      return {
        routes: routes.map((r) => ({
          path: a.names ? r.path.map(labelCode) : r.path,
          stops: r.stopCount,
          totalKm: r.totalKm,
          detourRatio: r.detourRatio,
          summary: summarizeRoute(r),
        })),
      }
    }),
  )
}
