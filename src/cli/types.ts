import type { Flight } from '$lib/types'

export interface Offer extends Flight {
  id: string
  url: string
}

export interface SearchEntry {
  offers: Offer[]
  query: string
  timestamp: number
}

export interface SessionState {
  /** Latest search (backward compat) */
  offers: Offer[]
  query: string
  timestamp: number
  /** All searches keyed by route tag, e.g. "IAO-MNL" */
  searches?: Record<string, SearchEntry>
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
