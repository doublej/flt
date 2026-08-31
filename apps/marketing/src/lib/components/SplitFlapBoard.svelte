<!-- A split-flap board.

     NEVER put one inside a <p>. The board renders divs, and the HTML parser
     closes an open paragraph before a div, so the server tree and the hydrated
     tree disagree and hydration throws HierarchyRequestError. That failure is
     wildly out of proportion to the mistake: it kills hydration for the WHOLE
     page at the first offending board, so every onMount on the page silently
     stops and nothing interactive works anywhere. It presents as "the pane
     stopped opening", not as "the board is broken".

     Nothing here can guard against it — hydration dies before any of this
     component's code runs. Inline wrappers that a div does not auto-close,
     <b> and <h4> among them, are fine. LightBox is block-level on the same
     terms. -->
<script lang="ts" module>
export type Column = { id: string; label?: string; width: number; align?: 'left' | 'right' }
export type Point = { x: number; y: number }
export type Composite = {
  /** destination corners in shell space: TL, TR, BR, BL */
  corners?: Point[]
  grade?: {
    exposure?: number
    contrast?: number
    /** -1 cool … +1 warm */
    warmth?: number
    multiply?: string
    screen?: string
    angle?: number
  }
  lens?: { grain?: number; aberration?: number; vignette?: number; blur?: number }
  /** CSS mask-image, so a pillar or a shoulder in the photo can cut into the board */
  mask?: string
  glass?: boolean
}

let uid = 0

/* One rAF for the page. A dozen boards on a marketing page is a dozen loops
   otherwise, and they all want the same timestamp anyway. */
const running = new Set<(now: number) => void>()
let driver = 0

function drive(now: number) {
  driver = 0
  for (const board of running) board(now)
  if (running.size) driver = requestAnimationFrame(drive)
}

function join(board: (now: number) => void) {
  running.add(board)
  if (!driver) driver = requestAnimationFrame(drive)
}
</script>

<script lang="ts">
import {
  FLAPS,
  type Drum,
  REST,
  cornerPinMatrix,
  createDrum,
  fitType,
  padCells,
  pinDistortion,
  settle,
  setTarget,
  tick,
} from '$lib/splitflap'
import { type Leaf, type Skin, paintCell, widestFlap } from '$lib/splitflap-canvas'
import type { Snippet } from 'svelte'

let {
  rows,
  columns,
  variant = 'cased',
  composite,
  flapMs = 62,
  renderer = 'dom',
  skinKey,
  sign,
  signX = 0,
  signY = 0.02,
  signW = 1,
  signH = 0.13,
}: {
  rows: Record<string, string>[]
  columns: Column[]
  variant?: 'cased' | 'bare' | 'plain' | 'night'
  composite?: Composite
  flapMs?: number
  /** 'dom' is four CSS 3D planes per cell; 'canvas' is one surface for the lot */
  renderer?: 'dom' | 'canvas'
  /** Change this whenever a --sf-* variable changes. CSS restyles the DOM path
   *  on its own, but the canvas painter and the width budget have to be told. */
  skinKey?: string | number
  /** A header fixture bolted above the flaps — a lit sign, usually. It rides
   *  inside the same homography and the same lens as the board, because on a
   *  real wall it is the same object; anything pinned separately reads as a
   *  sticker. It is handed the board's own horizontal distortion, so type
   *  inside it can cancel what the homography is about to do to it. */
  sign?: Snippet<[number]>
  /** Where that fixture sits, as plain fractions of the board's own box: x and
   *  w across, y and h up. y is the clearance between the fixture's underside
   *  and the top row, so every one of the four grows in the direction you would
   *  expect. They are handed to CSS as percentages and nothing here does any
   *  geometry with them. */
  signX?: number
  signY?: number
  signW?: number
  signH?: number
} = $props()

/* Every internal dimension is a ratio of the cell, so the board is the same
   object at 8px cells and at 200px cells. */
/* Only the horizontal budget lives in JS — it decides the cell width. Aspect,
   gaps, glyph size and squeeze are CSS custom properties so a page can retune
   the whole machine without a single new prop. Keep these in step with the
   --sf-* defaults in the stylesheet below. */
const CELL_GAP = 0.09 // between drums in a column, in cell widths
const COL_GAP = 0.55
const BEZEL = 0.7
const P1 = 0.55 // share of a step spent on the falling leaf

const id = `sf${uid++}`
let shell = $state<HTMLElement | null>(null)
let cw = $state(0)
let pad = $state(BEZEL)
let aspect = $state(0.62)
let rowGapRatio = $state(0.09)
/* what the type actually gets to be after the fit check below */
let fitGlyph = $state(0)
let fitSqueeze = $state(0)
let bw = $state(0)
let bh = $state(0)
let mirror = $state('')
let onscreen = $state(false)
let reduced = false

