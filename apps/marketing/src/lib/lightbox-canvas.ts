/** Backlit sign painter — the lit strip that sits above a departure board.
 *
 *  Measured off the terminal photograph rather than invented, and two of the
 *  measurements are the whole reason this looks photographic:
 *
 *  The diffuser is FLAT. Sampled across the panel it is #fedf8e from end to
 *  end, varying by one or two counts. A tempting centre-hot gradient is simply
 *  not there — fluorescent tubes behind opal acrylic even out completely.
 *
 *  The letters are not dark. The darkest pixel in any stroke is #cc6707, a hot
 *  orange sitting at 55% of the face's luminance, because a sign this
 *  overexposed has light coming through the vinyl and eating into every edge.
 *  Painting them near-black is the single thing that makes a rendered sign read
 *  as a rectangle with text on it rather than as a lit object. */

export type Sign = {
  text: string
  /** the lit diffuser */
  face: string
  /** hot lip where the diffuser meets the frame, top and bottom */
  lip: string
  /** the frame returns at each end */
  frame: string
  ink: string
  /** what the panel throws onto the wall around it */
  glow: string
  /** how far that reaches above and below, in panel heights */
  up: number
  down: number
  /** cap height as a fraction of panel height */
  glyph: number
  /** tracking, in cap heights */
  letter: number
  /** how hard the light eats into the letters, 0..1 */
  bloom: number
  font: string
  icon: boolean
}

/** The photograph's own values. A page overrides what it needs and keeps the rest. */
export const SIGN: Sign = {
  text: '',
  face: '#fedf8e',
  lip: '#ffc34e',
  frame: '#974716',
  ink: '#cc6707',
  glow: '#ff5a0f',
  up: 1.2,
  down: 0.45,
  glyph: 0.5,
  letter: 0.16,
  bloom: 0.55,
  font: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  icon: true,
}

/** panel width : panel height, straight off the photograph */
export const SIGN_ASPECT = 24.1

function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function tint(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex)
  return `rgb(${r} ${g} ${b} / ${Math.max(0, Math.min(1, alpha))})`
}

