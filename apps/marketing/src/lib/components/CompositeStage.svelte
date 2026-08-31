<script lang="ts">
import LightBox from '$lib/components/LightBox.svelte'
import SplitFlapBoard, { type Column, type Point } from '$lib/components/SplitFlapBoard.svelte'
import { SIGN } from '$lib/lightbox-canvas'
import { shade } from '$lib/splitflap-canvas'
import { loadTuning, saveTuning } from '$lib/tuning'
import { onMount } from 'svelte'

let {
  src,
  imageWidth,
  imageHeight,
  ratio,
  objectPosition = '50% 50%',
  rows,
  columns,
  corners = $bindable(),
  look = $bindable(),
  sign,
  editable = false,
  storageKey,
}: {
  src: string
  /** intrinsic pixel size of the photograph */
  imageWidth: number
  imageHeight: number
  /** container aspect; omit to let the parent decide the height */
  ratio?: string
  /** matches the img's own object-position, so corners survive the crop */
  objectPosition?: string
  rows: Record<string, string>[]
  columns: Column[]
  /** TL, TR, BR, BL as fractions of the INTRINSIC image, never of the container */
  corners: Point[]
  look: Record<string, string | number | boolean>
  /** Text for the lit sign above the board. Omit for a board with no header. */
  sign?: string
  /** off: no pane, no handles, no tweakpane fetched. The page case. */
  editable?: boolean
  /** Names the saved tuning. Defaults to `src`, so two stages editing the SAME
   *  photograph in different places would trample each other's save — give them
   *  separate keys. */
  storageKey?: string
} = $props()

/* The photograph decodes about a second before the board has drums in it, so
   the hero would open on a bare terminal with a dead box hanging on the wall.
   Hold both back and bring them in together. `decode()` resolves whether the
   image is still arriving or was already in cache, and rejects on a 404 —
   which counts as decoded here, because the alternative is holding forever. */
let photo = $state<HTMLImageElement | null>(null)
let decoded = $state(false)
let built = $state(false)
$effect(() => {
  const done = () => {
    decoded = true
  }
  photo?.decode().then(done, done)
})

let stage = $state<HTMLElement | null>(null)
let panel = $state<HTMLElement | null>(null)
/** the pane, once it has been fetched. Bindings are one-way in practice, so
 *  anything that writes a bound value from code has to refresh it by hand or
 *  the operator reads a stale number off a slider. */
let pane: { dispose(): void; refresh(): void } | null = null
let pw = $state(0)
let ph = $state(0)

/* The pins carry perspective; place carries where the whole board sits. Keeping
   them apart means moving the board never disturbs a corner already set. */
const place = $state({ x: 0, y: 0, scale: 1, rotate: 0 })
const view = $state({ x: 0, y: 0, zoom: 1 })

/** Where the photograph actually lands inside the stage once object-fit: cover
 *  has done its work. Corners are fractions of the image, so a hero that crops
 *  the picture to a different aspect keeps the board welded to the same wall. */
const fit = $derived.by(() => {
  if (!pw || !ph || !imageWidth || !imageHeight) return { ox: 0, oy: 0, dw: pw, dh: ph }
  const s = Math.max(pw / imageWidth, ph / imageHeight)
  const dw = imageWidth * s
  const dh = imageHeight * s
  const [ax, ay] = objectPosition.split(/\s+/).map((v) => (Number.parseFloat(v) || 0) / 100)
  return { ox: (pw - dw) * (ax ?? 0.5), oy: (ph - dh) * (ay ?? 0.5), dw, dh }
})

const basePx = $derived(
  corners.map((c) => ({ x: fit.ox + c.x * fit.dw, y: fit.oy + c.y * fit.dh })),
)
/** A stage point back into fractions of the photograph — the inverse of the
 *  line above, and the only form a corner is ever stored or exported in. */
function asFraction(p: Point): Point {
  return { x: (p.x - fit.ox) / fit.dw, y: (p.y - fit.oy) / fit.dh }
}
const centre = $derived({
  x: basePx.reduce((a, p) => a + p.x, 0) / 4,
  y: basePx.reduce((a, p) => a + p.y, 0) / 4,
})

const pins = $derived.by(() => {
  const a = (place.rotate * Math.PI) / 180
  const cos = Math.cos(a) * place.scale
  const sin = Math.sin(a) * place.scale
  return basePx.map((p) => {
    const dx = p.x - centre.x
    const dy = p.y - centre.y
    return {
      x: centre.x + dx * cos - dy * sin + place.x,
      y: centre.y + dx * sin + dy * cos + place.y,
    }
  })
})

/** Fold the camera back into the corner points and leave it at identity.
 *
 *  `place` is a handle for shifting the whole board at once, but the four pins
 *  are the only geometry a page is ever handed — so a move that stays in `place`
 *  is a move the copied source silently drops, and the board lands somewhere
 *  else once it is pasted in. Baking on every release means the pins are the one
 *  thing that says where the board sits, and the export is complete because
 *  there is nothing else left to export. */
