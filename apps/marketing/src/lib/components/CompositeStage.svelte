<script lang="ts">
import LightBox from '$lib/components/LightBox.svelte'
import SplitFlapBoard, { type Column, type Point } from '$lib/components/SplitFlapBoard.svelte'
import { SIGN, SIGN_ASPECT } from '$lib/lightbox-canvas'
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

let stage = $state<HTMLElement | null>(null)
let panel = $state<HTMLElement | null>(null)
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

/* render at supersample × the size it occupies; the homography scales it back
   down, so the lens filter and the defocus rasterise at that resolution */
const width = $derived(
  Math.max((corners[1].x - corners[0].x) * fit.dw * place.scale, 40) * n('supersample', 2),
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
  corners[dragPin] = { x: (b.x - fit.ox) / fit.dw, y: (b.y - fit.oy) / fit.dh }
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
const ui = $state({ saved: 'not saved' })
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
    .map((c) => `  { x: ${c.x.toFixed(4)}, y: ${c.y.toFixed(4)} },`)
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
    signIcon: SIGN.icon,
    signAspect: SIGN_ASPECT,
    signWidth: 1,
    signHeight: 0,
    signShift: 0,
    signGap: 1,
  }
  for (const [k, v] of Object.entries(fill)) if (!(k in look)) look[k] = v
}

onMount(() => {
  if (!editable) return
  let pane: { dispose(): void; refresh(): void } | null = null
  let cancelled = false

  if (sign) seedSign()

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

  import('tweakpane').then(({ Pane }) => {
    if (cancelled || !panel) return
    const p = new Pane({ container: panel, title: 'Composite' })
    pane = p

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
      await navigator.clipboard.writeText(asSource())
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
      lit.addBinding(look, 'signAspect', { min: 4, max: 60, step: 0.1, label: 'w : h' })
      lit.addBinding(look, 'signWidth', { min: 0.1, max: 1.5, step: 0.005, label: 'width' })
      lit.addBinding(look, 'signHeight', {
        min: 0,
        max: 6,
        step: 0.01,
        label: 'height (0 = w:h)',
      })
      lit.addBinding(look, 'signShift', { min: -0.5, max: 0.5, step: 0.005, label: 'shift across' })
      lit.addBinding(look, 'signGap', { min: -1, max: 4, step: 0.01, label: 'gap (cells)' })
      lit.addBinding(look, 'signPad', { min: 0, max: 3, step: 0.01, label: 'inner pad' })
      lit.addBinding(look, 'signTextY', { min: 0.1, max: 0.9, step: 0.005, label: 'text y' })
      lit.addBinding(look, 'signGlyph', { min: 0.2, max: 0.9, step: 0.01, label: 'cap height' })
      lit.addBinding(look, 'signLetter', { min: 0, max: 0.6, step: 0.01, label: 'tracking' })
      lit.addBinding(look, 'signBloom', { min: 0, max: 1.4, step: 0.01, label: 'light bleed' })
      lit.addBinding(look, 'signUp', { min: 0, max: 4, step: 0.05, label: 'spill up' })
      lit.addBinding(look, 'signDown', { min: 0, max: 4, step: 0.05, label: 'spill down' })
      lit.addBinding(look, 'signIcon', { label: 'pictogram' })
    }

    const put = p.addFolder({ title: 'Place' })
    put.addBinding(place, 'x', { min: -1400, max: 1400, step: 1 })
    put.addBinding(place, 'y', { min: -1400, max: 1400, step: 1 })
    put.addBinding(place, 'scale', { min: 0.1, max: 6, step: 0.01 })
    put.addBinding(place, 'rotate', { min: -45, max: 45, step: 0.1 })
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
  }
})
</script>

<div class="work">
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
			<img class="scene" {src} alt="" draggable="false" style:object-position={objectPosition} />
			<div class="pinned" style:width="{width}px">
				{#snippet lit()}
					<LightBox
						text={sign}
						aspect={n('signAspect', SIGN_ASPECT)}
						height={n('signHeight', 0) > 0
							? `calc(var(--ch) * ${n('signHeight', 0)})`
							: undefined}
						sign={SIGNSKIN}
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
					signGap={n('signGap', 1)}
					signWidth={n('signWidth', 1)}
					signShift={n('signShift', 0)}
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
	.panel {
		position: sticky;
		top: 1rem;
	}
	@media (max-width: 900px) {
		.work {
			grid-template-columns: 1fr;
		}
	}
</style>
