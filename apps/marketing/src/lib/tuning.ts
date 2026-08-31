/** Tweakpane tuning that survives a reload but never outlives the source it came
 *  from. A save carries a fingerprint of the defaults its page declared, and is
 *  dropped once those move on — edit the defaults in a file and the file wins,
 *  rather than a months-old save quietly beating the change you just made. */

function fingerprint(v: unknown): string {
  const t = JSON.stringify(v)
  let h = 5381
  for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/** `stale` distinguishes "nothing saved" from "a save was discarded", which are
 *  worth telling apart in the panel readout. */
export function loadTuning<T>(key: string, defaults: unknown): { value: T | null; stale: boolean } {
  const raw = localStorage.getItem(key)
  if (!raw) return { value: null, stale: false }
  const { base, ...rest } = JSON.parse(raw)
  if (base !== fingerprint(defaults)) {
    localStorage.removeItem(key)
    return { value: null, stale: true }
  }
  return { value: rest as T, stale: false }
}

export function saveTuning(key: string, defaults: unknown, value: object): void {
  localStorage.setItem(key, JSON.stringify({ base: fingerprint(defaults), ...value }))
}