function bake() {
  if (!fit.dw || !fit.dh) return
  if (!place.x && !place.y && place.scale === 1 && !place.rotate) return
  // read the placed pins before zeroing what placed them
  corners = pins.map(asFraction)
  place.x = 0
  place.y = 0
  place.scale = 1
  place.rotate = 0
  pane?.refresh()
}

/** Stage point back into base-quad space, so a pin drag lands under the cursor
 *  even when the board has been moved, scaled or turned. */
function unplace(p: Point): Point {
  const a = (-place.rotate * Math.PI) / 180
  const s = 1 / place.scale
  const dx = p.x - place.x - centre.x
  const dy = p.y - place.y - centre.y
  return {
    x: centre.x + (dx * Math.cos(a) - dy * Math.sin(a)) * s,
    y: centre.y + (dx * Math.sin(a) + dy * Math.cos(a)) * s,
  }
}

const n = (k: string, d: number) => (typeof look[k] === 'number' ? (look[k] as number) : d)
const str = (k: string, d: string) => (typeof look[k] === 'string' ? (look[k] as string) : d)

/* Never strand the hero on a board that cannot report in — a refused canvas
   context, an image that 404s, anything. Three seconds, then the composite is
   exposed regardless, and it still gets the proper entry rather than a jump. */
let stranded = $state(false)
$effect(() => {
  const t = setTimeout(
    () => {
      stranded = true
    },
    n('entryWait', 3000),
  )
  return () => clearTimeout(t)
})
const held = $derived(!stranded && !(decoded && built))

/* The hero's four loops are keyframed in +page.svelte, on the page's own
   .stage, its ::after and .photo. .stage is this component's ANCESTOR, so
   nothing rendered here can inherit into it — :root is the only host that
   reaches all three. The keyframes read these with their present values as
   fallbacks, so a page that declares none of them behaves exactly as before. */
const HERO = $derived.by(() => {
  // paused while tuning unless the operator asks to see it run, or they tune blind
  const live = !editable || look.heroLive !== false
  const play = (k: string) => (live && look[k] !== false ? 'running' : 'paused')
  return {
    '--hero-drift-dur': `${n('heroDriftDur', 29)}s`,
    '--hero-drift-amp': String(n('heroDriftAmp', 1)),
    '--hero-drift-play': play('heroDrift'),
    '--hero-shake-dur': `${n('heroShakeDur', 4.9)}s`,
    '--hero-shake-amp': String(n('heroShakeAmp', 1)),
    '--hero-shake-play': play('heroShake'),
    '--hero-cam-dur': `${n('heroCamDur', 15)}s`,
    '--hero-cam-amp': String(n('heroCamAmp', 1)),
    '--hero-cam-hunt': String(n('heroCamHunt', 1)),
    '--hero-cam-play': play('heroCam'),
    '--hero-grain-dur': `${n('heroGrainDur', 0.45)}s`,
    '--hero-grain-opacity': String(n('heroGrainOpacity', 0.09)),
    '--hero-grain-play': play('heroGrain'),
  }
})
$effect(() => {
  const root = document.documentElement.style
  for (const [k, v] of Object.entries(HERO)) root.setProperty(k, v)
  return () => {
    for (const k of Object.keys(HERO)) root.removeProperty(k)
  }
})

/* render at supersample × the size it occupies; the homography scales it back
   down, so the lens filter and the defocus rasterise at that resolution.
   The top edge's own length, not how much of the width it spans: a turned board
   projects shorter than it is, and now that a turn is baked into the pins rather
   than held in the camera, the difference would show up as the board quietly
   changing resolution as it is rotated. */
const width = $derived(
  Math.max(
    Math.hypot((corners[1].x - corners[0].x) * fit.dw, (corners[1].y - corners[0].y) * fit.dh) *
      place.scale,
    40,
  ) * n('supersample', 2),
)

/** One picker gives the flap's mid tone; the flap still needs its shading. */
const faceCss = $derived.by(() => {
  const f = str('face', '#131a0d')
  return `linear-gradient(180deg, ${shade(f, 2.7)} 0%, ${f} 47%, ${shade(f, 2.1)} 53%, ${shade(f, 0.6)} 100%)`
})

/* the board restyles itself from CSS, but the canvas painter and the width
   budget have to be told a variable moved */
const skinKey = $derived(
  [
    str('face', ''),
    str('ink', ''),
    str('bg', ''),
    n('aspect', 0),
    n('glyph', 0),
    n('squeeze', 0),
    n('baseline', 0),
    n('rowgap', 0),
    n('grit', 0),
    n('pad', 0),
    look.renderer,
  ].join('|'),
)

