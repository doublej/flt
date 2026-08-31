/** Run: bun run src/lib/splitflap.test.ts */
import {
  FLAPS,
  REST,
  cornerPinMatrix,
  createDrum,
  fitType,
  flapIndex,
  padCells,
  pinDistortion,
  setTarget,
  stepsTo,
  tick,
} from './splitflap'

let n = 0
function ok(what: string, cond: boolean) {
  n++
  if (!cond) throw new Error(`FAIL: ${what}`)
}

ok('40 flaps, blank first', FLAPS.length === 40 && FLAPS[0] === ' ')

// forward-only cycling: Z to A goes the long way, through digits and blank
ok('Z→A is 15 forward steps', stepsTo(flapIndex('Z'), flapIndex('A')) === 15)
ok('A→Z is 25 forward steps', stepsTo(flapIndex('A'), flapIndex('Z')) === 25)
ok('never negative', stepsTo(39, 0) === 1 && stepsTo(0, 39) === 39)
ok('unknown char is blank', flapIndex('€') === 0)

// an unchanged character produces zero steps and never leaves rest
{
  const d = createDrum('A', 0)
  setTarget(d, 'A', 1000)
  ok('unchanged: stays at rest', d.stepStart === REST)
  ok('unchanged: zero distance', stepsTo(d.current, d.target) === 0)
  ok('unchanged: tick is a no-op', tick(d, 9e9, 62) === -1 && d.current === flapIndex('A'))
}

// a real run: every visited flap is the previous one plus one, mod 40
{
  const d = createDrum('Z', 0)
  setTarget(d, 'A', 0)
  const seen = [d.current]
  for (let t = 0; t <= 62 * 40; t += 8) {
    const before = d.current
    tick(d, t, 62)
    if (d.current !== before) seen.push(d.current)
  }
  ok('lands on A', d.current === flapIndex('A'))
  ok('took exactly 15 steps', seen.length === 16)
  ok(
    'monotone +1 mod 40',
    seen.every((v, i) => i === 0 || v === (seen[i - 1] + 1) % 40),
  )
  ok('wrapped through blank', seen.includes(0))
  ok('at rest afterwards', tick(d, 1e6, 62) === -1 && d.stepStart === REST)
}

// progress is a fraction, and a retarget mid-flight cannot reverse the drum
{
  const d = createDrum(' ', 0)
  setTarget(d, 'C', 0)
  const p = tick(d, 31, 62)
  ok('progress is 0..1', p > 0.49 && p < 0.51)
  // retargeting to the flap it just left cannot stop it dead: it goes round
  setTarget(d, ' ', 31)
  ok('still in flight', d.stepStart !== REST)
  let steps = 0
  for (let t = 31; t <= 62 * 45; t += 4) {
    const before = d.current
    tick(d, t, 62)
    if (d.current !== before) steps++
  }
  ok('a full revolution, not a reverse', steps === 40 && d.current === 0)
}

// the hover knock: a drum already on its target, handed nothing but a start
// time, runs the whole way round and comes back to the character it was showing
{
  const d = createDrum('K', 0)
  d.stepStart = 0
  let steps = 0
  for (let t = 0; t <= 62 * 45; t += 4) {
    const before = d.current
    tick(d, t, 62)
    if (d.current !== before) steps++
  }
  ok('knock: a full revolution', steps === 40)
  ok('knock: lands back on its own flap', d.current === flapIndex('K') && d.stepStart === REST)
}

// motor tolerance stretches the step, it does not skip one
{
  const slow = createDrum(' ', 0.04)
  setTarget(slow, 'A', 0)
  ok('slow drum has not landed at nominal time', tick(slow, 62, 62) >= 0)
  ok('slow drum lands late', tick(slow, 62 * 1.04 + 1, 62) === -1)
}

ok('padCells left', padCells('ams', 5, 'left') === 'AMS  ')
ok('padCells right', padCells('ams', 5, 'right') === '  AMS')
ok('padCells truncates', padCells('AMSTERDAM', 3, 'left') === 'AMS')

// corner pin: the untouched rect is the identity
{
  const rect = [
    { x: 0, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 200 },
    { x: 0, y: 200 },
  ]
  ok(
    'rect → identity',
    cornerPinMatrix(400, 200, rect) === 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)',
  )
  const skew = cornerPinMatrix(400, 200, [
    { x: 20, y: 10 },
    { x: 380, y: 40 },
    { x: 360, y: 190 },
    { x: 10, y: 160 },
  ])
  ok('skewed quad has perspective terms', !!skew && /matrix3d\(/.test(skew))
  ok('degenerate quad is rejected', cornerPinMatrix(400, 200, rect.slice(0, 3)) === null)
}

// --- fitType ---------------------------------------------------------------
{
  // Arial Narrow: the designed pair already fits, so nothing is touched
  const room = fitType(1.1, 0.7, 0.62, 0.774)
  ok('a pair that fits is left alone', !room.clamped)
  ok('untouched values pass through', room.glyph === 1.1 && room.squeeze === 0.7)

  // Helvetica Neue: same pair overflows and must be pulled back to the edge
  const tight = fitType(1.1, 0.7, 0.62, 0.944)
  ok('a pair that overflows is clamped', tight.clamped)
  ok(
    'the clamped pair lands exactly on the flap edge',
    Math.abs(tight.glyph * tight.squeeze * 0.944 - 0.62) < 1e-9,
  )
  ok('squeeze never gives up more than 10%', tight.squeeze >= 0.7 * 0.9 - 1e-9)
  ok('the rest of the correction comes out of the glyph', tight.glyph < 1.1)

  // a face wide enough that squeeze alone cannot save it
  const huge = fitType(1.1, 0.7, 0.3, 0.944)
  ok('squeeze stops at the floor', Math.abs(huge.squeeze - 0.63) < 1e-9)
  ok('glyph absorbs the remainder', Math.abs(huge.glyph * huge.squeeze * 0.944 - 0.3) < 1e-9)

  ok('an unmeasurable face is left alone', !fitType(1.1, 0.7, 0.62, 0).clamped)
}

// --- pinDistortion ---------------------------------------------------------
{
  const rect = (w: number, h: number) => [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ]
  ok('a quad of the same shape distorts nothing', pinDistortion(100, 50, rect(200, 100)) === 1)
  ok('a quad twice as wide needs half-width type', pinDistortion(100, 50, rect(400, 100)) === 0.5)
  ok('a quad twice as tall needs double-width type', pinDistortion(100, 50, rect(200, 200)) === 2)
  ok('a degenerate box is left alone', pinDistortion(0, 50, rect(200, 100)) === 1)
  ok('too few corners is left alone', pinDistortion(100, 50, [{ x: 0, y: 0 }]) === 1)
}

console.log(`splitflap: ${n} assertions passed`)
