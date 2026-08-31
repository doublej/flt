<script lang="ts">
import { MANUAL_S, SCENARIOS, TOTALS, byHandHours } from '$lib/scenarios'

/** One square per search actually run. Each job's grid is its real shape:
 *  rows are what varied (departure airports, destinations, cabins) and columns
 *  are the departure dates, so rows x columns is exactly the search count. */
const nf = new Intl.NumberFormat('en-GB')
const hours = byHandHours(TOTALS.queries)
</script>

<div class="jobs">
  {#each SCENARIOS as s (s.id)}
    <figure>
      <blockquote>{s.ask}</blockquote>
      <p class="route">{s.route}</p>
      <p class="win flap-cell">{s.window}</p>

      <div class="grid" style:--cols={s.grid.cols}>
        {#each Array(s.queries) as _, i (i)}
          <span></span>
        {/each}
      </div>

      <p class="count">
        <b>{s.queries}</b> searches — {s.grid.rows}
        {s.grid.rowKind} × {s.grid.cols}
        {s.grid.cols === 1 ? 'date' : 'dates'}
      </p>
      <p class="sub">{nf.format(s.options)} options · {s.seconds} seconds</p>
    </figure>
  {/each}
</div>

<p class="total">
  <b>{TOTALS.queries} searches</b> in {TOTALS.searchingSeconds} seconds of actual searching, which
  returned {nf.format(TOTALS.options)} options across {TOTALS.carriers} airlines. Run by hand at a
  generous {MANUAL_S} seconds each (type the route, wait for it, scan the results, write the price
  down) the same {TOTALS.queries} searches take about {hours.toFixed(1)} hours. That estimate is
  the only number on this page we did not measure.
</p>

<style>
  .jobs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: var(--space-4);
    margin-top: var(--space-5);
  }
  figure {
    margin: 0;
    display: grid;
    align-content: start;
    gap: 0.35rem;
    padding: var(--space-3);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }
  blockquote {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.05rem;
    line-height: 1.3;
    text-wrap: pretty;
  }
  blockquote::before {
    content: "“";
  }
  blockquote::after {
    content: "”";
  }
  .route {
    margin-top: 0.35rem;
    font-size: 0.8rem;
    color: var(--color-muted);
  }
  .win {
    justify-self: start;
    font-size: 0.7rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 3px;
    margin: var(--space-3) 0 var(--space-2);
    width: min(100%, calc(var(--cols) * 1.5rem));
  }
  .grid span {
    aspect-ratio: 1;
    background: var(--color-primary);
    border-radius: 1px;
  }

  .count {
    font-size: 0.85rem;
  }
  .count b {
    font-family: var(--font-mono);
    font-weight: 400;
    color: var(--color-primary);
  }
  .sub {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--color-muted);
  }

  .total {
    margin-top: var(--space-5);
    max-width: var(--measure);
    font-size: 0.95rem;
    color: var(--color-muted);
  }
  .total b {
    color: var(--color-text);
    font-weight: 500;
  }
</style>
