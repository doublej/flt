import type { SearchParams } from './types'

export interface RecentSearch {
  params: SearchParams
  fromName: string
  toName: string
  timestamp: number
}

const STORAGE_KEY = 'recent-searches'
const MAX_ENTRIES = 5

export function loadRecent(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RecentSearch[]
  } catch {
    return []
  }
}

export function saveRecent(entry: RecentSearch): void {
  const list = loadRecent().filter(
    (e) =>
      e.params.from_airport !== entry.params.from_airport ||
      e.params.to_airport !== entry.params.to_airport ||
      e.params.date !== entry.params.date,
  )
  list.unshift(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)))
}

export function removeRecent(index: number): void {
  const list = loadRecent()
  list.splice(index, 1)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}
