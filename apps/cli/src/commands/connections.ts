import { defineCommand } from 'citty'
import { findConnectionRoutes, mergeExclusions, summarizeRoute } from '@flights/core'

export const connectionsCommand = defineCommand({
  meta: { name: 'connections', description: 'Find multi-stop routes through real airline connections' },
  args: {
    from: { type: 'positional', description: 'Origin IATA code', required: true },
    to: { type: 'positional', description: 'Destination IATA code', required: true },
    'min-stops': { type: 'string', description: 'Minimum intermediate stops (default: 5)' },
    'max-stops': { type: 'string', description: 'Maximum intermediate stops (default: 10)' },
    'max-results': { type: 'string', description: 'Max results (default: 50)' },
    'max-detour': { type: 'string', description: 'Max detour ratio or "none" for unlimited (default: 3.0)' },
    via: { type: 'string', description: 'Required waypoints in order, comma-separated' },
    exclude: { type: 'string', description: 'Airports to exclude, comma-separated' },
    'exclude-region': {
      type: 'string',
      description: 'Exclude hub regions: gulf, russia, belarus (comma-separated, mixable with IATA codes)',
    },
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

    if (routes.length === 0) {
      console.log('No routes found.')
      return
    }

    for (const route of routes) {
      console.log(summarizeRoute(route))
    }
  },
})