/* the sign is lit, so it takes none of the board's palette — its own tones came
   off the photograph and the two are only related by sitting on one wall */
const SIGNSKIN = $derived({
  face: str('signFace', '#fedf8e'),
  lip: str('signLip', '#ffc34e'),
  frame: str('signFrame', '#974716'),
  ink: str('signInk', '#cc6707'),
  glow: str('signGlow', '#ff5a0f'),
  up: n('signUp', 1.2),
  down: n('signDown', 0.45),
  glyph: n('signGlyph', 0.5),
  letter: n('signLetter', 0.16),
  bloom: n('signBloom', 0.55),
  pad: n('signPad', 0.55),
  textY: n('signTextY', 0.42),
  icon: look.signIcon !== false,
})

const COMPOSITE = $derived({
  corners: pins,
  grade: {
    exposure: n('exposure', 1),
    contrast: n('contrast', 1),
    warmth: n('warmth', 0),
    angle: n('angle', 190),
    multiply: str('multiply', '#00000000'),
    screen: str('screen', '#00000000'),
  },
  lens: {
    grain: n('grain', 0),
    aberration: n('aberration', 0) * n('supersample', 2),
    vignette: n('vignette', 0),
    blur: n('blur', 0) * n('supersample', 2),
  },
  glass: look.glass !== false,
})

/* --- pointer work -------------------------------------------------------- */

let dragPin = -1
let panning: { x: number; y: number } | null = null
let shifting: { x: number; y: number; scale: number; shift: boolean } | null = null

/** Pointer in stage pixels. The stage rect already carries pan and zoom, and
 *  the transform is uniform, so dividing by its own size undoes both. */
function local(e: PointerEvent): Point | null {
  const box = stage?.getBoundingClientRect()
  if (!box) return null
  return {
    x: ((e.clientX - box.left) / box.width) * pw,
    y: ((e.clientY - box.top) / box.height) * ph,
  }
}
function grabPin(i: number, e: PointerEvent) {
  e.stopPropagation()
  dragPin = i
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function movePin(e: PointerEvent) {
  if (dragPin < 0) return
  const p = local(e)
  if (!p) return
  const b = unplace(p)
  corners[dragPin] = asFraction(b)
}

/* drag inside the board to move it, shift-drag to size it about its centre */
function grabBoard(e: PointerEvent) {
  e.stopPropagation()
  const p = local(e)
  if (!p) return
  shifting = { x: p.x - place.x, y: p.y - place.y, scale: place.scale, shift: e.shiftKey }
  ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
}
function moveBoard(e: PointerEvent) {
  if (!shifting) return
  const p = local(e)
  if (!p) return
  if (shifting.shift) {
    const grew = (p.y - shifting.y - place.y) / Math.max(ph * 0.25, 1)
    place.scale = Math.min(6, Math.max(0.1, shifting.scale * (1 + grew)))
  } else {
    place.x = p.x - shifting.x
    place.y = p.y - shifting.y
  }
}

function startPan(e: PointerEvent) {
  panning = { x: e.clientX - view.x, y: e.clientY - view.y }
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function pan(e: PointerEvent) {
  if (!panning) return
  view.x = e.clientX - panning.x
  view.y = e.clientY - panning.y
}
function zoom(e: WheelEvent) {
  e.preventDefault()
  // the stage's own rect is already transformed; measure against its frame
  const box = stage?.parentElement?.getBoundingClientRect()
  if (!box) return
  const next = Math.min(6, Math.max(0.4, view.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)))
  const cx = e.clientX - box.left
  const cy = e.clientY - box.top
  view.x = cx - ((cx - view.x) / view.zoom) * next
  view.y = cy - ((cy - view.y) / view.zoom) * next
  view.zoom = next
}

/* --- saving --------------------------------------------------------------
   Tuning a composite takes a while and a reload should not cost you it. The
   snapshot is per photograph, so the two pages never overwrite each other. */

const KEY = $derived(`splitflap:${storageKey ?? src}`)
const ui = $state({ saved: 'not saved', tl: '', tr: '', br: '', bl: '' })

/* The pane can only show a number it is bound to, and the one it used to show —
   the camera — is now folded away to identity the moment a drag ends. So bind
   the thing that actually moves. Read off `pins` rather than `corners` so it is
   the board's real position at every instant, camera engaged or not; readonly
   makes it a monitor on a 200ms ticker, so it follows a drag as it happens. */
$effect(() => {
  const [tl, tr, br, bl] = pins.map(asFraction).map((c) => `${c.x.toFixed(4)}, ${c.y.toFixed(4)}`)
  ui.tl = tl
  ui.tr = tr
  ui.br = br
  ui.bl = bl
})
/* set once the page's declared defaults are known; gates the auto-save */
let baseHash = $state<unknown>(null)

function snapshot() {
  return {
    look: $state.snapshot(look),
    corners: $state.snapshot(corners),
    place: $state.snapshot(place),
    view: $state.snapshot(view),
  }
}

/* Saved continuously rather than on a button, so a hot reload costs nothing —
   which is what let hmr go back on for everyone else. */
let saveTimer = 0
$effect(() => {
  if (!editable || !baseHash) return
  const data = snapshot()
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTuning(KEY, baseHash, data)
    ui.saved = `saved ${stamp()}`
  }, 400)
  return () => clearTimeout(saveTimer)
})

