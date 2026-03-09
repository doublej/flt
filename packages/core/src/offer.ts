import type { Flight } from './types'

export interface Offer extends Flight {
  id: string
  url: string
}

export interface CacheQuery {
  from_airport: string
  to_airport: string
  departure_date: string
  return_date: string | null
  adults: number
  children: number
  infants_in_seat: number
  infants_on_lap: number
  seat: 'economy' | 'premium-economy' | 'business' | 'first'
  max_stops: number | null
  currency: string
}

export interface SearchEntry {
  offers: Offer[]
  query: string
  timestamp: number
  ref: string
  cacheKey?: string
  expiresAt?: number
  params?: CacheQuery
}

export interface SessionSearch {
  cacheKey?: string
  query: string
  timestamp: number
  offerCount: number
  offers?: Offer[]
}

export interface LatestSearch {
  offers: Offer[]
  query: string
  timestamp: number
  refs: string[]
}

export interface Session {
  id: string
  name: string
  startedAt: number
  closedAt?: number
  searchRefs: string[]
  favorites?: Offer[]
}

export interface SessionState {
  version: number
  latest: LatestSearch | null
  searches: Record<string, SessionSearch>
  sessions: Session[]
  activeSessionId?: string
  /** @deprecated — migrated to sessions[] in v3 */
  sessionStartedAt?: number
}

export type SortKey = 'price' | 'dur' | 'stops' | 'dep'