const cols = $derived(columns.map((c) => ({ ...c, align: c.align ?? 'left' })))
const seats = $derived(cols.map((c) => Array.from({ length: c.width }, (_, i) => i)))
const perRow = $derived(cols.reduce((n, c) => n + c.width, 0))
/** width of the whole board in cell widths, bezel included */
const content = $derived(perRow * (1 + CELL_GAP) - CELL_GAP + (cols.length - 1) * COL_GAP)
const units = $derived(content + 2 * pad)
const cellH = $derived(cw / aspect)
const rowGap = $derived(cellH * rowGapRatio)
const geom = $derived({
  cw,
  cell: cellH,
  gap: cw * CELL_GAP,
  colGap: cw * COL_GAP,
  rowGap,
})
const canvasW = $derived(cw * content)
const canvasH = $derived(rows.length ? rows.length * (cellH + rowGap) - rowGap : 0)
const target = $derived(
  rows.map((r) => cols.map((c) => padCells(r[c.id] ?? '', c.width, c.align)).join('')).join('')
)
const hasLabels = $derived(cols.some((c) => c.label))

/** Fixed per cell, never animated: real drums are not perfectly aligned and
 *  this half-pixel offset between the two halves is the strongest realism cue.
 *  Hashed rather than random so server and client agree on the markup. */
function hash(i: number, salt: number): number {
  const s = Math.sin((i + 1) * 12.9898 + salt) * 43758.5453
  return s - Math.floor(s)
}
function misreg(i: number): string {
  return `${((hash(i, 0) * 0.6 - 0.3) * 0.5).toFixed(3)}px`
}
/** No two flaps came off the press with the same amount of ink on them. */
function wear(i: number): string {
  return (0.88 + hash(i, 7.13) * 0.12).toFixed(3)
}

/* --- the machine ------------------------------------------------------- */

let drums: Drum[] = []
let topTxt: HTMLElement[] = []
let botTxt: HTMLElement[] = []
let lt: HTMLElement[] = []
let lb: HTMLElement[] = []
let ltTxt: HTMLElement[] = []
let lbTxt: HTMLElement[] = []
let canvas = $state<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let skin: Skin = {
  face: '#131a0d',
  ink: '#fbf7ee',
  seam: 'rgb(0 0 0 / 0.9)',
  glyph: 1.1,
  squeeze: 0.7,
  font: "'Arial Narrow', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  wear: 1,
  mis: 0,
  grain: 0.06,
  radius: 0,
}
let phase: Uint8Array = new Uint8Array(0)
let shown: Int16Array = new Int16Array(0)

function readSkin() {
  if (!shell) return
  const cs = getComputedStyle(shell)
  const num = (k: string, d: number) => {
    const v = Number.parseFloat(cs.getPropertyValue(k))
    return Number.isFinite(v) ? v : d
  }
  const raw = cs.getPropertyValue('--sf-pad').trim()
  pad = raw
    ? Number.parseFloat(raw)
    : variant === 'bare' || variant === 'night'
      ? 0
      : variant === 'plain'
        ? 0.5
        : BEZEL
  // custom properties are not computed, so calc() cannot be read back: derive
  aspect = num('--sf-aspect', 0.62)
  rowGapRatio = num('--sf-rowgap', 0.09)
  skin.grain = num('--sf-grain', 0.06)
  skin.face = cs.getPropertyValue('--sf-face-mid').trim() || '#131a0d'
  skin.ink = cs.getPropertyValue('--sf-ink').trim() || '#fbf7ee'
  const face = cs.getPropertyValue('--face').trim()
  const f = fitType(num('--sf-glyph', 1.1), num('--sf-squeeze', 0.7), aspect, widestFlap(face))
  fitGlyph = f.glyph
  fitSqueeze = f.squeeze
  skin.glyph = f.glyph
  skin.squeeze = f.squeeze
}

function build(text: string) {
  if (renderer === 'canvas') return buildCanvas(text)
  const cells = shell?.querySelectorAll<HTMLElement>('.cell') ?? []
  drums = []
  topTxt = []
  botTxt = []
  lt = []
  lb = []
  ltTxt = []
  lbTxt = []
  phase = new Uint8Array(cells.length)
  shown = new Int16Array(cells.length).fill(-99)
  cells.forEach((cell, i) => {
    const kids = cell.children as unknown as HTMLElement[]
    topTxt.push(kids[0].firstElementChild as HTMLElement)
    botTxt.push(kids[1].firstElementChild as HTMLElement)
    lt.push(kids[2])
    lb.push(kids[3])
    ltTxt.push(kids[2].firstElementChild as HTMLElement)
    lbTxt.push(kids[3].firstElementChild as HTMLElement)
    // boards boot blank and flap up to their content, so that is where we start
    drums.push(createDrum(' ', (Math.random() - 0.5) * 0.08))
    rest(i)
  })
  const now = performance.now()
  for (let i = 0; i < drums.length; i++) setTarget(drums[i], text[i], now)
}

