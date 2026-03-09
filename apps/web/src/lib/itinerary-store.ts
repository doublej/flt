import type { Offer } from './types'

export interface StoredItinerary {
  id: string
  name: string
  legs: Offer[]
  createdAt: number
}

const STORAGE_KEY = 'flight-itineraries'
const ACTIVE_KEY = 'active-itinerary'

const isBrowser = typeof globalThis.localStorage !== 'undefined'

function load(): StoredItinerary[] {
  if (!isBrowser) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredItinerary[]) : []
  } catch {
    return []
  }
}

function save(items: StoredItinerary[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function listItineraries(): StoredItinerary[] {
  return load()
}

export function getActiveId(): string | null {
  if (!isBrowser) return null
  return localStorage.getItem(ACTIVE_KEY)
}

export function setActiveId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id)
}

export function getActive(): StoredItinerary | null {
  const id = getActiveId()
  if (!id) return null
  return load().find((it) => it.id === id) ?? null
}

export function createItinerary(name: string): StoredItinerary {
  const items = load()
  const it: StoredItinerary = {
    id: `IT${Date.now().toString(36)}`,
    name,
    legs: [],
    createdAt: Date.now(),
  }
  items.push(it)
  save(items)
  setActiveId(it.id)
  return it
}

export function deleteItinerary(id: string): void {
  save(load().filter((it) => it.id !== id))
  if (getActiveId() === id) localStorage.removeItem(ACTIVE_KEY)
}

export function renameItinerary(id: string, name: string): void {
  const items = load()
  const it = items.find((x) => x.id === id)
  if (it) {
    it.name = name
    save(items)
  }
}

export function addLeg(id: string, offer: Offer): void {
  const items = load()
  const it = items.find((x) => x.id === id)
  if (it) {
    it.legs.push(offer)
    save(items)
  }
}

export function removeLeg(id: string, index: number): void {
  const items = load()
  const it = items.find((x) => x.id === id)
  if (it) {
    it.legs.splice(index, 1)
    save(items)
  }
}
