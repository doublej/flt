<script lang="ts">
import { MANUAL_S, SCENARIOS, TOTALS, byHandHours } from '$lib/scenarios'

/** Four jobs, alternating sides. The search count is set as the item's numeral
 *  and sized off the count itself, so five searches and twenty-eight are told
 *  apart before either number is read. */
const nf = new Intl.NumberFormat('en-GB')
const hours = byHandHours(TOTALS.queries)
</script>

<div class="jobs">
  {#each SCENARIOS as s, i (s.id)}
    <article class="job" class:flip={i % 2 === 1} style:--n={s.queries}>
      <img
        class="who"
        src="/img/people/{s.id}.webp"
        alt=""
        width="720"
        height="900"
        loading="lazy"
      />

      <div class="body">
        <p class="when">{s.window}</p>
        <blockquote>{s.ask}</blockquote>
        <p class="route">{s.route}</p>

        <p class="tally">
          <b>{s.queries}</b>
          <span>
            searches — {s.grid.rows}
            {s.grid.rowKind} × {s.grid.cols}
            {s.grid.cols === 1 ? 'date' : 'dates'}
          </span>
        </p>
        <p class="sub">{nf.format(s.options)} options · {s.seconds} seconds</p>
      </div>
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
  .jobs {
    display: grid;
    gap: var(--space-6);
    margin-top: var(--space-5);
  }

  /* The photograph changes sides down the list so four jobs read as a sequence
     rather than four of the same thing. */
  .job {
    display: grid;
    grid-template-columns: 19rem minmax(0, 1fr);
    gap: var(--space-5);
    align-items: center;
  }
  .job.flip {
    grid-template-columns: minmax(0, 1fr) 19rem;
  }
  .who {
    grid-column: 1;
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 4 / 5;
    object-fit: cover;
    border-radius: var(--radius);
  }
  .body {
    grid-column: 2;
    display: grid;
    gap: var(--space-2);
    align-content: center;
    max-width: 34rem;
  }
  .flip .who {
    grid-column: 2;
  }
  .flip .body {
    grid-column: 1;
    justify-self: end;
  }

  .when {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
  blockquote {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.35rem, 2.2vw, 1.9rem);
    line-height: 1.28;
    text-wrap: pretty;
  }
  blockquote::before {
    content: "“";
  }
  blockquote::after {
    content: "”";
  }
  .route {
    font-size: 0.92rem;
    line-height: 1.5;
    color: var(--color-muted);
  }

  /* The numeral carries the work: its size comes off the search count, so the
     five-search job and the twenty-eight-search job are different weights on
     the page before you read either figure. */
  .tally {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    margin-top: var(--space-2);
  }
  .tally b {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: calc(2.4rem + var(--n) * 0.1rem);
    line-height: 0.85;
    color: var(--color-primary);
    font-variant-numeric: lining-nums tabular-nums;
  }
  .tally span {
    font-size: 0.92rem;
    line-height: 1.4;
    color: var(--color-muted);
    max-width: 14rem;
  }
  .sub {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--color-muted);
  }

  @media (max-width: 800px) {
    .jobs {
      gap: var(--space-5);
    }
    .job,
    .job.flip {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-3);
    }
    .who,
    .flip .who {
      grid-column: 1;
      grid-row: 1;
      width: 11rem;
    }
    .body,
    .flip .body {
      grid-column: 1;
      justify-self: start;
    }
  }

  .total {
    margin-top: var(--space-6);
    max-width: var(--measure);
    font-size: 0.95rem;
    color: var(--color-muted);
  }
  .total b {
    color: var(--color-text);
    font-weight: 500;
  }
</style>
