/**
 * Shared glue for MCP tools. All domain logic lives in @flights/core;
 * validation is shared with the CLI via @flights/cli/validate. This module
 * only adapts them to MCP semantics (errors as payloads, not process.exit).
 */
import {
  type Offer,
  type SearchQuery,
  type SessionState,
  createEmptySession,
  isValidAirport,
  loadCachedSearch,
  loadSession,
  rememberSearch,
  saveCachedSearch,
  searchSingle,
  throttle,
} from '@flights/core'
import { tryNormalizeDate } from '@flights/cli/validate'

/** Tool-level failure. Caught at the tool boundary and returned as {err, hint}. */
export class ToolError extends Error {
  constructor(
    public code: string,
    public hint: string,
    public url?: string,
  ) {
    super(`${code}: ${hint}`)
  }
}

export function assertAirport(code: string, label: string): string {
  const iata = code.trim().toUpperCase()
  if (!isValidAirport(iata)) {
    throw new ToolError('BAD_AIRPORT', `${label} '${code}' is not a known IATA code.`)
  }
  return iata
}

export function assertDate(d: string, label: string): string {
  const res = tryNormalizeDate(d)
  if (!('err' in res)) return res.iso
  if (res.err === 'BAD_DATE') {
    throw new ToolError(
      'BAD_DATE',
      `${label} '${d}' is not a valid date. Use YYYY-MM-DD, DD/MM/YYYY, or 'tomorrow'.`,
    )
  }
  throw new ToolError('PAST_DATE', `${label} ${res.iso} is in the past (today: ${res.today}).`)
}

/** Scrape-failure hints, mirroring apps/cli/src/commands/search.ts. */
export const SCRAPE_HINTS: Record<string, string> = {
  http: 'Google returned an HTTP error (likely rate-limited). Try again in a few minutes.',
  no_script: 'Google served a consent/CAPTCHA page. Try again later or from a different IP.',
  no_data: 'Page loaded but flight data was missing. Google may have changed the page structure.',
  no_flights: 'No flights found for this route/date. Try different dates or fewer stops.',
}

export async function withSession(): Promise<SessionState> {
  return (await loadSession()) ?? createEmptySession()
}

export interface FetchResult {
  offers: Offer[]
  ref: string
  url: string
  err?: string
}

/** Cache → throttle → live fetch → cache, recording into the shared session. */
export async function fetchAndCache(
  dep: string,
  ret: string | null,
  query: SearchQuery,
  session: SessionState,
  refresh = false,
): Promise<FetchResult> {
  const cached = refresh ? null : await loadCachedSearch(query, dep, ret)
  if (cached) {
    rememberSearch(session, cached)
    return { offers: cached.offers, ref: cached.ref, url: cached.offers[0]?.url ?? '' }
  }

  await throttle()
  const res = await searchSingle(dep, ret, query)
  if (!res.flights.length) {
    return { offers: [], ref: '', url: res.url, err: res.error ?? 'no_flights' }
  }
  const entry = await saveCachedSearch(
    query,
    dep,
    ret,
    res.flights.map((f) => ({ ...f, url: res.url })),
  )
  rememberSearch(session, entry)
  return { offers: entry.offers, ref: entry.ref, url: res.url, err: res.error }
}

/** Compact offer view: everything an agent needs to pick, without leg detail. */
export function summarizeOffer(o: Offer) {
  return {
    id: o.id,
    price: o.price,
    carrier: o.name,
    stops: o.stops,
    via: o.layovers?.map((l) => l.airport) ?? [],
    duration: o.duration,
    departure_date: o.departure_date,
    ...(o.return_date ? { return_date: o.return_date } : {}),
    departure: o.departure,
    arrival: `${o.arrival}${o.arrival_time_ahead ?? ''}`,
    is_best: o.is_best,
    url: o.url,
  }
}

interface ToolResult {
  [x: string]: unknown
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
}

export function jsonResult(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 1) }] }
}

export function errResult(e: unknown): ToolResult {
  const body =
    e instanceof ToolError
      ? { err: e.code, hint: e.hint, ...(e.url ? { url: e.url } : {}) }
      : { err: 'INTERNAL', hint: e instanceof Error ? e.message : String(e) }
  return { isError: true, content: [{ type: 'text', text: JSON.stringify(body) }] }
}

/** Wrap a tool handler: ToolError and unexpected throws become {err, hint} results. */
export function guard<A>(fn: (args: A) => Promise<unknown>): (args: A) => Promise<ToolResult> {
  return async (args: A) => {
    try {
      const data = await fn(args)
      return jsonResult(data)
    } catch (e) {
      return errResult(e)
    }
  }
}
