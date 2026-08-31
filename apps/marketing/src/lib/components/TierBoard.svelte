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

/* Blank slats above, below and between. A board with every row filled reads as
   a table; the empty ones are what make it read as a fixture with three
   departures on it. They are also what the row overlay counts against. */
const BLANK = {}
const rows = TIERS.flatMap((t) => [
  BLANK,
  { tier: t.name.toUpperCase(), fare: `EUR ${t.price.replace('€', '')}`, ...SHORT[t.id] },
]).concat(BLANK)

const current = $derived(TIERS.find((t) => t.id === selected))
</script>

<div class="scene">
	<div class="slab">
		<SplitFlapBoard {rows} columns={COLS} variant="night" renderer="canvas" />
		<!-- depth of field: the far end of the slab goes soft. Flat rather than
		     preserve-3d so the backdrop this blurs is well defined. -->
		<div class="dof" aria-hidden="true"></div>
		<div class="rows">
			{#each TIERS as tier, i (tier.id)}
				<button
					type="button"
					class:on={selected === tier.id}
					style:grid-row={i * 2 + 2}
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

<p class="scope" aria-live="polite">
	{current?.scope ?? ''}
	<span class="meta">{current?.searches} · {current?.time}</span>
</p>

<style>
	/* Full bleed and clipped: the slab is wider than the window and runs off the
	   right, so what you get is a fragment of a big fixture rather than a
	   diagram of a small one. Nothing is lost to the crop — the columns that go
	   under the edge are restated in the caption and in each row's label. */
	.scene {
		position: relative;
		width: 100vw;
		margin-left: calc(50% - 50vw);
		overflow: hidden;
		background: #000;
		padding: clamp(2.5rem, 6vw, 5rem) 0 clamp(3rem, 7vw, 6rem);
		perspective: 1600px;
		perspective-origin: 22% 46%;
		margin-top: var(--space-5);
	}
	.slab {
		position: relative;
		width: 132%;
		transform: rotateY(14deg) rotateX(4deg);
		transform-origin: 18% 50%;
		/* the drums carry no row gap here, so the overlay can sit on exact
		   fractions of the board without knowing a cell height */
		--sf-rowgap: 0;
		--sf-bg: #000;
		/* zero, so the overlay's seven equal rows land exactly on the seven slats.
		   The case padding is measured in cell widths and cannot be mirrored as a
		   percentage; on black there is nothing to see in it anyway. */
		--sf-pad: 0;
		filter: drop-shadow(0 3rem 4rem rgb(0 0 0 / 0.75));
	}
	.dof {
		position: absolute;
		inset: 0;
		pointer-events: none;
		backdrop-filter: blur(4px);
		/* sharp where the slab is nearest, soft where it recedes past the edge */
		mask-image: linear-gradient(96deg, transparent 30%, #000 96%);
	}
	.rows {
		position: absolute;
		inset: 0;
		display: grid;
		/* seven slats: a blank, then each tier, then a blank */
		grid-template-rows: repeat(7, 1fr);
	}
	.rows button {
		grid-column: 1;
		border: 1px solid transparent;
		background: transparent;
		cursor: pointer;
		transition:
			background 0.2s ease,
			border-color 0.2s ease;
	}
	.rows button:hover {
		background: rgb(255 255 255 / 0.07);
	}
	.rows button.on {
		border-color: var(--color-primary);
		background: rgb(255 255 255 / 0.06);
		box-shadow: 0 0 34px var(--color-amber-glow);
	}
	.rows button:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
	.scope {
		color: var(--color-muted);
		max-width: var(--measure);
		margin-top: var(--space-3);
	}
	.meta {
		display: block;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		margin-top: 0.35rem;
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
