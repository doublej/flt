/** bun run src/lib/tuning.test.ts */
import { loadTuning, saveTuning } from './tuning'

let n = 0
function ok(what: string, cond: boolean) {
  n++
  if (!cond) throw new Error(`FAIL: ${what}`)
}

const store = new Map<string, string>()
// @ts-expect-error minimal stand-in; only these two methods are used
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => store.set(k, v),
  removeItem: (k: string) => store.delete(k),
}

const KEY = 'test:tuning'
const defaults = { glyph: 1.1, squeeze: 0.7 }

ok('nothing saved is not the same as stale', !loadTuning(KEY, defaults).stale)

saveTuning(KEY, defaults, { glyph: 1.2, squeeze: 0.65 })
const back = loadTuning<typeof defaults>(KEY, defaults)
ok('a save round-trips', back.value?.glyph === 1.2 && back.value?.squeeze === 0.65)
ok('the fingerprint is not handed back as tuning', !('base' in (back.value ?? {})))

// the page edits its own defaults: the file wins and the save is binned
const moved = loadTuning(KEY, { glyph: 1.0, squeeze: 0.7 })
ok('a save is dropped once the defaults move on', moved.value === null && moved.stale)
ok('the dropped save is deleted, not re-reported', !loadTuning(KEY, defaults).stale)

// the fingerprint is over serialised JSON, so it is key-order sensitive. That is
// fine — the defaults come from one object literal in one file — but reordering
// that literal does bin the save, so say so rather than implying otherwise.
saveTuning(KEY, defaults, { glyph: 1.3 })
ok('an equal literal matches', loadTuning(KEY, { glyph: 1.1, squeeze: 0.7 }).value !== null)
ok('a reordered literal does not', loadTuning(KEY, { squeeze: 0.7, glyph: 1.1 }).stale)

console.log(`tuning: ${n} assertions passed`)
