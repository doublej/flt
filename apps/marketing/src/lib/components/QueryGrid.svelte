<script lang="ts">
import FlapText from '$lib/components/FlapText.svelte'
import { MANUAL_S, SCENARIOS, TOTALS, byHandHours } from '$lib/scenarios'

/** One square per search actually run. Each job's grid is its real shape:
 *  rows are what varied (departure airports, destinations, cabins) and columns
 *  are the departure dates, so rows x columns is exactly the search count. */
const nf = new Intl.NumberFormat('en-GB')
const hours = byHandHours(TOTALS.queries)
</script>

<div class="ledger">
  <div class="head">
    <span class="c-who"></span>
    <span>The brief</span>
    <span>Window</span>
    <span>Searches run</span>
    <span>Came back</span>
  </div>

  {#each SCENARIOS as s (s.id)}
    <article class="job">
      <img
        class="who"
        src="/img/people/{s.id}.webp"
        alt=""
        width="350"
        height="450"
        loading="lazy"
      />

      <div class="ask">
        <blockquote>{s.ask}</blockquote>
        <p class="route">{s.route}</p>
      </div>

      <div class="win"><FlapText text={s.window} size="0.5rem" /></div>

      <div class="work">
        <div class="grid" style:--cols={s.grid.cols}>
          {#each Array(s.queries) as _, i (i)}
            <span></span>
          {/each}
        </div>
        <p class="shape">
          <b>{s.queries}</b> — {s.grid.rows}
          {s.grid.rowKind} × {s.grid.cols}
          {s.grid.cols === 1 ? 'date' : 'dates'}
        </p>
      </div>

      <p class="got">
        {nf.format(s.options)} options<br />{s.seconds} seconds
      </p>
    </article>
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
  /* Four jobs as four ruled lines of one ledger, not four boxes. Reading down a
     column is the point: the search grids stack at the same x, so five squares
     against twenty-eight is the argument, made without a sentence. */
  .ledger {
    display: grid;
    grid-template-columns:
      4rem
      minmax(0, 1fr)
      auto
      calc(7 * 1.5rem + 6 * 3px)
      7.5rem;
    column-gap: var(--space-4);
    margin-top: var(--space-5);
    border-block: 1px solid var(--color-border);
  }
  .head,
  .job {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    align-items: start;
  }
  .head {
    padding-block: var(--space-2);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
  .job {
    padding-block: var(--space-3);
    border-top: 1px solid var(--color-border);
  }

  /* The face is the only organic thing in a row of grids and numerals, so it
     gets the format the subject already owns: 35x45mm, square-cut, ruled. */
  .who {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 35 / 45;
    object-fit: cover;
    border: 1px solid var(--color-border);
  }

  .ask {
    display: grid;
    gap: 0.5rem;
    align-content: start;
  }
  blockquote {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.05rem, 1.5vw, 1.3rem);
    line-height: 1.35;
    text-wrap: pretty;
  }
  blockquote::before {
    content: "“";
  }
  blockquote::after {
    content: "”";
  }
  .route {
    font-size: 0.82rem;
    line-height: 1.5;
    color: var(--color-muted);
  }

  .win {
    justify-self: start;
    margin-top: 0.2rem;
  }

  .work {
    display: grid;
    gap: var(--space-2);
    align-content: start;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1.5rem);
    gap: 3px;
    justify-content: start;
  }
  .grid span {
    aspect-ratio: 1;
    background: var(--color-primary);
    border-radius: 1px;
  }
  .shape {
    font-size: 0.8rem;
    line-height: 1.4;
    color: var(--color-muted);
  }
  .shape b {
    font-family: var(--font-mono);
    font-weight: 400;
    font-size: 0.95rem;
    color: var(--color-primary);
  }

  .got {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    line-height: 1.7;
    color: var(--color-muted);
  }

  /* Narrow: the ledger stops being a table. The face and the brief keep their
     line, everything the Bureau did drops underneath it. */
  @media (max-width: 900px) {
    .ledger {
      grid-template-columns: 3.5rem minmax(0, 1fr);
      column-gap: var(--space-3);
    }
    .head {
      display: none;
    }
    .job {
      row-gap: var(--space-3);
    }
    .win,
    .work,
    .got {
      grid-column: 2;
    }
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
