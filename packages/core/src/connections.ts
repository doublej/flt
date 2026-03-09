/**
 * Connection map — find all possible multi-stop routes through a real route graph.
 *
 * Given origin, destination, and optional waypoints, discovers every path
 * that uses actual airline connections. Designed as a preparation/planning step
 * before searching — maps out what's possible from simple 1-stop to complex 10+ stop routes.
 */

import { type RouteGraph, buildRouteGraph } from './routes'
import { AIRPORT_COORDS, haversineKm } from './coords'

export interface ConnectionRoute {
  /** Full path: [origin, ...stops..., destination] */
  path: string[]
  /** Number of intermediate stops */
  stopCount: number
  /** Total route distance in km (null if coords unavailable) */
  totalKm: number | null
  /** Direct distance origin→destination in km */
  directKm: number | null
  /** Detour ratio: totalKm / directKm */
  detourRatio: number | null
}

export interface ConnectionMapOptions {
  /** Minimum intermediate stops (default: 0) */
  minStops?: number
  /** Maximum intermediate stops (default: 10) */
  maxStops?: number
  /** Max results to return (default: 50) */
  maxResults?: number
  /** Max detour as multiple of direct distance — null = unlimited (default: 3.0) */
  maxDetour?: number | null
  /** Required waypoints the route must pass through, in order */
  via?: string[]
  /** Airports to exclude from routes (IATA codes) */
  exclude?: string[]
  /** Pre-built route graph (built automatically if omitted) */
  graph?: RouteGraph
}

let _cachedGraph: RouteGraph | null = null

function getGraph(opts: ConnectionMapOptions): RouteGraph {
  if (opts.graph) return opts.graph
  _cachedGraph ??= buildRouteGraph()
  return _cachedGraph
}

