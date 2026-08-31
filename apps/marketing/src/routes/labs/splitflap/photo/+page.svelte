<script lang="ts">
import CompositeStage from '$lib/components/CompositeStage.svelte'
import type { Column, Point } from '$lib/components/SplitFlapBoard.svelte'
import { onMount } from 'svelte'
import { clock, departures, startClock } from '../demo.svelte'

onMount(() => startClock())

const COLS: Column[] = [
  { id: 'time', width: 5 },
  { id: 'flight', width: 6 },
  { id: 'to', width: 18 },
  { id: 'gate', width: 3, align: 'right' },
  { id: 'status', width: 10 },
]
const rows = $derived(departures(clock.beat, 10))

/* the right-hand recess; the board to its left is the one in the picture */
let corners = $state<Point[]>([
  { x: 0.5155, y: 0.1875 },
  { x: 0.7965, y: 0.1845 },
  { x: 0.7965, y: 0.3245 },
  { x: 0.5155, y: 0.3275 },
])

/* sampled off the photograph: flap face #0e1409, median #2d3b23, ink #f7f2ea */
const look = $state({
  renderer: 'canvas',
  exposure: 0.98,
  contrast: 1.18,
  warmth: 0.1,
  angle: 190,
  multiply: '#101a0b66',
  screen: '#e8f0c81f',
  grain: 0.22,
  aberration: 0.15,
  vignette: 0.3,
  blur: 0.15,
  supersample: 2,
  glass: true,
  bg: '#00000000',
  pad: 0,
  face: '#131a0d',
  ink: '#fbf7ee',
  aspect: 0.62,
  glyph: 1.1,
  squeeze: 0.7,
  baseline: -0.013,
  rowgap: 0.09,
  grit: 0.06,
  pins: true,
})
</script>

<svelte:head><title>Split-flap — night counter</title></svelte:head>

<section>
	<h2>Night counter</h2>
	<p>
		Ours is in the right-hand recess; the board beside it is the one in the photograph. Drag the
		board to move it, shift-drag to size it, drag a pin to re-solve the homography. Drag the
		background to pan the picture, scroll to zoom.
	</p>
	<CompositeStage
		src="/img/counter.jpg"
		imageWidth={1999}
		imageHeight={1333}
		ratio="1999 / 1333"
		{rows}
		columns={COLS}
		bind:corners
		{look}
		editable
		storageKey="lab-counter"
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
