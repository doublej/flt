<script lang="ts">
import { MANUAL_S, SCENARIOS, TOTALS, byHandHours } from '$lib/scenarios'

let open = $state(SCENARIOS[0].id)

const nf = new Intl.NumberFormat('en-GB')
const hours = byHandHours(TOTALS.queries)
</script>

<div class="totals">
	<div><span class="num">{TOTALS.queries}</span><span class="cap">searches run</span></div>
	<div><span class="num">{nf.format(TOTALS.options)}</span><span class="cap">options read</span></div>
	<div><span class="num">{TOTALS.routes}</span><span class="cap">routes</span></div>
	<div><span class="num">{TOTALS.days}</span><span class="cap">departure days</span></div>
	<div><span class="num">{TOTALS.carriers}</span><span class="cap">airlines</span></div>
	<div><span class="num">{Math.round(TOTALS.searchingSeconds / 60)}<i>min</i></span><span class="cap">spent searching</span></div>
</div>

<p class="against measure">
	The same {TOTALS.queries} searches by hand, at {MANUAL_S} seconds each — type the route, wait, scan,
	write the price down — is <strong>{hours.toFixed(1)} hours</strong>. That is the honest comparison,
	and it is also the wrong one: nobody sits down and does {TOTALS.queries} searches. The point is not
	that the Bureau is faster at the job you were doing. It is that it does the version you were never
	actually going to do.
</p>

<ul class="jobs">
	{#each SCENARIOS as s}
		{@const isOpen = open === s.id}
		<li class:open={isOpen}>
			<button type="button" aria-expanded={isOpen} onclick={() => (open = isOpen ? '' : s.id)}>
				<span class="ask">“{s.ask}”</span>
				<span class="meta">
					<span class="q">{s.queries} searches</span>
					<span class="t">{s.seconds}s</span>
				</span>
			</button>
			{#if isOpen}
				<div class="detail">
					<dl>
						<div><dt>Routes</dt><dd>{s.route}</dd></div>
						<div><dt>Window</dt><dd>{s.window}</dd></div>
						<div><dt>Options read</dt><dd>{nf.format(s.options)}</dd></div>
						<div><dt>Airlines seen</dt><dd>{s.carriers}</dd></div>
						<div>
							<dt>Cheapest to dearest</dt>
							<dd>€{nf.format(s.priceLow)} — €{nf.format(s.priceHigh)}</dd>
						</div>
					</dl>
				</div>
			{/if}
		</li>
	{/each}
</ul>

<p class="prov">
	Real runs, not projections. Counts come from the engine's own search log and result cache after the
	fact. Every search here was one-way, so every price is a one-way fare — the cheapest we saw at the
	time, not a quote. The four jobs took {TOTALS.searchingSeconds} seconds of searching between them,
	and {TOTALS.seconds} seconds from the first search to the last, the difference being me deciding
	what to run next.
</p>

<style>
	.totals {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: 1.75rem 1rem;
		margin-block: 2.5rem 2rem;
	}
	.totals div {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.num {
		font-family: var(--font-mono);
		font-size: clamp(2rem, 4.5vw, 3rem);
		line-height: 1;
		color: var(--color-primary);
		text-shadow: 0 0 24px var(--color-amber-glow);
		font-variant-numeric: tabular-nums;
	}
	.num i {
		font-style: normal;
		font-size: 0.4em;
		margin-left: 0.15em;
		color: var(--color-muted);
		text-shadow: none;
	}
	.cap {
		font-size: 0.82rem;
		color: var(--color-muted);
		text-wrap: balance;
	}

	.against {
		color: var(--color-muted);
		margin-block: 0 2.5rem;
	}
	.against strong {
		color: var(--color-text);
		font-weight: 500;
	}

	.jobs {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--color-border);
	}
	.jobs li {
		border-bottom: 1px solid var(--color-border);
	}
	button {
		width: 100%;
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 1.15rem 0;
		background: none;
		border: 0;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	button:hover .ask,
	.open .ask {
		color: var(--color-text);
	}
	.ask {
		color: var(--color-muted);
		transition: color 0.18s ease;
	}
	.meta {
		display: flex;
		gap: 1rem;
		flex-shrink: 0;
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
	}
	.q {
		color: var(--color-text);
	}
	.t {
		color: var(--color-primary);
	}

	.detail {
		padding-bottom: 1.4rem;
	}
	dl {
		margin: 0;
		display: grid;
		gap: 0.55rem;
	}
	dl div {
		display: grid;
		grid-template-columns: 11rem 1fr;
		gap: 1rem;
		align-items: baseline;
	}
	dt {
		font-size: 0.78rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-muted);
	}
	dd {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		font-variant-numeric: tabular-nums;
	}

	.prov {
		margin-top: 2rem;
		font-size: 0.82rem;
		color: var(--color-muted);
		max-width: var(--measure);
	}

	@media (max-width: 640px) {
		button {
			flex-direction: column;
			gap: 0.5rem;
		}
		dl div {
			grid-template-columns: 1fr;
			gap: 0.15rem;
		}
	}
</style>