/** Memoized distance lookup keyed by "AAA-BBB" */
function createDistanceCache(): (a: string, b: string) => number | null {
  const cache = new Map<string, number | null>()
  return (a, b) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`
    if (cache.has(key)) return cache.get(key)!
    const ca = AIRPORT_COORDS[a]
    const cb = AIRPORT_COORDS[b]
    const km = ca && cb ? haversineKm(ca, cb) : null
    cache.set(key, km)
    return km
  }
}

const compareRoutes = (a: ConnectionRoute, b: ConnectionRoute) =>
  (a.detourRatio ?? 999) - (b.detourRatio ?? 999) || a.stopCount - b.stopCount

/**
 * Find all multi-stop routes between two airports using real connections.
 *
 * With `via` waypoints, the problem splits into segments (A→via1, via1→via2, ...→B)
 * and finds paths for each segment, then combines them.
 */
export function findConnectionRoutes(
  from: string,
  to: string,
  options: ConnectionMapOptions = {},
): ConnectionRoute[] {
  const graph = getGraph(options)
  from = from.toUpperCase()
  to = to.toUpperCase()

  if (!graph.has(from) || !graph.has(to) || from === to) return []

  const { via, maxResults = 50, exclude } = options
  const excluded = new Set(exclude?.map((e) => e.toUpperCase()))

  if (via?.length) {
    return findRoutesViaWaypoints(from, to, via.map((w) => w.toUpperCase()), graph, options, excluded)
  }

  const { minStops = 0, maxStops = 10, maxDetour = 3.0 } = options
  const dist = createDistanceCache()
  const directKm = dist(from, to)
  const maxTotalKm = maxDetour && directKm ? directKm * maxDetour : null

  // Precompute distance-to-destination for all airports (used for neighbor sorting + pruning)
  const goalDist = new Map<string, number>()
  for (const code of graph.keys()) {
    const d = dist(code, to)
    if (d != null) goalDist.set(code, d)
  }

  const results = findPaths(graph, from, to, minStops, maxStops, maxTotalKm, goalDist, dist, maxResults * 10, excluded)

  return results
    .map((path) => buildRoute(path, directKm, dist))
    .sort(compareRoutes)
    .slice(0, maxResults)
}

/** Core DFS pathfinder — shared by direct search and segment search */
function findPaths(
  graph: RouteGraph,
  from: string,
  to: string,
  minDepth: number,
  maxDepth: number,
  maxTotalKm: number | null,
  goalDist: Map<string, number>,
  dist: (a: string, b: string) => number | null,
  limit: number,
  excluded?: Set<string>,
): string[][] {
  const results: string[][] = []
  const visited = new Set<string>([from])
  const path: string[] = [from]

  function dfs(current: string, depth: number, totalKm: number): void {
    if (results.length >= limit) return

    const neighbors = graph.get(current)
    if (!neighbors) return

    // Can we finish? (depth = intermediate stops so far)
    if (depth >= minDepth && depth <= maxDepth && neighbors.has(to)) {
      const lastLeg = dist(current, to) ?? 0
      if (!maxTotalKm || totalKm + lastLeg <= maxTotalKm) {
        results.push([...path, to])
      }
    }
    if (depth >= maxDepth) return

    // Prune: remaining distance exceeds detour budget
    const remainKm = goalDist.get(current) ?? 0
    if (maxTotalKm && totalKm + remainKm > maxTotalKm * 1.2) return

    // Explore neighbors sorted by distance to destination (closest first)
    const candidates: Array<{ code: string; toGoal: number }> = []
    for (const next of neighbors) {
      if (next === to || visited.has(next) || excluded?.has(next)) continue
      candidates.push({ code: next, toGoal: goalDist.get(next) ?? Infinity })
    }
    candidates.sort((a, b) => a.toGoal - b.toGoal)

    for (const { code } of candidates) {
      const legKm = dist(current, code) ?? 0
      visited.add(code)
      path.push(code)
      dfs(code, depth + 1, totalKm + legKm)
      path.pop()
      visited.delete(code)
    }
  }

  dfs(from, 0, 0)
  return results
}

function findRoutesViaWaypoints(
  from: string,
  to: string,
  waypoints: string[],
  graph: RouteGraph,
  options: ConnectionMapOptions,
  excluded: Set<string>,
): ConnectionRoute[] {
  const { maxResults = 50 } = options
  const dist = createDistanceCache()
  const directKm = dist(from, to)

  // Build segment list: [from, ...waypoints, to]
  const checkpoints = [from, ...waypoints, to]
  const segLimit = 30 // keep segments small to avoid cartesian explosion

  const segmentPaths: string[][][] = []
  for (let i = 0; i < checkpoints.length - 1; i++) {
    const segFrom = checkpoints[i]
    const segTo = checkpoints[i + 1]

    // Precompute goal distances for this segment
    const goalDist = new Map<string, number>()
    for (const code of graph.keys()) {
      const d = dist(code, segTo)
      if (d != null) goalDist.set(code, d)
    }

    const paths = findPaths(graph, segFrom, segTo, 0, 4, null, goalDist, dist, segLimit, excluded)
    if (paths.length === 0) return [] // no route for this segment
    segmentPaths.push(paths)
  }

  const combined = combineSegments(segmentPaths, maxResults * 5)
  return combined
    .map((path) => buildRoute(path, directKm, dist))
    .sort(compareRoutes)
    .slice(0, maxResults)
}

/** Combine segment paths into full routes, deduplicating shared waypoints */
function combineSegments(segments: string[][][], limit: number): string[][] {
  let current = segments[0]

  for (let i = 1; i < segments.length; i++) {
    const next: string[][] = []
    for (const left of current) {
      if (next.length >= limit) break
      const leftSet = new Set(left)
      for (const right of segments[i]) {
        if (next.length >= limit) break
        // Check new airports from right don't collide with left (skip shared waypoint)
        if (right.slice(1).some((code) => leftSet.has(code))) continue
        next.push([...left, ...right.slice(1)])
      }
    }
    current = next
  }
  return current
}

function buildRoute(
  path: string[],
  directKm: number | null,
  dist: (a: string, b: string) => number | null,
): ConnectionRoute {
  let totalKm: number | null = 0
  for (let i = 0; i < path.length - 1; i++) {
    const leg = dist(path[i], path[i + 1])
    if (leg == null) { totalKm = null; break }
    totalKm += leg
  }
  totalKm = totalKm != null ? Math.round(totalKm) : null
  const detour = totalKm && directKm ? Math.round((totalKm / directKm) * 100) / 100 : null
  return {
    path,
    stopCount: path.length - 2,
    totalKm,
    directKm: directKm ? Math.round(directKm) : null,
    detourRatio: detour,
  }
}

/** Find airports reachable from origin within maxDepth hops, intersected with airports that can reach dest. */
export function findBridgeHubs(
  from: string,
  to: string,
  maxDepth = 2,
  options: ConnectionMapOptions = {},
): { fromReach: string[]; toReach: string[]; bridges: string[] } {
  const graph = getGraph(options)
  from = from.toUpperCase()
  to = to.toUpperCase()

  const bfs = (start: string, depth: number): Set<string> => {
    const visited = new Set<string>([start])
    let frontier = [start]
    for (let d = 0; d < depth; d++) {
      const next: string[] = []
      for (const node of frontier) {
        for (const neighbor of graph.get(node) ?? []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            next.push(neighbor)
          }
        }
      }
      frontier = next
    }
    visited.delete(start)
    return visited
  }

  const fromSet = bfs(from, maxDepth)
  const toSet = bfs(to, maxDepth)
  const bridges = [...fromSet].filter((code) => toSet.has(code)).sort()

  return {
    fromReach: [...graph.get(from) ?? []].sort(),
    toReach: [...graph.get(to) ?? []].sort(),
    bridges,
  }
}

/** Format a route as a readable string: AMS → IST → DEL → BKK → SIN → SYD */
export function formatRoute(route: ConnectionRoute): string {
  return route.path.join(' → ')
}

/** One-line summary of a route */
export function summarizeRoute(route: ConnectionRoute): string {
  const meta: string[] = [`${route.stopCount} stops`]
  if (route.totalKm) meta.push(`${route.totalKm.toLocaleString()} km`)
  if (route.detourRatio) meta.push(`${route.detourRatio}x direct`)
  return `${formatRoute(route)} (${meta.join(', ')})`
}