function apply(data: ReturnType<typeof snapshot>) {
  for (const [k, v] of Object.entries(data.look ?? {})) if (k in look) look[k] = v
  if (data.corners?.length === 4) corners = data.corners
  if (data.place) Object.assign(place, data.place)
  if (data.view) Object.assign(view, data.view)
  // a snapshot saved before the camera was baked still carries one; fold it in
  bake()
}

/** navigator.clipboard exists only in a secure context, and the operator reaches
 *  this app by LAN address rather than localhost — where the whole API is simply
 *  undefined and the button throws. The old selection trick does not care. */
async function copy(text: string) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text)
  const box = document.createElement('textarea')
  box.value = text
  box.style.cssText = 'position:fixed;opacity:0'
  document.body.append(box)
  box.select()
  document.execCommand('copy')
  box.remove()
}

function stamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** The values as the page would declare them, ready to paste over the defaults. */
function asSource() {
  const body = Object.entries($state.snapshot(look))
    .map(([k, v]) => `  ${k}: ${typeof v === 'string' ? `'${v}'` : v},`)
    .join('\n')
  const pts = $state
    .snapshot(corners)
    // Number() drops the trailing zeros toFixed leaves behind, which the
    // formatter would otherwise strip out of the pasted block by hand.
    .map((c) => `  { x: ${Number(c.x.toFixed(4))}, y: ${Number(c.y.toFixed(4))} },`)
    .join('\n')
  return `const look = $state({\n${body}\n})\n\nlet corners = $state<Point[]>([\n${pts}\n])\n`
}

/* --- panel --------------------------------------------------------------- */

/* A page declares the look it cares about. The pane cannot bind a key that is
   not there, so the rest are filled in from the painter's own defaults before
   the defaults snapshot is taken — which keeps "Reset to defaults" honest about
   the sign as well. */
function seedSign() {
  const fill: Record<string, string | number | boolean> = {
    signFace: SIGN.face,
    signLip: SIGN.lip,
    signFrame: SIGN.frame,
    signInk: SIGN.ink,
    signGlow: SIGN.glow,
    signUp: SIGN.up,
    signDown: SIGN.down,
    signGlyph: SIGN.glyph,
    signLetter: SIGN.letter,
    signBloom: SIGN.bloom,
    signPad: SIGN.pad,
    signTextY: SIGN.textY,
    signSqueeze: 1,
    signIcon: SIGN.icon,
    signX: 0,
    signY: 0.02,
    signW: 1,
    signH: 0.13,
  }
  for (const [k, v] of Object.entries(fill)) if (!(k in look)) look[k] = v
}

/* Same trick as seedSign: the page declares what it cares about, and the pane
 *  cannot bind a key that is not there, so the rest arrive before the defaults
 *  snapshot is taken — which keeps "Reset to defaults" honest about the motion
 *  as well. Every default here is the value the CSS already had. */
function seedHero() {
  const fill: Record<string, string | number | boolean> = {
    heroLive: true,
    heroDrift: true,
    heroDriftDur: 29,
    heroDriftAmp: 1,
    heroShake: true,
    heroShakeDur: 4.9,
    heroShakeAmp: 1,
    heroCam: true,
    heroCamDur: 15,
    heroCamAmp: 1,
    heroCamHunt: 1,
    heroGrain: true,
    heroGrainDur: 0.45,
    heroGrainOpacity: 0.09,
    entryWait: 3000,
    entryDur: 2400,
    entryZoomDur: 2900,
    entryBright: 0,
    entryContrast: 0.55,
    entryBlur: 16,
    entryOvershoot: 1.13,
    entryZoom: 1.04,
  }
  for (const [k, v] of Object.entries(fill)) if (!(k in look)) look[k] = v
}

