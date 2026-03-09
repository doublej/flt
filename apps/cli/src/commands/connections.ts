import { defineCommand } from 'citty'
import { airportCity, findBridgeHubs, findConnectionRoutes, mergeExclusions, summarizeRoute } from '@flights/core'
import type { ConnectionRoute } from '@flights/core'

function labelCode(code: string): string {
  const city = airportCity(code)
  return city ? `${code} (${city})` : code
}

function summarizeWithNames(route: ConnectionRoute): string {
  const path = route.path.map(labelCode).join(' → ')
  const meta: string[] = [`${route.stopCount} stops`]
  if (route.totalKm) meta.push(`${route.totalKm.toLocaleString()} km`)
  if (route.detourRatio) meta.push(`${route.detourRatio}x direct`)
  return `${path} (${meta.join(', ')})`
}

export const connectionsCommand = defineCommand({
  meta: { name: 'connections', description: 'Find multi-stop routes through real airline connections' },
  args: {
    from: { type: 'positional', description: 'Origin IATA code', required: true },
    to: { type: 'positional', description: 'Destination IATA code', required: true },
    'min-stops': { type: 'string', description: 'Minimum intermediate stops (default: 0)' },
    'max-stops': { type: 'string', description: 'Maximum intermediate stops (default: 10)' },
    'max-results': { type: 'string', description: 'Max results (default: 50)' },
    'max-detour': { type: 'string', description: 'Max detour ratio or "none" for unlimited (default: 3.0)' },
    via: { type: 'string', description: 'Required waypoints in order, comma-separated' },
    exclude: { type: 'string', description: 'Airports to exclude, comma-separated' },
    'exclude-region': {
      type: 'string',
      description: 'Exclude hub regions: gulf, middleeast, russia, belarus (comma-separated, mixable with IATA codes)',
    },
    names: { type: 'boolean', description: 'Show city names alongside IATA codes', default: false },
  },
  async run({ args }) {
    const excludeCodes = mergeExclusions(args.exclude, args['exclude-region'])
    const routes = findConnectionRoutes(args.from, args.to, {
      minStops: args['min-stops'] ? Number(args['min-stops']) : undefined,
      maxStops: args['max-stops'] ? Number(args['max-stops']) : undefined,
      maxResults: args['max-results'] ? Number(args['max-results']) : undefined,
      maxDetour: args['max-detour'] === 'none' ? null : args['max-detour'] ? Number(args['max-detour']) : undefined,
      via: args.via?.split(',').map((s) => s.trim()),
      exclude: excludeCodes?.split(','),
    })

    const fmt = args.names ? summarizeWithNames : summarizeRoute

    if (routes.length === 0) {
      const { fromReach, toReach, bridges } = findBridgeHubs(args.from, args.to, 2, {
        exclude: excludeCodes?.split(','),
      })
      console.log('No routes found.')
      const label = args.names ? labelCode : (c: string) => c
      if (bridges.length) {
        console.log(`\nBridge hubs (reachable from both within 2 hops): ${bridges.slice(0, 15).map(label).join(', ')}`)
        console.log(`Tip: try --via ${bridges[0]}`)
      } else {
        if (fromReach.length) console.log(`\n${label(args.from.toUpperCase())} connects to: ${fromReach.slice(0, 10).map(label).join(', ')}`)
        if (toReach.length) console.log(`${label(args.to.toUpperCase())} connects to: ${toReach.slice(0, 10).map(label).join(', ')}`)
      }
      return
    }

    for (const route of routes) {
      console.log(fmt(route))
    }
  },
})
