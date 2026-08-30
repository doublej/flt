<script lang="ts">
import SplitFlapBoard, { type Column } from '$lib/components/SplitFlapBoard.svelte'
import { onMount } from 'svelte'
import { STATES, clock, startClock } from './demo.svelte'

onMount(() => startClock())

const HEADLINE = ['DEPARTURES', 'EVERY DATE', 'EVERY ROUTE', 'ONE REPORT']
const HEAD_COLS: Column[] = [{ id: 'w', width: 11 }]
const head = $derived([{ w: HEADLINE[clock.beat % HEADLINE.length] }])

const STAT_COLS: Column[] = [
  { id: 'k', label: 'Searches', width: 4, align: 'right' },
  { id: 'l', label: 'Cheapest', width: 7, align: 'right' },
  { id: 'm', label: 'Saved', width: 6, align: 'right' },
]
const STATS = [
  { k: '184', l: 'EUR 412', m: '-31%' },
  { k: '96', l: 'EUR 388', m: '-44%' },
  { k: '212', l: 'EUR 507', m: '-19%' },
]
const stat = $derived([STATS[clock.beat % STATS.length]])

const LABEL_COLS: Column[] = [{ id: 'v', width: 9 }]
const labels = $derived(
  ['ON TIME', 'GATE D22', STATES[clock.beat % STATES.length]].map((v) => [{ v }]),
)

const RAIL_COLS: Column[] = [{ id: 't', width: 42 }]
const RAIL = [
  'AMS NRT / AMS HND / AMS KIX / AMS FUK ... ',
  'BUREAU SEARCHES EVERY DATE IN THE BRIEF ... ',
  'PRICE BY DATE / RANKED OPTIONS / LINKS ... ',
]
const rail = $derived([{ t: RAIL[clock.beat % RAIL.length] }])
</script>

<svelte:head><title>Split-flap — scales</title></svelte:head>

<section>
	<h2>Large — a header</h2>
	<SplitFlapBoard rows={head} columns={HEAD_COLS} variant="plain" />
	<p>The <code>plain</code> variant: pine drums on timetable stock, for pages rather than photos.</p>
</section>

<section>
	<h2>Smaller — a stat line</h2>
	<div class="half"><SplitFlapBoard rows={stat} columns={STAT_COLS} variant="plain" /></div>
</section>

<section>
	<h2>Label</h2>
	<div class="chips">
		{#each labels as rows, i (i)}
			<div class="chip"><SplitFlapBoard {rows} columns={LABEL_COLS} variant="plain" /></div>
		{/each}
	</div>
	<p>Same component at 14 px cells. Every dimension is a ratio of the cell.</p>
</section>

<section>
	<h2>Decorative — a rail, no case</h2>
	<SplitFlapBoard rows={rail} columns={RAIL_COLS} variant="bare" />
	<p>The bare variant drops the case: the drums stand on the page itself.</p>
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
	}
	code {
		font-family: var(--font-mono);
		font-size: 0.85em;
	}
	.half {
		width: min(100%, 30rem);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.9rem;
	}
	.chip {
		width: 136px;
	}
</style>
