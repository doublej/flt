<script lang="ts">
import CompositeStage from '$lib/components/CompositeStage.svelte'
import type { Column, Point } from '$lib/components/SplitFlapBoard.svelte'
import { onMount } from 'svelte'
import { clock, departures, startClock } from '../demo.svelte'

onMount(() => startClock())

/* the hall board is a dense two-panel grid, so ours is denser than the counter's */
const COLS: Column[] = [
  { id: 'time', width: 5 },
  { id: 'flight', width: 7 },
  { id: 'to', width: 18 },
  { id: 'via', width: 10 },
  { id: 'gate', width: 4, align: 'right' },
  { id: 'status', width: 10 },
]
const rows = $derived(departures(clock.beat, 12))

/* the lit panel in the middle of the glass wall */
let corners = $state<Point[]>([
  { x: 0.361, y: 0.44 },
  { x: 0.649, y: 0.44 },
  { x: 0.649, y: 0.646 },
  { x: 0.361, y: 0.646 },
])

/* sampled off the photograph: field #07130e, ink #ffc95e, room #041a1c */
// `let`, not `const`: CompositeStage binds this back so its pane can write to it
let look = $state({
  renderer: 'canvas',
  exposure: 1.02,
  contrast: 1.22,
  warmth: 0.34,
  angle: 200,
  multiply: '#04141459',
  screen: '#ffb4542b',
  grain: 0.18,
  aberration: 0.2,
  vignette: 0.34,
  blur: 0.2,
  supersample: 2,
  glass: true,
  bg: '#00000000',
  pad: 0,
  face: '#0d1110',
  ink: '#ffc95e',
  aspect: 0.58,
  glyph: 1.12,
  squeeze: 0.66,
  baseline: -0.013,
  rowgap: 0.07,
  grit: 0.05,
  pins: false,
  /* JJ's tuning: the panel sits tight to the flaps with its spill off entirely,
     so the glow in the photograph behind it is the only light on the wall. */
  signFace: '#fedf8e',
  signLip: '#ffc34e',
  signFrame: '#974716',
  signInk: '#cc6707',
  signGlow: '#ff5a0f',
  signGlyph: 0.52,
  signLetter: 0,
  signBloom: 0.04,
  signUp: 0,
  signDown: 0,
  signIcon: false,
  signX: 0,
  signY: 0.0196,
  signW: 1,
  signH: 0.1656,
  signPad: 0.55,
  signTextY: 0.42,
})
</script>

<svelte:head><title>Split-flap — terminal hall</title></svelte:head>

<section>
	<h2>Terminal hall</h2>
	<p>
		An amber board across a dark glass wall — a much harder light to match than the counter. Ink,
		flap tone and the whole grade are sampled off the picture, then everything is yours to tune.
		The lit header above the flaps is drawn too, not photographed: its diffuser, its letters and
		the light it throws on the wall all came off the same pixels.
	</p>
	<CompositeStage
		src="/img/terminal.jpg"
		imageWidth={2000}
		imageHeight={853}
		ratio="2000 / 853"
		{rows}
		columns={COLS}
		bind:corners
		bind:look
		sign="Terminal 3 — all departures"
		editable
		storageKey="lab-terminal"
	/>
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
</style>
