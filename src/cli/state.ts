import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { SearchQuery } from '$lib/server/flights/search'
import type { CacheQuery, Offer, SearchEntry, SessionSearch, SessionState } from './types'

const SESSION_VERSION = 2
export const CACHE_TTL_MS = 6 * 60 * 60 * 1000

const SESSION_DIR = join(process.env.TMPDIR ?? '/tmp', 'flt')
const SESSION_FILE = join(SESSION_DIR, 'session.json')
const CACHE_DIR = join(SESSION_DIR, 'cache')

interface LegacySearchEntry {
  offers: Offer[]
  query: string
  timestamp: number
}

interface LegacySessionState {
  offers?: Offer[]
  query?: string
  timestamp?: number
  searches?: Record<string, LegacySearchEntry>
}

interface CacheFile extends SearchEntry {
  version: number
}

function paxLabel(q: {
  adults: number
  children: number
  infants_in_seat: number
  infants_on_lap: number
}): string {
  const parts: string[] = []
  if (q.adults) parts.push(`${q.adults}ad`)
  if (q.children) parts.push(`${q.children}ch`)
  if (q.infants_in_seat) parts.push(`${q.infants_in_seat}ins`)
  if (q.infants_on_lap) parts.push(`${q.infants_on_lap}lap`)
  return parts.join('') || '0pax'
}

function dateSpan(start: string, end?: string): string {
  return end && end !== start ? `${start}..${end}` : start
}

function stopsLabel(maxStops: number | null): string | null {
  if (maxStops == null) return null
  if (maxStops === 0) return 'direct'
  return `max ${maxStops} stop${maxStops === 1 ? '' : 's'}`
}

function cacheFilePath(cacheKey: string): string {
  return join(CACHE_DIR, `${cacheKey}.json`)
}

async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  const temp = `${path}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temp, JSON.stringify(value, null, 2), 'utf-8')
  await rename(temp, path)
}

async function loadCacheFile(cacheKey: string): Promise<CacheFile | null> {
  try {
    const raw = await readFile(cacheFilePath(cacheKey), 'utf-8')
    const parsed = JSON.parse(raw) as CacheFile
    return parsed.version === SESSION_VERSION ? parsed : null
  } catch {
    return null
  }
}

async function normalizeSearches(
  searches: Record<string, SessionSearch>,
): Promise<Record<string, SessionSearch>> {
  const entries = await Promise.all(
    Object.entries(searches).map(async ([ref, search]) => {
      if (!search.cacheKey) return [ref, search] as const
      const entry = await loadCacheFile(search.cacheKey)
      if (!entry) return null
      return [
        ref,
        {
          ...search,
          offerCount: entry.offers.length,
          query: entry.query,
          timestamp: entry.timestamp,
        },
      ] as const
    }),
  )
  return Object.fromEntries(
    entries.filter((entry): entry is [string, SessionSearch] => entry !== null),
  )
}

function migrateLegacySession(legacy: LegacySessionState): SessionState {
  const latestOffers = Array.isArray(legacy.offers) ? legacy.offers : []
  const latest =
    latestOffers.length > 0 || legacy.query || legacy.timestamp
      ? {
          offers: latestOffers,
          query: legacy.query ?? '',
          timestamp: legacy.timestamp ?? Date.now(),
          refs: Object.keys(legacy.searches ?? {}),
        }
      : null

  const searches = Object.fromEntries(
    Object.entries(legacy.searches ?? {}).map(([ref, entry]) => [
      ref,
      {
        query: entry.query,
        timestamp: entry.timestamp,
        offerCount: entry.offers.length,
        offers: entry.offers,
      },
    ]),
  )

  return { version: SESSION_VERSION, latest, searches }
}

export function createEmptySession(): SessionState {
  return {
    version: SESSION_VERSION,
    latest: null,
    searches: {},
  }
}

export function buildCacheQuery(
  q: SearchQuery,
  depDate: string,
  retDate: string | null,
): CacheQuery {
  return {
    from_airport: q.from_airport.toUpperCase(),
    to_airport: q.to_airport.toUpperCase(),
    departure_date: depDate,
    return_date: retDate,
    adults: q.adults,
    children: q.children,
    infants_in_seat: q.infants_in_seat,
    infants_on_lap: q.infants_on_lap,
    seat: q.seat,
    max_stops: q.max_stops ?? null,
    currency: q.currency.toUpperCase(),
  }
}

export function buildCacheKey(params: CacheQuery): string {
  return createHash('sha1').update(JSON.stringify(params)).digest('hex')
}

export function buildSearchRef(params: CacheQuery): string {
  const dep = params.departure_date.replaceAll('-', '')
  const ret = params.return_date ? `_${params.return_date.replaceAll('-', '')}` : ''
  const suffix = buildCacheKey(params).slice(0, 6).toUpperCase()
  return `${params.from_airport}-${params.to_airport}@${dep}${ret}#${suffix}`
}

function buildConcreteQuery(params: CacheQuery): string {
  const parts = [`${params.from_airport} ${params.to_airport} ${params.departure_date}`]
  if (params.return_date) parts.push(`return ${params.return_date}`)
  parts.push(params.seat, paxLabel(params), params.currency)
  const stops = stopsLabel(params.max_stops)
  if (stops) parts.push(stops)
  return parts.join(' · ')
}

