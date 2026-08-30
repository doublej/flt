/** Solari-type drum mechanics. Pure — no DOM, no timers.
 *
 *  40 flaps per drum in a fixed physical order. A drum is a loop of hinged
 *  leaves driven by one motor in one direction, so it can only ever advance:
 *  getting from Z back to A means going the long way round the stack, and that
 *  long way is the whole character of the machine. */
export const FLAPS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-/'

/** stepStart sentinel: a drum at rest. Not 0 — timestamps can legitimately be 0. */
export const REST = -1

export type Drum = {
  /** flap on show; while a step is in flight this is the outgoing one */
  current: number
  target: number
  /** motor tolerance, ~0.96–1.04. Real drums drift apart over a long cycle. */
  rate: number
  /** timestamp the flap in flight started, or -1 when the drum is at rest */
  stepStart: number
}

/** Anything not on a flap lands on blank. */
export function flapIndex(char: string): number {
  const i = FLAPS.indexOf(char.toUpperCase())
  return i < 0 ? 0 : i
}

/** Forward-only distance. Never the short way, never negative. */
export function stepsTo(from: number, to: number): number {
  return (to - from + FLAPS.length) % FLAPS.length
}

export function createDrum(char: string, jitter: number): Drum {
  const i = flapIndex(char)
  return { current: i, target: i, rate: 1 + jitter, stepStart: REST }
}

/** Point a drum at a new character.
 *
 *  A drum already turning keeps its step clock so it does not hitch, and it
 *  cannot stop where it stands — if the new target is the flap it just left it
 *  goes all the way round. Drums at rest all start on the same `now`, which is
 *  what makes the cascade emergent: everyone leaves together, short distances
 *  arrive first. */
export function setTarget(drum: Drum, char: string, now: number): void {
  const target = flapIndex(char)
  if (target === drum.target) return
  drum.target = target
  if (drum.stepStart === REST && target !== drum.current) drum.stepStart = now
}

/** Advance a drum to `now`. Returns progress 0..1 through the flap in flight,
 *  or -1 when at rest. Mutates: one array of these drives a whole board and
 *  per-frame allocation is not affordable at 480 cells. */
export function tick(drum: Drum, now: number, flapMs: number): number {
  if (drum.stepStart === REST) return -1
  const dur = flapMs * drum.rate
  let p = (now - drum.stepStart) / dur
  // bounded: the drum reaches its target within one revolution
  while (p >= 1) {
    drum.current = (drum.current + 1) % FLAPS.length
    drum.stepStart += dur
    p -= 1
    if (drum.current === drum.target) {
      drum.stepStart = REST
      return -1
    }
  }
  return p
}

/** Snap a drum to its target with no rotation (prefers-reduced-motion). */
export function settle(drum: Drum): void {
  drum.current = drum.target
  drum.stepStart = REST
}

/** Column text to exactly `width` flaps. Over-long text is cut, not shrunk —
 *  a real board has the drums it has. */
export function padCells(text: string, width: number, align: 'left' | 'right'): string {
  const t = text.toUpperCase().slice(0, width)
  const pad = ' '.repeat(width - t.length)
  return align === 'right' ? pad + t : t + pad
}

export type Corner = { x: number; y: number }

/** Four-point corner pin: the homography taking the board's own w×h rect to
 *  `corners` (TL, TR, BR, BL), serialised as a CSS matrix3d for
 *  `transform-origin: 0 0`. Null if the quad is degenerate. */
export function cornerPinMatrix(w: number, h: number, corners: Corner[]): string | null {
  if (corners.length !== 4 || w <= 0 || h <= 0) return null
  const [p0, p1, p2, p3] = corners
  const sx = p0.x - p1.x + p2.x - p3.x
  const sy = p0.y - p1.y + p2.y - p3.y

  let a: number
  let b: number
  let d: number
  let e: number
  let g: number
  let hh: number

  if (sx === 0 && sy === 0) {
    // affine: the quad is still a parallelogram
    a = p1.x - p0.x
    b = p2.x - p1.x
    d = p1.y - p0.y
    e = p2.y - p1.y
    g = 0
    hh = 0
  } else {
    const dx1 = p1.x - p2.x
    const dx2 = p3.x - p2.x
    const dy1 = p1.y - p2.y
    const dy2 = p3.y - p2.y
    const den = dx1 * dy2 - dy1 * dx2
    if (den === 0) return null
    g = (sx * dy2 - sy * dx2) / den
    hh = (dx1 * sy - dy1 * sx) / den
    a = p1.x - p0.x + g * p1.x
    b = p3.x - p0.x + hh * p3.x
    d = p1.y - p0.y + g * p1.y
    e = p3.y - p0.y + hh * p3.y
  }
  const c = p0.x
  const f = p0.y
  // fold in the source scale, then serialise column-major
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, c, f, 0, 1]
  return `matrix3d(${m.map((n) => (Math.abs(n) < 1e-9 ? 0 : Number(n.toFixed(8)))).join(',')})`
}
