<script lang="ts">
import SplitFlapBoard from '$lib/components/SplitFlapBoard.svelte'
import { onMount } from 'svelte'
import { COLUMNS, clock, departures, startClock } from '../demo.svelte'

onMount(() => startClock())
const rows = $derived(departures(clock.beat, 12))
</script>

<svelte:head><title>Split-flap — board</title></svelte:head>

<section>
	<h2>The board</h2>
	<SplitFlapBoard {rows} columns={COLUMNS} />
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
</style>