onMount(() => {
  if (!editable) return
  let cancelled = false

  if (sign) seedSign()
  seedHero()

  // captured before anything is restored, so Reset means the page's own values
  const defaults = JSON.parse(
    JSON.stringify({ look: $state.snapshot(look), corners: $state.snapshot(corners) }),
  )
  const restored = loadTuning<ReturnType<typeof snapshot>>(KEY, defaults)
  if (restored.value) {
    apply(restored.value)
    ui.saved = 'restored'
  } else if (restored.stale) {
    ui.saved = 'defaults changed, save dropped'
  }
  baseHash = defaults

  /* The pane lives on the body, not in the composite. Two things inside here
     make an ancestor a containing block for fixed children — the camera's
     transform on .stage and the entry's filter on .work — so a pane left in
     place is laid out against the stage and clipped away by the hero's
     overflow. Moved out, it is fixed to the viewport wherever it is used. */
  if (panel) document.body.append(panel)

  import('tweakpane').then(({ Pane }) => {
    if (cancelled || !panel) return
    const p = new Pane({ container: panel, title: 'Composite' })
    pane = p

    const pins = p.addFolder({ title: 'Pins' })
    pins.addBinding(ui, 'tl', { readonly: true, label: 'top left' })
    pins.addBinding(ui, 'tr', { readonly: true, label: 'top right' })
    pins.addBinding(ui, 'br', { readonly: true, label: 'bottom right' })
    pins.addBinding(ui, 'bl', { readonly: true, label: 'bottom left' })

    const keep = p.addFolder({ title: 'Save' })
    keep.addBinding(ui, 'saved', { readonly: true, label: '' })
    keep.addButton({ title: 'Restore' }).on('click', () => {
      const back = loadTuning<ReturnType<typeof snapshot>>(KEY, baseHash)
      if (!back.value) {
        ui.saved = back.stale ? 'defaults changed, save dropped' : 'nothing saved'
        return
      }
      apply(back.value)
      p.refresh()
      ui.saved = 'restored'
    })
    keep.addButton({ title: 'Copy as code' }).on('click', async () => {
      await copy(asSource())
      ui.saved = 'copied to clipboard'
    })
    keep.addButton({ title: 'Reset to defaults' }).on('click', () => {
      localStorage.removeItem(KEY)
      apply({
        ...defaults,
        place: { x: 0, y: 0, scale: 1, rotate: 0 },
        view: { x: 0, y: 0, zoom: 1 },
      })
      p.refresh()
      ui.saved = 'reset'
    })

    const grade = p.addFolder({ title: 'Grade' })
    grade.addBinding(look, 'exposure', { min: 0.4, max: 2.2, step: 0.01 })
    grade.addBinding(look, 'contrast', { min: 0.4, max: 1.8, step: 0.01 })
    grade.addBinding(look, 'warmth', { min: -1, max: 1, step: 0.01 })
    grade.addBinding(look, 'angle', { min: 0, max: 360, step: 1 })
    grade.addBinding(look, 'multiply', { view: 'color', color: { alpha: true } })
    grade.addBinding(look, 'screen', { view: 'color', color: { alpha: true } })

    const lens = p.addFolder({ title: 'Lens' })
    lens.addBinding(look, 'grain', { min: 0, max: 1, step: 0.01 })
    lens.addBinding(look, 'aberration', { min: 0, max: 3, step: 0.05 })
    lens.addBinding(look, 'vignette', { min: 0, max: 1, step: 0.01 })
    lens.addBinding(look, 'blur', { min: 0, max: 4, step: 0.05 })
    lens.addBinding(look, 'supersample', { min: 1, max: 4, step: 0.5 })
    lens.addBinding(look, 'glass')

    const board = p.addFolder({ title: 'Board' })
    board.addBinding(look, 'renderer', { options: { dom: 'dom', canvas: 'canvas' } })
    board.addBinding(look, 'bg', { view: 'color', color: { alpha: true }, label: 'backing' })
    board.addBinding(look, 'pad', { min: 0, max: 3, step: 0.05, label: 'backing inset' })
    board.addBinding(look, 'face', { view: 'color' })
    board.addBinding(look, 'ink', { view: 'color' })
    board.addBinding(look, 'aspect', { min: 0.4, max: 1.1, step: 0.005 })
    board.addBinding(look, 'glyph', { min: 0.6, max: 1.4, step: 0.01 })
    board.addBinding(look, 'squeeze', { min: 0.5, max: 1.1, step: 0.01 })
    board.addBinding(look, 'baseline', { min: -0.1, max: 0.1, step: 0.001 })
    board.addBinding(look, 'rowgap', { min: 0, max: 0.4, step: 0.005 })
    board.addBinding(look, 'grit', { min: 0, max: 0.3, step: 0.005 })

    if (sign) {
      const lit = p.addFolder({ title: 'Sign' })
      lit.addBinding(look, 'signFace', { view: 'color', label: 'diffuser' })
      lit.addBinding(look, 'signInk', { view: 'color', label: 'letters' })
      lit.addBinding(look, 'signGlow', { view: 'color', label: 'spill' })
      lit.addBinding(look, 'signLip', { view: 'color', label: 'lip' })
      lit.addBinding(look, 'signFrame', { view: 'color', label: 'frame' })
      lit.addBinding(look, 'signX', { min: -0.5, max: 1, step: 0.002, label: 'x' })
      lit.addBinding(look, 'signY', { min: -0.2, max: 0.6, step: 0.002, label: 'y (above board)' })
      lit.addBinding(look, 'signW', { min: 0.05, max: 1.5, step: 0.002, label: 'width' })
      lit.addBinding(look, 'signH', { min: 0.01, max: 0.6, step: 0.002, label: 'height' })
      lit.addBinding(look, 'signPad', { min: 0, max: 3, step: 0.01, label: 'inner pad' })
      lit.addBinding(look, 'signTextY', { min: 0.1, max: 0.9, step: 0.005, label: 'text y' })
      lit.addBinding(look, 'signSqueeze', {
        min: 0.4,
        max: 1.6,
        step: 0.01,
        label: 'letter width',
      })
      lit.addBinding(look, 'signGlyph', { min: 0.2, max: 0.9, step: 0.01, label: 'cap height' })
      lit.addBinding(look, 'signLetter', { min: 0, max: 0.6, step: 0.01, label: 'tracking' })
      lit.addBinding(look, 'signBloom', { min: 0, max: 1.4, step: 0.01, label: 'light bleed' })
      lit.addBinding(look, 'signUp', { min: 0, max: 4, step: 0.05, label: 'spill up' })
      lit.addBinding(look, 'signDown', { min: 0, max: 4, step: 0.05, label: 'spill down' })
      lit.addBinding(look, 'signIcon', { label: 'pictogram' })
    }

    const cam = p.addFolder({ title: 'Hero motion' })
    cam.addBinding(look, 'heroLive', { label: 'run while tuning' })
    cam.addBinding(look, 'heroDrift', { label: 'tripod drift' })
    cam.addBinding(look, 'heroDriftDur', { min: 4, max: 90, step: 0.5, label: '· seconds' })
    cam.addBinding(look, 'heroDriftAmp', { min: 0, max: 4, step: 0.05, label: '· travel' })
    cam.addBinding(look, 'heroShake', { label: 'handheld' })
    cam.addBinding(look, 'heroShakeDur', { min: 0.5, max: 20, step: 0.1, label: '· seconds' })
    cam.addBinding(look, 'heroShakeAmp', { min: 0, max: 6, step: 0.05, label: '· travel' })
    cam.addBinding(look, 'heroCam', { label: 'exposure hunt' })
    cam.addBinding(look, 'heroCamDur', { min: 2, max: 60, step: 0.5, label: '· seconds' })
    cam.addBinding(look, 'heroCamAmp', { min: 0, max: 4, step: 0.05, label: '· depth' })
    cam.addBinding(look, 'heroCamHunt', { min: 0, max: 6, step: 0.05, label: '· focus hunt' })
    cam.addBinding(look, 'heroGrain', { label: 'grain' })
    cam.addBinding(look, 'heroGrainDur', { min: 0.05, max: 3, step: 0.01, label: '· seconds' })
    cam.addBinding(look, 'heroGrainOpacity', { min: 0, max: 0.6, step: 0.005, label: '· strength' })

    const ent = p.addFolder({ title: 'Entry' })
    ent.addBinding(look, 'entryDur', { min: 200, max: 6000, step: 50, label: 'exposure ms' })
    ent.addBinding(look, 'entryZoomDur', { min: 200, max: 8000, step: 50, label: 'zoom ms' })
    ent.addBinding(look, 'entryBright', { min: 0, max: 1, step: 0.01, label: 'open at' })
    ent.addBinding(look, 'entryContrast', { min: 0, max: 1.5, step: 0.01, label: 'open contrast' })
    ent.addBinding(look, 'entryBlur', { min: 0, max: 60, step: 0.5, label: 'open blur px' })
    ent.addBinding(look, 'entryOvershoot', { min: 1, max: 1.8, step: 0.005, label: 'overshoot' })
    ent.addBinding(look, 'entryZoom', { min: 1, max: 1.3, step: 0.002, label: 'zoom from' })
    ent.addBinding(look, 'entryWait', {
      min: 500,
      max: 10000,
      step: 100,
      label: 'give up after ms',
    })

    /* The sliders move the board exactly as dragging it does, so they settle the
       same way: on release the nudge becomes corner points and the slider comes
       back to its neutral. `last` is what tells a release from a drag in
       progress — baking mid-drag would fight the operator's own hand. */
    const settle = (e: { last: boolean }) => {
      if (e.last) bake()
    }
    const put = p.addFolder({ title: 'Place' })
    put.addBinding(place, 'x', { min: -1400, max: 1400, step: 1 }).on('change', settle)
    put.addBinding(place, 'y', { min: -1400, max: 1400, step: 1 }).on('change', settle)
    put.addBinding(place, 'scale', { min: 0.1, max: 6, step: 0.01 }).on('change', settle)
    put.addBinding(place, 'rotate', { min: -45, max: 45, step: 0.1 }).on('change', settle)
    put.addButton({ title: 'Reset placement' }).on('click', () => {
      place.x = 0
      place.y = 0
      place.scale = 1
      place.rotate = 0
    })

    const photo = p.addFolder({ title: 'Photo' })
    photo.addBinding(view, 'x', { min: -1400, max: 1400, step: 1 })
    photo.addBinding(view, 'y', { min: -1400, max: 1400, step: 1 })
    photo.addBinding(view, 'zoom', { min: 0.4, max: 6, step: 0.01 })
    photo.addButton({ title: 'Reset view' }).on('click', () => {
      view.x = 0
      view.y = 0
      view.zoom = 1
    })
    photo.addBinding(look, 'pins', { label: 'distort pins' })
  })

  return () => {
    cancelled = true
    pane?.dispose()
    panel?.remove()
  }
})
</script>