/** Park a drum: both halves of the same glyph, no leaf. `shown` keeps the
 *  landed flap as its bitwise complement — always negative, so it can never be
 *  mistaken for the mid-step marker and a drum that ran its whole distance
 *  inside one frame still gets written. */
function buildCanvas(text: string) {
  drums = []
  phase = new Uint8Array(text.length)
  shown = new Int16Array(text.length).fill(-99)
  for (let i = 0; i < text.length; i++) drums.push(createDrum(' ', (Math.random() - 0.5) * 0.08))
  const now = performance.now()
  for (let i = 0; i < drums.length; i++) setTarget(drums[i], text[i], now)
}

/** Where cell `i` sits on the canvas. Same grid the DOM path lays out in flex. */
function cellBox(i: number) {
  const r = Math.floor(i / perRow)
  let k = i % perRow
  let x = 0
  for (const col of cols) {
    if (k < col.width) break
    k -= col.width
    x += col.width * (geom.cw + geom.gap) + geom.colGap - geom.gap
  }
  return {
    x: x + k * (geom.cw + geom.gap),
    y: r * (geom.cell + geom.rowGap),
  }
}

function repaintAll() {
  if (!ctx || !canvas) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const dpr = window.devicePixelRatio || 1
  ctx.scale(dpr, dpr)
  for (let i = 0; i < drums.length; i++) {
    shown[i] = -99
    if (phase[i] === 0) rest(i)
  }
}

function paint(i: number, leaf: Leaf | null) {
  if (!ctx) return
  const { x, y } = cellBox(i)
  const d = drums[i]
  const next = (d.current + 1) % FLAPS.length
  skin.mis = (hash(i, 0) * 0.6 - 0.3) * 0.5
  skin.wear = 0.88 + hash(i, 7.13) * 0.12
  // mid-step the standing flap already shows the incoming top half; the fallen
  // one keeps the outgoing bottom until the new leaf lands on it
  paintCell(ctx, x, y, geom.cw, geom.cell, skin, FLAPS[leaf ? next : d.current], FLAPS[d.current], leaf)
}

function rest(i: number) {
  const c = drums[i].current
  phase[i] = 0
  if (shown[i] === ~c) return
  if (renderer === 'canvas') {
    paint(i, null)
    shown[i] = ~c
    return
  }
  lt[i].style.visibility = 'hidden'
  lb[i].style.visibility = 'hidden'
  topTxt[i].textContent = FLAPS[c]
  botTxt[i].textContent = FLAPS[c]
  shown[i] = ~c
}

/** ease-out with ~1.5% overshoot: the leaf slaps into its stop and rebounds */
function land(u: number): number {
  const k = u - 1
  return 1 + 1.09 * k * k * k + 0.09 * k * k
}

function frame(now: number) {
  let moving = 0
  for (let i = 0; i < drums.length; i++) {
    const d = drums[i]
    const p = tick(d, now, flapMs)
    if (p < 0) {
      if (shown[i] !== ~d.current) rest(i)
      // A drum the hand knocked later in this same frame carries a start time
      // the frame clock has not reached yet. It is not at rest, and if the loop
      // stopped on it the drum would sit there until some other knock restarted
      // it — and then turn with no hand anywhere near it.
      if (d.stepStart !== REST) moving++
      continue
    }
    moving++
    if (renderer === 'canvas') {
      const upper = p < P1
      const u = upper ? p / P1 : (p - P1) / (1 - P1)
      const e = upper ? u * u : land(u)
      paint(i, {
        upper,
        cos: Math.cos((((upper ? e : 1 - e) * 90) * Math.PI) / 180),
        bright: upper ? 1 + 0.5 * e : 0.55 + 0.45 * e,
        char: FLAPS[upper ? d.current : (d.current + 1) % FLAPS.length],
      })
      shown[i] = d.current
      continue
    }
    const next = (d.current + 1) % FLAPS.length
    if (shown[i] !== d.current) {
      // the standing flap already shows the incoming top half; the fallen one
      // still shows the outgoing bottom until the new leaf lands on it
      topTxt[i].textContent = FLAPS[next]
      botTxt[i].textContent = FLAPS[d.current]
      ltTxt[i].textContent = FLAPS[d.current]
      lbTxt[i].textContent = FLAPS[next]
      shown[i] = d.current
    }
    if (p < P1) {
      if (phase[i] !== 1) {
        lt[i].style.visibility = ''
        lb[i].style.visibility = 'hidden'
        phase[i] = 1
      }
      const u = p / P1
      const e = u * u // drive plus gravity: accelerating
      lt[i].style.transform = `translateZ(0.6px) rotateX(${-90 * e}deg)`
      lt[i].style.filter = `brightness(${1 + 0.5 * e}) blur(${(0.075 * cw * e).toFixed(2)}px)`
    } else {
      if (phase[i] !== 2) {
        lt[i].style.visibility = 'hidden'
        lb[i].style.visibility = ''
        phase[i] = 2
      }
      const e = land((p - P1) / (1 - P1))
      lb[i].style.transform = `translateZ(0.6px) rotateX(${(90 * (1 - e)).toFixed(2)}deg)`
      lb[i].style.filter = `brightness(${(0.55 + 0.45 * e).toFixed(3)})`
    }
  }
  if (moving) return
  running.delete(frame)
  mirror = readout()
}