export function describeSearchRequest(q: SearchQuery): string {
  const parts = [`${q.from_airport} ${q.to_airport} ${dateSpan(q.date, q.date_end)}`]
  if (q.return_date) parts.push(`return ${dateSpan(q.return_date, q.return_date_end)}`)
  parts.push(q.seat, paxLabel(q), q.currency.toUpperCase())
  const stops = stopsLabel(q.max_stops ?? null)
  if (stops) parts.push(stops)
  return parts.join(' · ')
}

export async function saveSession(state: SessionState): Promise<void> {
  await writeJsonAtomic(SESSION_FILE, state)
}

export async function loadSession(): Promise<SessionState | null> {
  try {
    const raw = await readFile(SESSION_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as SessionState | LegacySessionState | null
    if (
      parsed &&
      typeof parsed === 'object' &&
      'version' in parsed &&
      parsed.version === SESSION_VERSION
    ) {
      const searches = await normalizeSearches(parsed.searches ?? {})
      return {
        version: SESSION_VERSION,
        latest: parsed.latest ?? null,
        searches,
      }
    }
    if (parsed && typeof parsed === 'object')
      return migrateLegacySession(parsed as LegacySessionState)
    return null
  } catch {
    return null
  }
}

export function isFresh(entry: SearchEntry, now = Date.now()): boolean {
  return entry.expiresAt != null && entry.expiresAt > now
}

export async function loadCachedSearch(
  q: SearchQuery,
  depDate: string,
  retDate: string | null,
  opts: { allowStale?: boolean } = {},
): Promise<SearchEntry | null> {
  const params = buildCacheQuery(q, depDate, retDate)
  const cacheKey = buildCacheKey(params)
  const entry = await loadCacheFile(cacheKey)
  if (!entry) return null
  if (entry.cacheKey !== cacheKey) return null
  if (JSON.stringify(entry.params) !== JSON.stringify(params)) return null
  if (!opts.allowStale && !isFresh(entry)) return null
  return entry
}

export async function saveCachedSearch(
  q: SearchQuery,
  depDate: string,
  retDate: string | null,
  offers: Omit<Offer, 'id'>[],
): Promise<SearchEntry> {
  const params = buildCacheQuery(q, depDate, retDate)
  const cacheKey = buildCacheKey(params)
  const timestamp = Date.now()
  const entry: SearchEntry = {
    cacheKey,
    expiresAt: timestamp + CACHE_TTL_MS,
    offers: offers.map((offer, i) => ({ ...offer, id: `O${i + 1}` })),
    params,
    query: buildConcreteQuery(params),
    ref: buildSearchRef(params),
    timestamp,
  }

  await writeJsonAtomic(cacheFilePath(cacheKey), {
    version: SESSION_VERSION,
    ...entry,
  } satisfies CacheFile)

  return entry
}

function materializeSearch(ref: string, search: SessionSearch): SearchEntry | null {
  if (!search.offers) return null
  return {
    offers: search.offers,
    query: search.query,
    ref,
    timestamp: search.timestamp,
  }
}

export async function loadSearchByRef(
  session: SessionState,
  ref: string,
): Promise<SearchEntry | null> {
  const search = session.searches[ref]
  if (!search) return null
  if (!search.cacheKey) return materializeSearch(ref, search)
  const entry = await loadCacheFile(search.cacheKey)
  return entry ?? materializeSearch(ref, search)
}

export async function loadSessionSearches(
  session: SessionState,
): Promise<Array<[string, SearchEntry]>> {
  const entries = await Promise.all(
    Object.entries(session.searches).map(async ([ref]) => {
      const entry = await loadSearchByRef(session, ref)
      return entry ? ([ref, entry] as [string, SearchEntry]) : null
    }),
  )
  return entries.filter((entry): entry is [string, SearchEntry] => entry !== null)
}

export function rememberSearch(session: SessionState, entry: SearchEntry): void {
  session.searches[entry.ref] = {
    cacheKey: entry.cacheKey,
    offerCount: entry.offers.length,
    query: entry.query,
    timestamp: entry.timestamp,
  }
}

export function setLatestSearch(
  session: SessionState,
  offers: Offer[],
  query: string,
  refs: string[],
): void {
  session.latest = {
    offers,
    query,
    refs,
    timestamp: Date.now(),
  }
}

export function clearLatestSearch(session: SessionState): void {
  session.latest = null
}

const THROTTLE_MS = 3000
let lastRequestTime = 0

/** Wait if needed to enforce minimum gap between Google requests */
export async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestTime
  if (lastRequestTime > 0 && elapsed < THROTTLE_MS) {
    await new Promise((r) => setTimeout(r, THROTTLE_MS - elapsed))
  }
  lastRequestTime = Date.now()
}

/** Look up an offer by "REF:ID" or plain "O1" (latest search only). */
export async function resolveOffer(session: SessionState, ref: string): Promise<Offer | null> {
  if (ref.includes(':')) {
    const [searchRef, id] = ref.split(':')
    const entry = await loadSearchByRef(session, searchRef)
    return entry?.offers.find((offer) => offer.id === id.toUpperCase()) ?? null
  }
  return session.latest?.offers.find((offer) => offer.id === ref.toUpperCase()) ?? null
}

/** List all available offer refs across stored searches. */
export function listAvailableRefs(session: SessionState): string[] {
  const refs: string[] = []
  for (const [ref, search] of Object.entries(session.searches)) {
    for (let i = 1; i <= search.offerCount; i++) refs.push(`${ref}:O${i}`)
  }
  return refs
}
