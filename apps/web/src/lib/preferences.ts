const STORAGE_KEY = 'flight-preferences'

export interface Preferences {
  currency: string
  seat: 'economy' | 'premium-economy' | 'business' | 'first'
  adults: number
  children: number
  infants_in_seat: number
  infants_on_lap: number
}

const DEFAULTS: Preferences = {
  currency: 'EUR',
  seat: 'economy',
  adults: 1,
  children: 0,
  infants_in_seat: 0,
  infants_on_lap: 0,
}

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function savePreferences(prefs: Partial<Preferences>): void {
  const current = loadPreferences()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...prefs }))
}