function readout(): string {
  const head = hasLabels ? `${cols.map((c) => c.label ?? c.id).join(', ')}. ` : ''
  return head + rows.map((r) => cols.map((c) => r[c.id] ?? '').join(' ')).join('. ')
}

/* --- the hand ------------------------------------------------------------
   A wall of loose plastic reacts to a hand passed over it, and it is the speed
   that does it rather than the presence: rest a palm on a board and nothing
   happens, sweep one across and drums let go all the way along. So the whole
   gesture is measured in cells crossed per second, which makes it one gesture
   on the hero's nine rows and on a word of inline type — a small board is
   quicker to cross in its own units, and is duly more skittish, the way a small
   board of light flaps would be.

   A knocked drum is never handed a new character, only a start time. The rest
   is the machine's own: a drum can only turn forwards, so it runs the whole way
   round its forty flaps and arrives back on exactly the flap it was already
   showing. There is no bookkeeping to get wrong and no path on which the board
   is left lying about what we found. */

/** cells per second at which the hand is going hard enough to take every drum
 *  it passes over. A slow read of a board is a tenth of this. */
const HAND_REF = 120

const hand = { x: 0, y: 0, t: 0, speed: 0, owed: 0 }

/** Triangular about zero: the patch is densest under the cursor and thins out,
 *  rather than the flat disc a single random would give. */
function scatter(radius: number): number {
  return (Math.random() + Math.random() - 1) * radius
}

function clamp(v: number, hi: number): number {
  return v < 0 ? 0 : v > hi ? hi : v
}

function knock(e: PointerEvent) {
  // a coarse pointer has no hover at all: a finger only reports while it is
  // dragging the page, and flipping the board under a scroll would be a glitch
  if (reduced || !onscreen || !drums.length || e.pointerType === 'touch') return
  // the hero's board is pinned into a photograph, so its box is wherever the
  // homography put it. Measuring the transformed rect is what keeps the sums in
  // the cell units the reader is actually looking at.
  const box = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const cell = box.width / perRow
  const dt = (e.timeStamp - hand.t) / 1000
  const dist = Math.hypot(e.clientX - hand.x, e.clientY - hand.y) / cell
  hand.x = e.clientX
  hand.y = e.clientY
  hand.t = e.timeStamp
  // a long silence means the pointer arrived rather than travelled, and the
  // jump from wherever it last was says nothing about how fast it is going
  if (!(dt > 0) || dt > 0.1 || !(cell > 0)) return

  hand.speed += (dist / dt - hand.speed) * 0.4 // mice report in bursts; smooth it
  // Capped at one: the hardest sweep there is can set going every drum it went
  // over and no more, so a board can never owe more flaps than it has.
  const force = Math.min(hand.speed / HAND_REF, 1)
  hand.owed += dist * force
  if (hand.owed < 1) return

  const k0 = (e.clientX - box.left) / cell
  const r0 = ((e.clientY - box.top) / box.height) * rows.length
  // the patch spreads with the same force: a drift takes the drums it touches,
  // a sweep takes them either side as well. A row is a cell tall divided by the
  // aspect, so the same radius reaches fewer rows than it does columns.
  const radius = 1 + force * 3
  const now = performance.now()
  let woke = false
  for (; hand.owed >= 1; hand.owed -= 1) {
    const k = clamp(Math.round(k0 - 0.5 + scatter(radius)), perRow - 1)
    const r = clamp(Math.round(r0 - 0.5 + scatter(radius * aspect)), rows.length - 1)
    const d = drums[r * perRow + k]
    if (d.stepStart !== REST) continue // already turning; it has been asked once
    d.stepStart = now
    woke = true
  }
  if (woke) join(frame)
}

$effect(() => {
  const text = target
  // an offscreen board that has never been built stays unbuilt: no refs, no
  // drums, no frames. It flaps in the first time it is actually looked at.
  if (!shell || (!onscreen && !drums.length)) return
  if (text.length !== drums.length) build(text)
  else {
    // one `now` for every drum: they all leave together, short distances land
    // first, and the cascade falls out of that rather than being staggered
    const now = performance.now()
    for (let i = 0; i < drums.length; i++) setTarget(drums[i], text[i], now)
  }
  // nobody is looking: land on the answer and do no work at all
  if (reduced || !onscreen) {
    running.delete(frame)
    for (let i = 0; i < drums.length; i++) {
      settle(drums[i])
      rest(i)
    }
    mirror = readout()
    return
  }
  join(frame)
})