<div
	class="work"
	class:held
	style:--entry-dur="{n('entryDur', 2400)}ms"
	style:--entry-zoom-dur="{n('entryZoomDur', 2900)}ms"
	style:--entry-bright={n('entryBright', 0)}
	style:--entry-contrast={n('entryContrast', 0.55)}
	style:--entry-blur="{n('entryBlur', 16)}px"
	style:--entry-overshoot={n('entryOvershoot', 1.13)}
	style:--entry-zoom={n('entryZoom', 1.04)}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="photo"
		style:aspect-ratio={ratio}
		class:static={!editable}
		bind:clientWidth={pw}
		bind:clientHeight={ph}
		onpointerdown={editable ? startPan : undefined}
		onpointermove={editable ? pan : undefined}
		onpointerup={editable
			? () => {
					panning = null
				}
			: undefined}
		onwheel={editable ? zoom : undefined}
	>
		<div
			class="stage"
			bind:this={stage}
			style:transform="translate({view.x}px, {view.y}px) scale({view.zoom})"
			style:--sf-face={faceCss}
			style:--sf-face-mid={str('face', '#131a0d')}
			style:--sf-bg={str('bg', '#00000000')}
			style:--sf-pad={n('pad', 0)}
			style:--sf-ink={str('ink', '#fbf7ee')}
			style:--sf-aspect={n('aspect', 0.62)}
			style:--sf-glyph={n('glyph', 1.1)}
			style:--sf-squeeze={n('squeeze', 0.7)}
			style:--sf-gy={n('baseline', -0.013)}
			style:--sf-rowgap={n('rowgap', 0.09)}
			style:--sf-grain={n('grit', 0.06)}
		>
			<img
				class="scene"
				bind:this={photo}
				{src}
				alt=""
				draggable="false"
				style:object-position={objectPosition}
			/>
			<div class="pinned" style:width="{width}px">
				{#snippet lit(distort: number)}
					<LightBox
						text={sign}
						sign={{ ...SIGNSKIN, squeeze: distort * n('signSqueeze', 1) }}
						scale={n('supersample', 2)}
					/>
				{/snippet}
				<SplitFlapBoard
					{rows}
					{columns}
					variant="bare"
					renderer={look.renderer === 'canvas' ? 'canvas' : 'dom'}
					{skinKey}
					composite={COMPOSITE}
					sign={sign ? lit : undefined}
					signX={n('signX', 0)}
					signY={n('signY', 0.02)}
					signW={n('signW', 1)}
					signH={n('signH', 0.13)}
					onready={() => (built = true)}
				/>
			</div>
			{#if editable}
			<svg class="quad" aria-hidden="true">
				<polygon
					class="grab"
					points={pins.map((c) => `${c.x},${c.y}`).join(' ')}
					onpointerdown={grabBoard}
					onpointermove={moveBoard}
					onpointerup={() => {
						shifting = null
						bake()
					}}
				/>
				{#if look.pins !== false}
					<polygon class="edge" points={pins.map((c) => `${c.x},${c.y}`).join(' ')} />
				{/if}
			</svg>
			{/if}
			{#if editable && look.pins !== false}
				{#each pins as c, i (i)}
					<button
						class="pin"
						style:left="{c.x}px"
						style:top="{c.y}px"
						aria-label="Corner {i + 1}"
						onpointerdown={(e) => grabPin(i, e)}
						onpointermove={movePin}
						onpointerup={() => {
							dragPin = -1
						}}
					></button>
				{/each}
			{/if}
		</div>
	</div>
	{#if editable}<div class="panel" bind:this={panel}></div>{/if}
</div>

<style>
	/* The entry rides on .work because everything inside it is spoken for: the
	   hero animates .stage with its drift loop and .photo with two more, and a
	   fourth writer on either would just win the cascade and stop the camera.
	   .work sits between the two and owns neither, so grading it grades the whole
	   composite — photograph and board as one frame — and composes with the
	   camera loop underneath rather than replacing it. */
	.work {
		transition: none;
	}
	/* Not a fade. The frame is there from the first moment and only its exposure
	   is wrong: black, flat and soft, then the level comes up, runs slightly past
	   itself and settles. Written in the same three properties hero-camera hunts
	   in, and landing on brightness(1) contrast(1) blur(0) — that loop's own 0%
	   keyframe — so the handoff into it is not a handoff at all. */
	@keyframes expose {
		0% {
			filter: brightness(var(--entry-bright)) contrast(var(--entry-contrast))
				blur(var(--entry-blur));
		}
		30% {
			filter: brightness(calc(var(--entry-bright) + 0.45)) contrast(calc(var(--entry-contrast) + 0.17))
				blur(calc(var(--entry-blur) * 0.38));
		}
		55% {
			filter: brightness(calc(var(--entry-bright) + 0.95)) contrast(calc(var(--entry-contrast) + 0.37))
				blur(calc(var(--entry-blur) * 0.11));
		}
		/* past the level, and the lens all but there */
		70% {
			filter: brightness(var(--entry-overshoot)) contrast(1.05) blur(calc(var(--entry-blur) * 0.03));
		}
		/* focus lands first; the level is still coming back down behind it */
		82% {
			filter: brightness(calc(1 + (var(--entry-overshoot) - 1) * 0.7)) contrast(1.02) blur(0);
		}
		100% {
			filter: brightness(1) contrast(1) blur(0);
		}
	}
	/* Underneath and longer than the exposure, so it is still creeping after the
	   level has settled — felt rather than seen. */
	@keyframes lens-settle {
		from {
			transform: scale(var(--entry-zoom));
		}
		to {
			transform: none;
		}
	}
	.work:not(.held) {
		animation:
			expose var(--entry-dur) cubic-bezier(0.4, 0, 0.2, 1) both,
			lens-settle var(--entry-zoom-dur) cubic-bezier(0.25, 0.1, 0.2, 1) both;
	}
	/* Held black and soft until the photograph has decoded and the board has
	   painted its first flaps. `uncover` is the no-script backstop and nothing
	   else: the prerendered page is served to people whose JS never runs, and a
	   hero that sits black forever is worse than one that arrives unannounced.
	   A separate name on purpose — reusing `expose` here would leave one running
	   animation whose delay merely changes when the class drops, and it would
	   jump to wherever its clock had already reached instead of starting. */
	.work.held {
		filter: brightness(var(--entry-bright)) contrast(var(--entry-contrast))
			blur(var(--entry-blur));
		transform: scale(var(--entry-zoom));
		animation: uncover 1ms linear 4s forwards;
	}
	@keyframes uncover {
		to {
			filter: none;
			transform: none;
		}
	}
	/* Motion goes, the hold stays. Revealing early here would only trade a long
	   dead board for a short one, and the board settles instantly on this path
	   anyway, so the wait costs nothing. */
	@media (prefers-reduced-motion: reduce) {
		.work.held {
			filter: brightness(var(--entry-bright));
			transform: none;
		}
		.work:not(.held) {
			animation: none;
		}
	}
	.work {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 17rem;
		align-items: start;
		gap: 1.2rem;
	}
	.work:not(:has(.panel)) {
		display: block;
	}
	.photo.static {
		cursor: default;
		border-radius: 0;
	}
	.photo.static .stage {
		pointer-events: none;
	}
	.photo {
		position: relative;
		border-radius: var(--radius);
		overflow: hidden;
		touch-action: none;
		cursor: grab;
		background: #05100f;
	}
	.photo:active {
		cursor: grabbing;
	}
	.stage {
		position: absolute;
		inset: 0;
		transform-origin: 0 0;
	}
	.scene {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		user-select: none;
	}
	.pinned {
		position: absolute;
		top: 0;
		left: 0;
	}
	.quad {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.grab {
		fill: rgb(255 255 255 / 0.001);
		pointer-events: fill;
		cursor: move;
	}
	.edge {
		fill: none;
		stroke: #c34527;
		stroke-width: 1;
		stroke-dasharray: 3 4;
		opacity: 0.5;
		pointer-events: none;
	}
	.pin {
		position: absolute;
		width: 16px;
		height: 16px;
		margin: -8px 0 0 -8px;
		border-radius: 50%;
		border: 2px solid rgb(255 255 255 / 0.85);
		background: #c34527;
		padding: 0;
		cursor: move;
		touch-action: none;
	}
	/* On the body, so fixed means fixed: the pane stays in the corner and scrolls
	   inside itself however long the folder list gets. */
	.panel {
		position: fixed;
		top: 5rem;
		right: 1rem;
		z-index: 60;
		width: 21rem;
		max-height: calc(100svh - 6rem);
		overflow: auto;
		overscroll-behavior: contain;
	}
	@media (max-width: 900px) {
		.work {
			grid-template-columns: 1fr;
		}
	}
</style>
