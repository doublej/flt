// Re-export shared types from core
export type {
  Offer,
  CacheQuery,
  SearchEntry,
  SessionSearch,
  LatestSearch,
  Session,
  SessionState,
  SortKey,
} from '@flights/core'

// CLI-specific types
export type Format = 'jsonl' | 'tsv' | 'table' | 'brief'
export type View = 'min' | 'std' | 'full'

export const DEFAULT_FIELDS = 'id,price,stops,dur,car,dep,arr,date'
export const VIEW_FIELDS: Record<View, string> = {
  min: 'id,price,stops,dur',
  std: DEFAULT_FIELDS,
  full: 'id,price,stops,dur,car,flt_no,dep,arr,date,best,ret,ahead',
}