/** `t` of 0 is all `a`. */
export function mix(a: string, b: string, t: number): string {
  const x = rgb(a)
  const y = rgb(b)
  const k = Math.max(0, Math.min(1, t))
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(' ')})`
}

/** Type that will not fit is scaled down rather than clipped or run off the
 *  end, the same bargain the flaps make. */
export function fitScale(width: number, available: number): number {
  if (width <= 0 || available <= 0) return 1
  return width <= available ? 1 : available / width
}

/** A canvas gradient interpolates linearly, so an exponential falloff has to be
 *  handed over in pieces or the spill reads as a straight ramp — which is the
 *  usual tell of a fake glow. Five stops of exp(-3t), normalised to reach zero. */
const TAIL = Math.exp(-3)
const STOPS: [number, number][] = [0, 0.25, 0.5, 0.75, 1].map((t) => [
  t,
  (Math.exp(-3 * t) - TAIL) / (1 - TAIL),
])
const PEAK = 0.62

/** Alpha the spill is actually drawn at, `t` of the way to its full reach —
 *  piecewise-linear between the stops, because that is what a canvas gradient
 *  does with them. Composited over the photograph's own wall this tracks the
 *  measured falloff to within 2 counts of 255. */
export function spillAlpha(t: number): number {
  if (t <= 0) return PEAK
  if (t >= 1) return 0
  const i = STOPS.findIndex(([at]) => at > t)
  const [t0, a0] = STOPS[i - 1]
  const [t1, a1] = STOPS[i]
  return PEAK * (a0 + ((a1 - a0) * (t - t0)) / (t1 - t0))
}

function spill(
  ctx: CanvasRenderingContext2D,
  x: number,
  edge: number,
  w: number,
  reach: number,
  dir: -1 | 1,
  colour: string,
) {
  if (reach <= 0) return
  const g = ctx.createLinearGradient(0, edge, 0, edge + dir * reach)
  for (const [t] of STOPS) g.addColorStop(t, tint(colour, spillAlpha(t)))
  ctx.fillStyle = g
  ctx.fillRect(x, dir < 0 ? edge - reach : edge, w, reach)
}

/** A small board pictogram at the left end, as on the real sign. */
function icon(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, s: Sign) {
  const d = h * 0.62
  const top = y + (h - d) / 2
  ctx.save()
  ctx.strokeStyle = mix(s.face, s.ink, 0.85)
  ctx.lineWidth = Math.max(0.5, d * 0.1)
  ctx.strokeRect(x, top, d, d)
  ctx.fillStyle = mix(s.face, '#ffffff', 0.6)
  const bar = d * 0.14
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x + d * 0.18, top + d * (0.2 + i * 0.25), d * 0.64, bar)
  }
  ctx.restore()
}

/** Paint the panel. `x, y, w, h` is the lit strip itself; the glow is drawn
 *  outside it, so the surface has to carry `up`/`down` panel-heights of margin
 *  or the spill is clipped. */
export function paintSign(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  s: Sign,
) {
  spill(ctx, x, y, w, h * s.up, -1, s.glow)
  spill(ctx, x, y + h, w, h * s.down, 1, s.glow)

  // the diffuser, with its hot lip top and bottom
  const g = ctx.createLinearGradient(0, y, 0, y + h)
  g.addColorStop(0, s.lip)
  g.addColorStop(0.05, s.face)
  g.addColorStop(0.95, s.face)
  g.addColorStop(1, mix(s.lip, s.frame, 0.45))
  ctx.fillStyle = g
  ctx.fillRect(x, y, w, h)

  // the frame returns at each end
  const rail = Math.max(0.5, w * 0.004)
  ctx.fillStyle = s.frame
  ctx.fillRect(x, y, rail, h)
  ctx.fillRect(x + w - rail, y, rail, h)

  const inset = h * 0.55
  let cursor = x + rail + inset
  if (s.icon) {
    icon(ctx, cursor, y, h, s)
    cursor += h * 0.62 + h * 0.5
  }
  if (!s.text) return

  // cap height is measured off the resolved face, never assumed from the em
  const cap = h * s.glyph
  ctx.font = `500 100px ${s.font}`
  const capEm = ctx.measureText('H').actualBoundingBoxAscent / 100 || 0.72
  let size = cap / capEm
  ctx.font = `500 ${size}px ${s.font}`

  const chars = [...s.text]
  const track = cap * s.letter
  const run = (adv: number[]) => adv.reduce((a, v) => a + v + track, 0) - track
  let advances = chars.map((c) => ctx.measureText(c).width)
  const k = fitScale(run(advances), x + w - rail - inset - cursor)
  if (k < 1) {
    size *= k
    ctx.font = `500 ${size}px ${s.font}`
    advances = chars.map((c) => ctx.measureText(c).width)
  }

  ctx.textBaseline = 'alphabetic'
  ctx.lineJoin = 'round'
  // ink first as a wide soft edge in nearly the face colour, then narrower and
  // darker, then the core: light eating into the stroke, in three passes
  const passes: [number, string][] = [
    [cap * 0.3 * s.bloom, mix(s.face, s.ink, 0.3)],
    [cap * 0.13 * s.bloom, mix(s.face, s.ink, 0.7)],
  ]
  const base = y + h * 0.42 + cap * 0.5
  for (const [ch, i] of chars.map((c, n) => [c, n] as const)) {
    const at = cursor
    for (const [width, colour] of passes) {
      if (width <= 0) continue
      ctx.lineWidth = width
      ctx.strokeStyle = colour
      ctx.strokeText(ch, at, base)
    }
    ctx.fillStyle = s.ink
    ctx.fillText(ch, at, base)
    cursor += advances[i] + track
  }
}
