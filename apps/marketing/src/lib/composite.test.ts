import { buildComposite, buildSignSkin, buildSkinKey, readNumber, readText } from './composite'

/** The stage takes its grade out of a loose Record whose keys may be absent or
 *  the wrong type — a tuning saved against older defaults, a renamed control.
 *  Every one of those has to fall back rather than paint NaN into a canvas. */

let n = 0
function ok(what: string, cond: boolean) {
  n++
  if (!cond) throw new Error(`composite: ${what}`)
}

// --- coercion -------------------------------------------------------------

ok('reads a number', readNumber({ blur: 0.85 }, 'blur', 9) === 0.85)
ok('falls back on a missing key', readNumber({}, 'blur', 9) === 9)
ok('falls back on a string', readNumber({ blur: '0.85' }, 'blur', 9) === 9)
ok('falls back on a boolean', readNumber({ blur: true }, 'blur', 9) === 9)
// The pane writes 0 for "off"; a truthiness check here would silently restore
// the default and the control would appear not to work.
ok('keeps a zero', readNumber({ blur: 0 }, 'blur', 9) === 0)

ok('reads a string', readText({ face: '#131a0d' }, 'face', 'x') === '#131a0d')
ok('falls back on a missing key', readText({}, 'face', 'x') === 'x')
ok('falls back on a number', readText({ face: 42 }, 'face', 'x') === 'x')
// An empty colour is a real value the pane can produce, not an absent one.
ok('keeps an empty string', readText({ face: '' }, 'face', 'x') === '')

// --- the grade ------------------------------------------------------------

const empty = buildComposite({}, null)
ok('exposure defaults to neutral', empty.grade.exposure === 1)
ok('contrast defaults to neutral', empty.grade.contrast === 1)
ok('lens defaults to off', empty.lens.grain === 0 && empty.lens.vignette === 0)
ok('glass is on unless refused', empty.glass === true)
ok('glass off only on false', buildComposite({ glass: false }, null).glass === false)
ok('glass ignores other falsies', buildComposite({ glass: 0 }, null).glass === true)

// Both are source-pixel distances, so they scale with the render budget: at 2x
// an unscaled blur reads half as soft as it did at 1x.
const at3 = buildComposite({ blur: 0.5, aberration: 0.75, supersample: 3 }, null)
ok('blur scales with supersample', at3.lens.blur === 1.5)
ok('aberration scales with supersample', at3.lens.aberration === 2.25)
ok('supersample defaults to 2', buildComposite({ blur: 0.5 }, null).lens.blur === 1)
// A bad supersample must not turn the lens into NaN.
ok(
  'bad supersample falls back',
  buildComposite({ blur: 0.5, supersample: 'hi' }, null).lens.blur === 1,
)

ok('corners pass through', buildComposite({}, [{ x: 1, y: 2 }]).corners?.[0].x === 1)

// --- the sign -------------------------------------------------------------

ok('sign icon on by default', buildSignSkin({}).icon === true)
ok('sign icon off only on false', buildSignSkin({ signIcon: false }).icon === false)
ok('sign takes its own palette', buildSignSkin({ face: '#000' }).face === '#fedf8e')
ok('sign reads its own key', buildSignSkin({ signFace: '#fff' }).face === '#fff')

// --- the skin key ---------------------------------------------------------

// Two objects that differ only in a key the painter does not care about must
// land on the same string, or the canvas repaints on every unrelated tweak.
const saved = { face: '#000', grit: 1, pins: true }
const reloaded = { face: '#000', grit: 1, pins: false }
ok(
  'a variable the painter ignores is not in the key',
  buildSkinKey(saved) === buildSkinKey(reloaded),
)
ok('a moved variable moves the key', buildSkinKey({ grit: 1 }) !== buildSkinKey({ grit: 2 }))
// The renderer is what the key exists to catch: canvas and DOM paint differently
// from identical CSS, so the painter has to be told even when nothing else moved.
ok(
  'the renderer is in the key',
  buildSkinKey({ renderer: 'canvas' }) !== buildSkinKey({ renderer: 'dom' }),
)

console.log(`composite: ${n} assertions passed`)
