<script lang="ts">
import SplitFlapBoard, { type Column } from '$lib/components/SplitFlapBoard.svelte'

const COLS: Column[] = [{ id: 'a', width: 40 }]
let rows = $state<Record<string, string>[]>([])
let result = $state('')
let renderer = $state<'dom' | 'canvas'>('dom')

function reshuffle() {
  const pick = () => ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 37)]
  rows = Array.from({ length: 12 }, () => ({ a: Array.from({ length: 40 }, pick).join('') }))
  const gaps: number[] = []
  let last = performance.now()
  const stop = last + 2000
  const sample = (now: number) => {
    gaps.push(now - last)
    last = now
    if (now < stop) requestAnimationFrame(sample)
    else {
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length
      const worst = Math.max(...gaps.slice(1))
      result = `${renderer} — 480 cells, ${(1000 / avg).toFixed(0)} fps average, ${(1000 / worst).toFixed(0)} fps worst frame, ${gaps.length} frames`
    }
  }
  requestAnimationFrame(sample)
}
</script>

<svelte:head><title>Split-flap — frame budget</title></svelte:head>

<section>
	<h2>Frame budget</h2>
	<p>
		12 rows × 40 drums, every cell changing at once. One rAF drives every board on the page. Switch
		renderer and reshuffle again to compare the two on the same work.
	</p>
	<div class="row">
		<button onclick={reshuffle}>Reshuffle 480 cells</button>
		<label>
			<span>renderer</span>
			<select bind:value={renderer}>
				<option value="dom">dom</option>
				<option value="canvas">canvas</option>
			</select>
		</label>
	</div>
	{#if result}<p class="result">{result}</p>{/if}
	<SplitFlapBoard {rows} columns={COLS} {renderer} />
</section>

<style>
	section {
		display: grid;
		gap: 0.9rem;
		justify-items: stretch;
	}
	h2 {
		font-size: var(--text-h3);
	}
	p {
		color: var(--color-muted);
		font-size: 0.9rem;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--color-muted);
	}
	select {
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: 0.3rem 0.4rem;
		font-size: 0.8rem;
	}
	button {
		justify-self: start;
		background: var(--color-surface-raised);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: 0.5rem 0.9rem;
		font-size: 0.85rem;
	}
	.result {
		font-family: var(--font-mono);
		color: var(--color-primary);
	}
</style>
