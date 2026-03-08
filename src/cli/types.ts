import type { Flight } from '$lib/types'

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

export interface SessionState {
  version: number
  latest: LatestSearch | null
  searches: Record<string, SessionSearch>
}

export type Format = 'jsonl' | 'tsv' | 'table' | 'brief'
export type SortKey = 'price' | 'dur' | 'stops' | 'dep'
export type View = 'min' | 'std' | 'full'

export const DEFAULT_FIELDS = 'id,price,stops,dur,car,dep,arr,date'
export const VIEW_FIELDS: Record<View, string> = {
  min: 'id,price,stops,dur',
  std: DEFAULT_FIELDS,
  full: 'id,price,stops,dur,car,flt_no,dep,arr,date,best,ret,ahead',
}
