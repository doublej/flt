import { findConnectionRoutes, findBridgeHubs, resolveRegions, airportCity, isValidAirport } from '@flights/core'
import type { Terminal } from '../terminal'
import { M } from '../terminal'
import { contextHelp } from '../format/utils'
import type { AppState } from './shared'

export function handleConnections(argsStr: string, term: Terminal, _state: AppState) {
  const tokens = argsStr.trim().split(/\s+/)
  if (tokens.length < 2) {
    term.setStatus('USAGE: CN <FROM> <TO> [/V VIA] [/E EXCLUDE] [/ER REGION]')
    return
  }

  const from = tokens[0].toUpperCase()
  const to = tokens[1].toUpperCase()

  if (!isValidAirport(from)) { term.setStatus(`INVALID AIRPORT - ${from}`); return }
  if (!isValidAirport(to)) { term.setStatus(`INVALID AIRPORT - ${to}`); return }

  const via: string[] = []
  const exclude: string[] = []

  let i = 2
  while (i < tokens.length) {
    const opt = tokens[i].toUpperCase()
    if (opt === '/V' && i + 1 < tokens.length) {
      via.push(tokens[++i].toUpperCase())
    } else if (opt === '/E' && i + 1 < tokens.length) {
      exclude.push(tokens[++i].toUpperCase())
    } else if (opt === '/ER' && i + 1 < tokens.length) {
      exclude.push(...resolveRegions(tokens[++i]))
    }
    i++
  }

  const routes = findConnectionRoutes(from, to, {
    via: via.length ? via : undefined,
    exclude: exclude.length ? exclude : undefined,
    maxResults: 20,
  })

  if (!routes.length) {
    const bridges = findBridgeHubs(from, to)
    const lines = ['', `${M.G} ** NO ROUTES FOUND **  ${from} → ${to}${M.g}`, '']
    if (bridges.bridges.length) {
      lines.push(`  ${M.y}POSSIBLE BRIDGE HUBS:${M.g}`)
      for (const hub of bridges.bridges.slice(0, 10)) {
        const city = airportCity(hub)
        lines.push(`  ${M.G}${hub}${M.g}  ${city}`)
      }
    } else {
      lines.push(`  ${M.y}NO CONNECTION ROUTES AVAILABLE${M.g}`)
    }
    lines.push('')
    term.setContent(lines)
    term.setStatus('0 ROUTES')
    return
  }

  const lines = ['', `${M.G} ** CONNECTION ROUTES **  ${from} → ${to}${M.g}`, '']
  lines.push(`${M.d}   #  ROUTE                              STOPS      DISTANCE     DETOUR${M.g}`)
  lines.push(`${M.d}  ──  ─────────────────────────────────   ─────      ────────     ──────${M.g}`)

  for (let r = 0; r < routes.length; r++) {
    const route = routes[r]
    const ln = String(r + 1).padStart(3)
    const path = route.path.join(' → ').padEnd(35)
    const stops = `${route.stopCount} STOP${route.stopCount !== 1 ? 'S' : ''}`.padEnd(10)
    const dist = route.totalKm ? `${route.totalKm.toLocaleString()} km`.padEnd(12) : '---'.padEnd(12)
    const detour = route.detourRatio ? `${route.detourRatio}x` : '---'
    lines.push(`  ${M.G}${ln}${M.g}  ${path}  ${stops}  ${dist}  ${detour}`)
  }

  lines.push('')
  lines.push(...contextHelp('connections', { FROM: from, TO: to }))
  term.setContent(lines)
  term.setStatus(`${routes.length} ROUTE${routes.length !== 1 ? 'S' : ''} FOUND`)
}
