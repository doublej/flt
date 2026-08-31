<script lang="ts">
import { MANUAL_S, SCENARIOS, TOTALS, byHandHours } from '$lib/scenarios'

/** Four jobs, alternating sides. The search count is set as the item's numeral
 *  and sized off the count itself, so five searches and twenty-eight are told
 *  apart before either number is read. */
const nf = new Intl.NumberFormat('en-GB')
const hours = byHandHours(TOTALS.queries)

/** No two photographs are the same size or proportion, and each sits at its
 *  own angle, the way prints do when they have been put down on a desk rather
 *  than mounted. Proportion follows the job behind it: five airports on one
 *  date is a tall narrow search, two cabins across a week is a wide one. The
 *  crops are composed at these ratios in the source files rather than squeezed
 *  from one master, so no one is cut through the chin to make a shape. */
const SHAPE = {
  gateway: { ar: '2 / 3', w: '17rem', rot: '-1.6deg', iw: 640, ih: 960 },
  ski: { ar: '1 / 1', w: '21rem', rot: '1.1deg', iw: 800, ih: 800 },
  cabin: { ar: '5 / 4', w: '24rem', rot: '-0.7deg', iw: 900, ih: 720 },
  holidays: { ar: '4 / 5', w: '19rem', rot: '1.9deg', iw: 720, ih: 900 },
} as const
const FALLBACK = { ar: '4 / 5', w: '19rem', rot: '0deg', iw: 720, ih: 900 }
const shapeOf = (id: string) => SHAPE[id as keyof typeof SHAPE] ?? FALLBACK
</script>

<div class="jobs">
  {#each SCENARIOS as s, i (s.id)}
    {@const sh = shapeOf(s.id)}
    <article
      class="job"
      class:flip={i % 2 === 1}
      style:--n={s.queries}
      style:--ar={sh.ar}
      style:--w={sh.w}
      style:--rot={sh.rot}
    >
      <img
        class="who"
        src="/img/people/{s.id}.webp"
        alt=""
        width={sh.iw}
        height={sh.ih}
        loading="lazy"
      />

      <div class="body">
        <p class="when">{s.window}</p>
        <blockquote>{s.ask}</blockquote>
        <p class="route">{s.route}</p>

        <div class="tally">
          <p class="count">
            <b>{s.queries}</b>
            <span>searches</span>
          </p>
          <div class="of">
            <p class="shape">
              {s.grid.rows}
              {s.grid.rowKind} × {s.grid.cols}
              {s.grid.cols === 1 ? 'date' : 'dates'}
            </p>
            <p class="sub">{nf.format(s.options)} options · {s.seconds} seconds</p>
          </div>
        </div>
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
    grid-template-columns: var(--w) minmax(0, 1fr);
    gap: var(--space-5);
    align-items: center;
  }
  .job.flip {
    grid-template-columns: minmax(0, 1fr) var(--w);
  }
  .who {
    grid-column: 1;
    grid-row: 1;
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: var(--ar);
    object-fit: cover;
    object-position: 50% 42%;
    border-radius: var(--radius);
    rotate: var(--rot);
    box-shadow: var(--shadow-lg);
  }
  .body {
    grid-column: 2;
    grid-row: 1;
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
    margin: 0.5rem 0 0;
    font-family: var(--font-display);
    font-size: clamp(1.35rem, 2.2vw, 1.9rem);
    line-height: 1.28;
    letter-spacing: -0.012em;
    text-wrap: pretty;
    /* hang the opening quote in the margin so the first word starts on the
       same line as the date above it and the route below */
    text-indent: -0.42em;
  }
  blockquote::before {
    content: "“";
  }
  blockquote::after {
    content: "”";
  }
  .route {
    margin-top: 0.7rem;
    font-size: 0.92rem;
    line-height: 1.5;
    color: var(--color-muted);
  }

  /* The numeral carries the work: its size comes off the search count, so the
     five-search job and the twenty-eight-search job are different weights on
     the page before you read either figure. */
  /* The number is the subject and the two lines beside it are its predicate:
     what the searches were made of, then what they came back with. The unit
     sits under the numeral in the same caps as the date at the top, so the
     block is bracketed by the utility face at both ends. */
  .tally {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: var(--space-3);
    align-items: center;
    margin-top: var(--space-4);
  }
  .count {
    display: grid;
    justify-items: start;
    gap: 0.3rem;
  }
  .count b {
    font-family: var(--font-display);
    font-stretch: var(--display-wide);
    font-weight: 600;
    font-size: calc(3.2rem + var(--n) * 0.13rem);
    line-height: 0.78;
    color: var(--color-primary);
    font-variant-numeric: lining-nums tabular-nums;
  }
  .count span {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
  .of {
    display: grid;
    gap: 0.3rem;
    border-left: 1px solid var(--color-border);
    padding-left: var(--space-3);
  }
  .shape {
    font-size: 0.95rem;
    color: var(--color-text);
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
