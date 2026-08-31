<script lang="ts">
import SplitFlapBoard from '$lib/components/SplitFlapBoard.svelte'
import { fitType } from '$lib/splitflap'
import { widestFlap } from '$lib/splitflap-canvas'
import { loadTuning, saveTuning } from '$lib/tuning'
import { onMount } from 'svelte'
import { COLUMNS, clock, departures, startClock } from '../demo.svelte'

const KEY = 'splitflap:lab-board'

type Style = Record<string, string | number>

const style: Style = $state({
  variant: 'plain',
  renderer: 'dom',
  rows: 12,
  flapMs: 62,
  face: '#0e2621',
  ink: '#f2f3ee',
  bg: '#00000000',
  pad: 0.5,
  aspect: 0.62,
  glyph: 1.1,
  squeeze: 0.7,
  baseline: -0.013,
  rowgap: 0.09,
  grit: 0,
})

const rows = $derived(departures(clock.beat, style.rows as number))

/* the canvas painter and the width budget only re-read on this changing */
const skinKey = $derived(Object.values(style).join('|'))

/** One picker gives the flap's mid tone; the flap still needs its shading. */
function shade(hex: string, k: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)))
  return `rgb(${c((n >> 16) & 255)} ${c((n >> 8) & 255)} ${c(n & 255)})`
}
const faceCss = $derived.by(() => {
  const f = style.face as string
  return `linear-gradient(180deg, ${shade(f, 2.7)} 0%, ${f} 47%, ${shade(f, 2.1)} 53%, ${shade(f, 0.6)} 100%)`
})

/* --- does the widest glyph actually fit the flap? -------------------------
   A glyph fits iff glyph x squeeze x advance <= aspect. The board clamps an
   overflow rather than letting type run off the flap, so what this reports is
   what will be drawn: the same fitType the board itself calls, against the
   widest advance in the face that actually resolved. */
const STACK = "'Arial Narrow', 'Helvetica Neue', Helvetica, Arial, sans-serif"
let advance = $state(0.774)
const fit = $derived.by(() => {
  const glyph = style.glyph as number
  const squeeze = style.squeeze as number
  const aspect = style.aspect as number
  const needs = glyph * squeeze * advance
  const drawn = fitType(glyph, squeeze, aspect, advance)
  return {
    verdict: drawn.clamped
      ? `asked ${needs.toFixed(3)}, flap is ${aspect}, clamped`
      : `fits, ${((1 - needs / aspect) * 100).toFixed(0)}% spare`,
    drawn: `glyph ${drawn.glyph.toFixed(3)} x squeeze ${drawn.squeeze.toFixed(3)}`,
    maxSqueeze: aspect / (glyph * advance),
    maxGlyph: aspect / (squeeze * advance),
    minAspect: needs,
  }
})
const readout = $derived({
  widest: fit.verdict,
  drawn: fit.drawn,
  'max squeeze': fit.maxSqueeze.toFixed(4),
  'max glyph': fit.maxGlyph.toFixed(4),
  'min aspect': fit.minAspect.toFixed(4),
})

function asSource() {
  const body = Object.entries($state.snapshot(style))
    .map(([k, v]) => `  ${k}: ${typeof v === 'string' ? `'${v}'` : v},`)
    .join('\n')
  return `const style = $state({\n${body}\n})\n`
}

let panel = $state<HTMLElement | null>(null)
/* set once the page's declared defaults are known; gates the auto-save */
let baseline = $state<Style | null>(null)
const ui = $state({ saved: 'not saved' })

/* saved continuously rather than on a button, so an hmr reload costs nothing */
let saveTimer = 0
$effect(() => {
  if (!baseline) return
  const data = $state.snapshot(style)
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTuning(KEY, baseline, data)
    ui.saved = `saved ${new Date().toLocaleTimeString()}`
  }, 400)
  return () => clearTimeout(saveTimer)
})

