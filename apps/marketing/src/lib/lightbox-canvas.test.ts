/** bun run src/lib/lightbox-canvas.test.ts */
import { SIGN, fitScale, mix, spillAlpha, tint } from './lightbox-canvas'

let n = 0
function ok(what: string, cond: boolean) {
  n++
  if (!cond) throw new Error(`FAIL: ${what}`)
}

ok('mix at 0 is the first colour', mix('#102030', '#ffffff', 0) === 'rgb(16 32 48)')
ok('mix at 1 is the second', mix('#102030', '#ffffff', 1) === 'rgb(255 255 255)')
ok('mix halfway averages', mix('#000000', '#ffffff', 0.5) === 'rgb(128 128 128)')
ok('mix clamps past the ends', mix('#000000', '#ffffff', 4) === 'rgb(255 255 255)')

ok('tint keeps the channels', tint('#cc6707', 0.5) === 'rgb(204 103 7 / 0.5)')
ok('tint clamps alpha', tint('#000000', 9) === 'rgb(0 0 0 / 1)')

ok('type that fits is not scaled', fitScale(100, 200) === 1)
ok('type that overflows is scaled to fit', fitScale(200, 100) === 0.5)
ok('a zero budget does not divide by zero', fitScale(100, 0) === 1)

// the two measurements the whole look rests on, pinned so a later tweak is a
// deliberate one rather than a slow drift back to "rectangle with text on it"
ok('the diffuser is the measured flat amber', SIGN.face === '#fedf8e')
ok('the letters are hot, not dark', Number.parseInt(SIGN.ink.slice(1, 3), 16) > 0x99)

// The spill is the part that sells it, so it is checked against the photograph
// rather than against itself: composite the modelled glow over the wall tone
// sampled beside the sign, and compare with what the pixels there actually are.
{
  const glow = [255, 0x5a, 0x0f]
  const wall = [0x26, 0x27, 0x1d]
  const reach = 24 * SIGN.up
  const measured: [number, number[]][] = [
    [2, [0xa6, 0x3d, 0x0a]],
    [6, [0x6c, 0x33, 0x13]],
    [14, [0x40, 0x2d, 0x1a]],
    [20, [0x31, 0x29, 0x1a]],
  ]
  for (const [d, want] of measured) {
    const a = spillAlpha(d / reach)
    const got = glow.map((c, i) => Math.round(c * a + wall[i] * (1 - a)))
    const off = Math.abs(got.reduce((x, y) => x + y, 0) - want.reduce((x, y) => x + y, 0)) / 3
    ok(`the spill matches the photograph ${d}px above the panel (off by ${off})`, off <= 8)
  }
  ok('the spill reaches nothing at full reach', spillAlpha(1) === 0)
  ok('the spill is brightest at the panel edge', spillAlpha(0) > spillAlpha(0.01))
}

console.log(`lightbox: ${n} assertions passed`)