$effect(() => {
  const el = shell
  if (!el) return
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const ro = new ResizeObserver(([e]) => {
    bw = e.contentRect.width
    bh = el.offsetHeight
    readSkin() // pad feeds the width budget, so read it before dividing
    cw = bw / units
  })
  ro.observe(el)
  const io = new IntersectionObserver(([e]) => {
    onscreen = e.isIntersecting
  }, { rootMargin: '120px' })
  io.observe(el)
  return () => {
    ro.disconnect()
    io.disconnect()
    running.delete(frame)
  }
})

/* a --sf-* variable moved: re-read it, and repaint if canvas is drawing */
$effect(() => {
  skinKey
  if (!shell) return
  readSkin()
  if (renderer === 'canvas') repaintAll()
})

$effect(() => {
  const el = canvas
  const w = Math.round(canvasW)
  const h = Math.round(canvasH)
  if (renderer !== 'canvas' || !el || w <= 0 || h <= 0) return
  const dpr = window.devicePixelRatio || 1
  el.width = Math.round(w * dpr)
  el.height = Math.round(h * dpr)
  ctx = el.getContext('2d')
  repaintAll()
})

/* --- compositing -------------------------------------------------------- */

/* The filter region is a percentage of the filtered box, and the fixture stands
   proud of it, so the headroom has to be bought back in percent. Three times the
   fixture's height covers its own box plus a spill of up to two heights; a
   fiercer glow than that keeps its geometry but loses grain and aberration above
   the cut, because an SVG filter simply stops at its region edge. */
const head = $derived(sign ? Math.min(400, (signY + signH * 3) * 100) : 0)

const distort = $derived(
  composite?.corners ? pinDistortion(bw, bh, composite.corners) : 1
)


const pin = $derived(composite?.corners ? cornerPinMatrix(bw, bh, composite.corners) : null)
const grade = $derived(composite?.grade)
const lens = $derived(composite?.lens)
const angle = $derived(grade?.angle ?? 155)
const warmth = $derived(grade?.warmth ?? 0)
const rootCss = $derived(
  grade ? `brightness(${grade.exposure ?? 1}) contrast(${grade.contrast ?? 1})` : 'none'
)
const optics = $derived(lens?.grain || lens?.aberration ? `url(#${id})` : '')
const lensCss = $derived(
  [optics, lens?.blur ? `blur(${lens.blur}px)` : ''].filter(Boolean).join(' ') || 'none'
)
</script>