onMount(() => {
  const stopClock = startClock()
  let pane: { dispose(): void; refresh(): void } | null = null
  let cancelled = false

  advance = widestFlap(STACK)

  const defaults: Style = JSON.parse(JSON.stringify($state.snapshot(style)))
  const restored = loadTuning<Style>(KEY, defaults)
  if (restored.value) {
    for (const [k, v] of Object.entries(restored.value)) {
      if (k in style) style[k] = v
    }
    ui.saved = 'restored'
  } else if (restored.stale) {
    ui.saved = 'defaults changed, save dropped'
  }
  baseline = defaults

  import('tweakpane').then(({ Pane }) => {
    if (cancelled || !panel) return
    const p = new Pane({ container: panel, title: 'Board style' })
    pane = p

    const look = p.addFolder({ title: 'Look' })
    look.addBinding(style, 'variant', {
      options: { plain: 'plain', night: 'night', cased: 'cased', bare: 'bare' },
    })
    look.addBinding(style, 'renderer', { options: { dom: 'dom', canvas: 'canvas' } })
    look.addBinding(style, 'face', { view: 'color' })
    look.addBinding(style, 'ink', { view: 'color' })
    look.addBinding(style, 'bg', { view: 'color', color: { alpha: true }, label: 'backing' })
    look.addBinding(style, 'pad', { min: 0, max: 3, step: 0.05, label: 'backing inset' })
    look.addBinding(style, 'grit', { min: 0, max: 0.3, step: 0.005 })

    const type = p.addFolder({ title: 'Drum and type' })
    type.addBinding(style, 'aspect', { min: 0.4, max: 1.1, step: 0.005 })
    type.addBinding(style, 'glyph', { min: 0.6, max: 1.4, step: 0.01 })
    type.addBinding(style, 'squeeze', { min: 0.4, max: 1.1, step: 0.01 })
    type.addBinding(style, 'baseline', { min: -0.1, max: 0.1, step: 0.001 })
    type.addBinding(style, 'rowgap', { min: 0, max: 0.4, step: 0.005 })

    // live clipping check, so narrow flaps stop failing silently
    const check = p.addFolder({ title: 'Glyph fit' })
    check.addBinding(readout, 'widest', { readonly: true })
    check.addBinding(readout, 'drawn', { readonly: true })
    check.addBinding(readout, 'max squeeze', { readonly: true })
    check.addBinding(readout, 'max glyph', { readonly: true })
    check.addBinding(readout, 'min aspect', { readonly: true })

    const board = p.addFolder({ title: 'Board' })
    board.addBinding(style, 'rows', { min: 1, max: 14, step: 1 })
    board.addBinding(style, 'flapMs', { min: 30, max: 160, step: 1 })

    const keep = p.addFolder({ title: 'Save' })
    keep.addBinding(ui, 'saved', { readonly: true })
    keep.addButton({ title: 'Copy as code' }).on('click', () => {
      navigator.clipboard.writeText(asSource())
    })
    keep.addButton({ title: 'Reset to defaults' }).on('click', () => {
      for (const [k, v] of Object.entries(defaults)) style[k] = v
      p.refresh()
      ui.saved = 'reset'
    })
  })

  return () => {
    cancelled = true
    pane?.dispose()
    stopClock()
  }
})
</script>

<svelte:head><title>Split-flap: board</title></svelte:head>

<section>
	<h2>The board</h2>
	<div class="work">
		<div
			class="stage"
			style:--sf-face={faceCss}
			style:--sf-face-mid={style.face}
			style:--sf-ink={style.ink}
			style:--sf-bg={style.bg}
			style:--sf-pad={style.pad}
			style:--sf-aspect={style.aspect}
			style:--sf-glyph={style.glyph}
			style:--sf-squeeze={style.squeeze}
			style:--sf-gy={style.baseline}
			style:--sf-rowgap={style.rowgap}
			style:--sf-grain={style.grit}
		>
			<SplitFlapBoard
				{rows}
				columns={COLUMNS}
				variant={style.variant as 'cased' | 'bare' | 'plain' | 'night'}
				renderer={style.renderer as 'dom' | 'canvas'}
				flapMs={style.flapMs as number}
				{skinKey}
			/>
		</div>
		<div class="panel" bind:this={panel}></div>
	</div>
	<p>
		Reshuffles every five seconds. Only the drums whose character changed move, every one of them
		leaves on the same frame, and the cascade falls out of the distances rather than a delay.
	</p>
</section>

<style>
	section {
		display: grid;
		gap: 0.9rem;
	}
	h2 {
		font-size: var(--text-h3);
	}
	p {
		color: var(--color-muted);
		font-size: 0.9rem;
		max-width: var(--measure);
	}
	.work {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 17rem;
		align-items: start;
		gap: 1.2rem;
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
