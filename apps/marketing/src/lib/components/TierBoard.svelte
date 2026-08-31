<script lang="ts">
/** The three tiers on one board, seen close up and at an angle.
 *
 *  The rows are the control, not a picture of one: each is a real button, so
 *  choosing a tier here still drives the brief form. The board itself stays
 *  aria-hidden behind them, as it is everywhere else. */
import SplitFlapBoard, { type Column } from '$lib/components/SplitFlapBoard.svelte'
import { TIERS } from '$lib/tiers'

let { selected = $bindable('survey') }: { selected?: string } = $props()

const COLS: Column[] = [
  { id: 'tier', label: 'Tier', width: 9 },
  { id: 'fare', label: 'Price', width: 6, align: 'right' },
  { id: 'searches', label: 'Searches', width: 11, align: 'right' },
  { id: 'time', label: 'Time', width: 11 },
]

/* The flap set is 40 characters wide and a column is a fixed width, so the
   prose in tiers.ts cannot be shown as written — only the abbreviations live
   here. Price and name still come from the source, so there is one place to
   change what anything costs. */
const SHORT: Record<string, { searches: string; time: string }> = {
  enquiry: { searches: '1 SEARCH', time: 'UNDER 1 MIN' },
  flexible: { searches: '9 SEARCHES', time: '1-2 MIN' },
  survey: { searches: '26 SEARCHES', time: '3-5 MIN' },
}

const rows = TIERS.map((t) => ({
  tier: t.name.toUpperCase(),
  fare: `EUR ${t.price.replace('€', '')}`,
  ...SHORT[t.id],
}))

const scope = $derived(TIERS.find((t) => t.id === selected)?.scope ?? '')
</script>

<div class="scene">
	<div class="slab">
		<SplitFlapBoard {rows} columns={COLS} variant="night" />
		<!-- depth of field: the far end of the slab goes soft. Flat rather than
		     preserve-3d so the backdrop this blurs is well defined. -->
		<div class="dof" aria-hidden="true"></div>
		<div class="rows">
			{#each TIERS as tier (tier.id)}
				<button
					type="button"
					class:on={selected === tier.id}
					aria-pressed={selected === tier.id}
					onclick={() => {
						selected = tier.id
					}}
				>
					<span class="sr">
						{tier.name}, {tier.price}, {tier.searches}, {tier.time}. {tier.scope}
					</span>
				</button>
			{/each}
		</div>
	</div>
</div>

<p class="scope" aria-live="polite">{scope}</p>

<style>
	.scene {
		perspective: 1500px;
		perspective-origin: 26% 46%;
		margin-top: var(--space-5);
		/* the slab leans out of its box; let it */
		padding: 2.5rem 0 3.5rem;
	}
	.slab {
		position: relative;
		transform: rotateY(15deg) rotateX(5deg) scale(1.04);
		transform-origin: 30% 50%;
		filter: drop-shadow(0 2.4rem 3rem rgb(0 0 0 / 0.4));
	}
	.dof {
		position: absolute;
		inset: 0;
		pointer-events: none;
		backdrop-filter: blur(3.4px);
		/* sharp where the slab is nearest, soft where it recedes */
		mask-image: linear-gradient(96deg, transparent 34%, #000 100%);
	}
	.rows {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-rows: repeat(3, 1fr);
	}
	.rows button {
		border: 1px solid transparent;
		border-radius: 0.3rem;
		background: transparent;
		cursor: pointer;
		transition:
			background 0.2s ease,
			border-color 0.2s ease;
	}
	.rows button:hover {
		background: rgb(255 255 255 / 0.06);
	}
	.rows button.on {
		border-color: var(--color-primary);
		background: rgb(255 255 255 / 0.05);
		box-shadow: 0 0 28px var(--color-amber-glow);
	}
	.rows button:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
	.scope {
		color: var(--color-muted);
		max-width: var(--measure);
		margin-top: var(--space-2);
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	@media (prefers-reduced-motion: reduce) {
		.slab {
			transform: none;
		}
		.dof {
			display: none;
		}
	}
</style>
