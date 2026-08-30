<script lang="ts">
/** One simple horizontal bar per row. Value sets the length, display carries the
 *  number, hint carries the working. Colour is never the only encoding: every
 *  bar states its own value in text beside it. */
export type Bar = { label: string; value: number; display: string; hint?: string }

let { bars, unit = '' }: { bars: Bar[]; unit?: string } = $props()

const max = $derived(Math.max(...bars.map((b) => b.value), 1))
</script>

<ul class="bars">
	{#each bars as b}
		<li>
			<span class="label">{b.label}</span>
			<span class="track">
				<span class="fill" style:width="{Math.max((b.value / max) * 100, 0.6)}%"></span>
			</span>
			<span class="val">{b.display}</span>
			{#if b.hint}<span class="hint">{b.hint}</span>{/if}
		</li>
	{/each}
</ul>
{#if unit}<p class="unit">{unit}</p>{/if}

<style>
	.bars {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.9rem;
	}
	li {
		display: grid;
		grid-template-columns: minmax(9rem, 15rem) 1fr auto;
		grid-template-areas: 'label track val' 'hint hint hint';
		align-items: center;
		gap: 0.15rem 1rem;
	}
	.label {
		grid-area: label;
		font-size: 0.9rem;
	}
	.track {
		grid-area: track;
		height: 0.55rem;
		background: var(--color-surface-raised);
		border-radius: 2px;
		overflow: hidden;
	}
	.fill {
		display: block;
		height: 100%;
		background: var(--color-primary);
		box-shadow: 0 0 14px var(--color-amber-glow);
	}
	.val {
		grid-area: val;
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-size: 0.95rem;
		color: var(--color-primary);
	}
	.hint {
		grid-area: hint;
		font-size: 0.78rem;
		color: var(--color-muted);
	}
	.unit {
		margin-top: 1.1rem;
		font-size: 0.78rem;
		color: var(--color-muted);
	}
	@media (max-width: 640px) {
		li {
			grid-template-columns: 1fr auto;
			grid-template-areas: 'label val' 'track track' 'hint hint';
			gap: 0.3rem 1rem;
		}
	}
</style>
