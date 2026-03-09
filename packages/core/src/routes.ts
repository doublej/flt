/**
 * Route graph — actual direct-flight connections between world airports.
 *
 * Loaded from route-graph.json (generated from OpenFlights + OurAirports data).
 * Contains 3,409 airports with 67,000+ direct routes.
 *
 * To regenerate: cd packages/core/src/data && bun run generate.ts
 */

import routeData from './data/route-graph.json'

export type RouteGraph = Map<string, Set<string>>

const _routeData = routeData as Record<string, string[]>

/** Build a bidirectional route graph from the route index */
export function buildRouteGraph(): RouteGraph {
  const graph: RouteGraph = new Map()

  const ensure = (code: string) => {
    if (!graph.has(code)) graph.set(code, new Set())
  }

  for (const [from, destinations] of Object.entries(_routeData)) {
    ensure(from)
    for (const to of destinations) {
      ensure(to)
      graph.get(from)!.add(to)
      graph.get(to)!.add(from)
    }
  }
  return graph
}

/** Get all airports in the route graph */
export function routeAirports(graph: RouteGraph): string[] {
  return [...graph.keys()].sort()
}

/** Get direct connections from a given airport */
export function directConnections(graph: RouteGraph, airport: string): string[] {
  return [...(graph.get(airport.toUpperCase()) ?? [])].sort()
}