<div
	class="shell {variant}"
	bind:this={shell}
	style:--cw="{cw}px"
	style:--fit-glyph={fitGlyph || null}
	style:--fit-squeeze={fitSqueeze || null}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- The hand hangs off .root rather than off the shell because .root is the
	     element the corner pin moves: hit testing follows the transform, so this
	     listens where the board is actually seen rather than where it was laid
	     out. Decoration only — nothing here is a control. -->
	<div
		class="root"
		style:transform={pin ?? undefined}
		style:filter={rootCss}
		onpointermove={knock}
	>
		<div class="optics" style:filter={lensCss}>
			{#if sign}
				<div
					class="fixture"
					style:--sign-x="{signX * 100}%"
					style:--sign-y="{signY * 100}%"
					style:--sign-w="{signW * 100}%"
					style:--sign-h="{signH * 100}%"
				>
					{@render sign(distort)}
				</div>
			{/if}
			<div class="board" style:mask-image={composite?.mask} aria-hidden="true">
				{#if hasLabels}
					<div class="labels">
						{#each cols as col (col.id)}
							<div class="label" style:--w={col.width}>{col.label ?? ''}</div>
						{/each}
					</div>
				{/if}
				{#if renderer === 'canvas'}
					<canvas
						class="surface"
						bind:this={canvas}
						style:width="{canvasW}px"
						style:height="{canvasH}px"
					></canvas>
				{:else}
				{#each rows as _row, r (r)}
					<div class="row">
						{#each cols as col, c (col.id)}
							<div class="col">
								{#each seats[c] as k (k)}
									<div class="cell" style:--mis={misreg(r * perRow + c * 31 + k)}
										style:--wear={wear(r * perRow + c * 31 + k)}>
										<div class="half top"><span></span></div>
										<div class="half bot"><span></span></div>
										<div class="leaf lt"><span></span></div>
										<div class="leaf lb"><span></span></div>
									</div>
								{/each}
							</div>
						{/each}
					</div>
				{/each}
				{/if}

				{#if grade}
					{#if grade.multiply}
						<div
							class="ov mul"
							style:background="linear-gradient({angle}deg, {grade.multiply}, transparent)"
						></div>
					{/if}
					{#if grade.screen}
						<div
							class="ov scr"
							style:background="linear-gradient({angle}deg, {grade.screen}, transparent)"
						></div>
					{/if}
					{#if warmth}
						<div
							class="ov wb"
							style:background={warmth > 0 ? '#ffa457' : '#4f9bff'}
							style:opacity={Math.min(Math.abs(warmth), 1) * 0.6}
						></div>
					{/if}
				{/if}
				{#if lens?.vignette}
					<div class="ov vig" style:--v={lens.vignette}></div>
				{/if}
				{#if composite?.glass}
					<div class="ov sheet"></div>
				{/if}
			</div>
		</div>
	</div>

	{#if optics}
		<svg class="defs" aria-hidden="true" focusable="false">
			<filter
				{id}
				x="-4%"
				y="{-4 - head}%"
				width="108%"
				height="{108 + head}%"
				color-interpolation-filters="sRGB"
			>
				{#if lens?.aberration}
					<feColorMatrix
						in="SourceGraphic"
						type="matrix"
						values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
						result="r"
					/>
					<feOffset in="r" dx={lens.aberration} result="rs" />
					<feColorMatrix
						in="SourceGraphic"
						type="matrix"
						values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
						result="g"
					/>
					<feColorMatrix
						in="SourceGraphic"
						type="matrix"
						values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
						result="b"
					/>
					<feOffset in="b" dx={-lens.aberration} result="bs" />
					<feBlend in="rs" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="bs" mode="screen" result="img" />
				{:else}
					<feOffset in="SourceGraphic" dx="0" result="img" />
				{/if}
				{#if lens?.grain}
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" result="n" />
					<feColorMatrix in="n" type="saturate" values="0" result="mono" />
					<feComponentTransfer in="mono" result="grain">
						<feFuncA type="linear" slope={lens.grain} intercept="0" />
					</feComponentTransfer>
					<feComposite in="grain" in2="img" operator="in" result="inside" />
					<feBlend in="img" in2="inside" mode="overlay" />
				{/if}
			</filter>
		</svg>
	{/if}

	<p class="sr" aria-live="polite">{mirror}</p>
</div>

<style>
	.shell {
		position: relative;
		width: 100%;
		/* the drums are taller than they are wide, and they stand apart enough that
		   a blank board still reads as a row of separate slats */
		--ch: calc(var(--cw) / var(--sf-aspect, 0.62));
		--gap: calc(var(--cw) * 0.09);
		--colgap: calc(var(--cw) * 0.55);
		--r: calc(var(--ch) * 0.05);
		/* Solari flaps were screen-printed in a condensed grotesque. The repo's
		   pixel mono reads as a seven-segment display, which is the wrong machine. */
		--face: 'Arial Narrow', 'Helvetica Neue', Helvetica, Arial, sans-serif;
		--glyph: var(--fit-glyph, var(--sf-glyph, 1.1));
		--squeeze: var(--fit-squeeze, var(--sf-squeeze, 0.7));
		/* glyph sits a touch high in the em box; nudge so the seam bisects it */
		--gy: calc(var(--ch) * var(--sf-gy, -0.013));
	}
	.shell {
		/* Each tone is a variant default behind an --sf-* override, so a variant
		   can restyle the machine and an ancestor can still overrule it. */
		--flap-d: linear-gradient(180deg, #37452a 0%, #131a0d 47%, #2b3820 53%, #090d05 100%);
		--face-mid-d: #131a0d;
		/* never paper white: aged screen-print, slightly warm, slightly grey */
		--ink-d: #fbf7ee;
		--bleed-d: rgb(255 250 228 / 0.34);
		--seam-d: rgb(0 0 0 / 0.9);
		--bezel-d: linear-gradient(180deg, #14171d, #090b0e);
		--rod-d: #767d86;
		--grain-d: 0.06;

		--flap: var(--sf-face, var(--flap-d));
		/* the canvas painter cannot read a gradient; it takes the mid tone */
		--face-mid: var(--sf-face-mid, var(--face-mid-d));
		--ink: var(--sf-ink, var(--ink-d));
		--bleed: var(--sf-bleed, var(--bleed-d));
		--seam: var(--seam-d);
		--bezel: var(--bezel-d);
		--rod: var(--rod-d);
		--grain: var(--sf-grain, var(--grain-d));
	}

	/* Clean, on a dark ground: drums a shade above the scrim so the block reads
	   without a case, and the bleed carries a warm accent rather than white. */
	.night {
		--ao: 0.42;
		--light: 0.055;
		--lip: rgb(255 255 255 / 0.06);
		--flap-d: linear-gradient(180deg, #2b3032 0%, #15191b 47%, #212628 53%, #0d1012 100%);
		--face-mid-d: #15191b;
		--ink-d: #f2f4ec;
		--bleed-d: rgb(240 212 137 / 0.16);
		--seam-d: rgb(0 0 0 / 0.75);
		--bezel-d: transparent;
		--rod-d: #5a6468;
		--grain-d: 0.04;
		--pad: var(--sf-pad, 0);
	}
	.night .board {
		border-radius: calc(var(--ch) * 0.05);
		box-shadow:
			0 2px 5px rgb(0 0 0 / 0.5),
			0 22px 48px rgb(0 0 0 / 0.4);
	}

	/* Clean: pine drums on timetable stock, no scuff, no ink bleed. For pages
	   rather than photographs — it is meant to look printed, not salvaged. */
	.plain {
		--ao: 0.3;
		--light: 0.05;
		--lip: rgb(255 255 255 / 0.07);
		--flap-d: linear-gradient(180deg, #1e3b35 0%, #0e2621 47%, #17302a 53%, #081714 100%);
		--face-mid-d: #0e2621;
		--ink-d: #f2f3ee;
		--bleed-d: transparent;
		--seam-d: rgb(0 0 0 / 0.55);
		--bezel-d: #0a1815;
		--rod-d: #3d5751;
		--grain-d: 0;
		--pad: var(--sf-pad, 0.5);
	}
	.cased {
		--pad: var(--sf-pad, 0.7);
	}
	.plain .board {
		border-radius: calc(var(--ch) * 0.08);
		box-shadow:
			0 1px 2px rgb(23 33 29 / 0.16),
			0 10px 26px rgb(23 33 29 / 0.12),
			0 34px 70px rgb(23 33 29 / 0.07);
	}
	/* no case: the drums stand on whatever is behind them, unless --sf-bg says
	   otherwise — a solid backing is the difference between a board hanging in a
	   frame and one floating in mid air */
	.bare {
		--pad: var(--sf-pad, 0);
	}
	.bare {
		--ao: 0;
		--light: 0;
		--lip: transparent;
	}
	.bare .board {
		background: var(--sf-bg, none);
		border-radius: calc(var(--ch) * 0.05);
		box-shadow: none;
	}

	.optics {
		/* the fixture hangs off the top of this box, so it has to be the one that
		   positions it — a filter alone only does that while a filter is set */
		position: relative;
	}
	/* the sign sits above the flaps without joining their grid: the board's own
	   height still drives the pin, so adding one does not move the board */
	/* Every one of these percentages resolves against this box, which is the
	   board: left and width against its width, bottom and height against its
	   height. That is the whole positioning model. */
	.fixture {
		position: absolute;
		bottom: calc(100% + var(--sign-y));
		left: var(--sign-x);
		width: var(--sign-w);
		height: var(--sign-h);
	}
	.root {
		transform-origin: 0 0;
		/* The composite stage switches pointer events off across the whole photo,
		   so that the board's untransformed box — which sits in the top corner of
		   the picture with nothing drawn in it — cannot swallow the photograph.
		   This claims them back for the one element that is hit where it is seen. */
		pointer-events: auto;
	}
	.board {
		position: relative;
		display: grid;
		gap: calc(var(--ch) * var(--sf-rowgap, 0.09));
		padding: calc(var(--cw) * var(--pad));
		border-radius: calc(var(--ch) * 0.14);
		background: var(--sf-bg, var(--bezel));
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.06),
			var(--shadow-lg);
		overflow: hidden;
	}
	/* The drums sit in a routed channel, so the case has an inner wall that
	   catches light at the top and drops it into shadow at the bottom. */
	.board::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 0;
		border-radius: inherit;
		pointer-events: none;
		box-shadow:
			inset 0 calc(var(--ch) * 0.05) calc(var(--ch) * 0.13) rgb(0 0 0 / var(--ao, 0.34)),
			inset 0 calc(var(--ch) * -0.03) calc(var(--ch) * 0.09) rgb(0 0 0 / var(--ao, 0.34)),
			inset 0 1px 0 var(--lip, rgb(255 255 255 / 0.05));
	}
	/* one raking light across the whole face, so the far end sits back a little */
	.board::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 3;
		border-radius: inherit;
		pointer-events: none;
		background: linear-gradient(
			var(--light-angle, 168deg),
			rgb(255 255 255 / var(--light, 0.045)) 0%,
			rgb(255 255 255 / 0) 38%,
			rgb(0 0 0 / calc(var(--light, 0.045) * 1.6)) 100%
		);
		mix-blend-mode: soft-light;
	}
	.row,
	.labels {
		position: relative;
		z-index: 1;
	}
	.surface {
		display: block;
	}
	.labels,
	.row {
		display: flex;
		gap: var(--colgap);
	}
	.label {
		width: calc(var(--cw) * var(--w) + var(--gap) * (var(--w) - 1));
		font-family: var(--font-mono);
		font-size: calc(var(--ch) * 0.26);
		letter-spacing: 0.08em;
		color: var(--color-muted);
		text-transform: uppercase;
		white-space: nowrap;
		overflow: hidden;
	}
	.col {
		display: flex;
		gap: var(--gap);
	}

	.cell {
		position: relative;
		width: var(--cw);
		height: var(--ch);
		perspective: calc(var(--ch) * 3.5);
		transform-style: preserve-3d;
		/* the drum is a solid object in a slot: dark either side, lit on top */
		box-shadow:
			calc(var(--cw) * -0.035) 0 calc(var(--cw) * 0.05) rgb(0 0 0 / 0.3),
			calc(var(--cw) * 0.035) 0 calc(var(--cw) * 0.05) rgb(0 0 0 / 0.3);
	}
	/* scuffed plastic: the face is not a clean gradient */
	.cell::before {
		content: '';
		position: absolute;
		z-index: 2;
		inset: 0;
		border-radius: var(--r);
		opacity: var(--grain);
		mix-blend-mode: overlay;
		pointer-events: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='90' height='90' filter='url(%23n)'/%3E%3C/svg%3E");
	}

	/* the axle the drum turns on, poking out at seam level */
	.cell::after {
		content: '';
		position: absolute;
		z-index: 4;
		top: 50%;
		left: calc(var(--cw) * -0.04);
		right: calc(var(--cw) * -0.04);
		height: max(0.5px, calc(var(--ch) * 0.035));
		transform: translateY(-50%);
		background: linear-gradient(90deg, var(--rod) 0 9%, transparent 9% 91%, var(--rod) 91%);
		opacity: 0.55;
		pointer-events: none;
	}

	.half,
	.leaf {
		position: absolute;
		left: 0;
		right: 0;
		height: 50%;
		overflow: hidden;
		background: var(--flap);
		background-size: 100% var(--ch);
		backface-visibility: hidden;
	}
	.top,
	.lt {
		top: 0;
		border-radius: var(--r) var(--r) 0 0;
		transform-origin: bottom;
		box-shadow: inset 0 max(0.5px, calc(var(--ch) * 0.01)) 0 rgb(255 255 255 / 0.07);
	}
	.bot,
	.lb {
		bottom: 0;
		background-position: 0 100%;
		border-radius: 0 0 var(--r) var(--r);
		transform-origin: top;
		box-shadow: inset 0 max(-0.5px, calc(var(--ch) * -0.012)) 0 rgb(0 0 0 / 0.35);
	}
	.leaf {
		visibility: hidden;
		will-change: transform, filter;
	}

	.half span,
	.leaf span {
		position: absolute;
		left: 0;
		width: 100%;
		height: var(--ch);
		line-height: var(--ch);
		font-family: var(--face);
		font-weight: 700;
		/* the glyph all but fills the flap, the way it does on the real thing */
		font-size: calc(var(--ch) * var(--glyph));
		letter-spacing: -0.02em;
		text-align: center;
		/* the press never laid down the same amount of ink twice */
		color: color-mix(in srgb, var(--ink) calc(var(--wear) * 100%), transparent);
		/* screen-print bleeds a hair past the edge of the glyph */
		text-shadow:
			0 0 calc(var(--ch) * 0.022) var(--bleed),
			0 max(0.5px, calc(var(--ch) * 0.012)) 0 rgb(0 0 0 / 0.3);
	}
	.top span,
	.lt span {
		top: var(--gy);
		transform: scaleX(var(--squeeze));
	}
	/* the bottom half is a separate piece of plastic: it never lines up perfectly */
	.bot span,
	.lb span {
		top: calc(var(--gy) - var(--ch) * 0.5);
		transform: translateX(var(--mis)) scaleX(var(--squeeze));
	}

	/* the seam itself, and the shadow the standing flap drops on the fallen one */
	.top::after,
	.lt::after {
		content: '';
		position: absolute;
		inset: auto 0 0 0;
		height: max(0.5px, calc(var(--ch) * 0.016));
		background: var(--seam);
	}
	.bot::before,
	.lb::before {
		content: '';
		position: absolute;
		inset: 0 0 auto 0;
		height: 12%;
		background: linear-gradient(180deg, rgb(0 0 0 / 0.5), transparent);
		pointer-events: none;
	}

	.ov {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.mul {
		mix-blend-mode: multiply;
	}
	.scr {
		mix-blend-mode: screen;
	}
	.wb {
		mix-blend-mode: color;
	}
	.sheet {
		background:
			linear-gradient(
				104deg,
				transparent 18%,
				rgb(255 255 255 / 0.028) 33%,
				rgb(255 255 255 / 0.055) 40%,
				rgb(255 255 255 / 0.012) 49%,
				transparent 63%
			),
			radial-gradient(130% 65% at 18% -14%, rgb(255 255 255 / 0.045), transparent 58%),
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='d'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23d)' opacity='0.35'/%3E%3C/svg%3E");
	}

	.defs {
		position: absolute;
		width: 0;
		height: 0;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
