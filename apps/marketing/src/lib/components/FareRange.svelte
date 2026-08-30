<script lang="ts">
import { SPREADS, type Spread } from '$lib/scenarios'

/** Shared price axis, so a segment's position shows the fare and its length shows
 *  what a week of flexibility is worth. The axis does not start at zero and says so. */
const LO = 60
const HI = 650
const TICKS = [100, 200, 300, 400, 500, 600]

const pct = (v: number) => ((v - LO) / (HI - LO)) * 100

const rows = [...SPREADS].sort((a, b) => b.high - b.low - (a.high - a.low))

const spread = (r: Spread) => r.high - r.low
/** Printed beside the euro figure: the same spread as a share of the cheapest fare,
 *  because on a shared axis an expensive route looks flexible simply for being long. */
const share = (r: Spread) => Math.round((spread(r) / r.low) * 100)
</script>

<figure>
  <div class="axis" aria-hidden="true">
    {#each TICKS as t}
      <span class="tick" style:left="{pct(t)}%">€{t}</span>
    {/each}
  </div>

  <ul>
    {#each rows as r}
      <li>
        <span class="route">{r.route.replace('Amsterdam → ', '')}</span>
        <span class="scale">
          <span class="seg" style:left="{pct(r.low)}%" style:width="{pct(r.high) - pct(r.low)}%"
          ></span>
          {#each r.days as d}
            <i class="day" style:left="{pct(d)}%"></i>
          {/each}
          <span class="lo-label" style:left="{pct(r.low)}%">€{r.low}</span>
          <span class="hi-label" style:left="{pct(r.high)}%">€{r.high}</span>
        </span>
        <span class="spread">€{spread(r)}<b>{share(r)}%</b></span>
      </li>
    {/each}
  </ul>

  <figcaption>
    One dot per departure date, showing the cheapest fare we found that day; the line spans the
    week. On the right, what moving your dates was worth in euros and as a share of the cheapest
    fare — the percentage matters because a long-haul route looks flexible on this axis simply for
    being expensive. One-way economy fares, the cheapest we saw at the time. The axis starts at €60,
    not zero, and no route is clipped by that.
  </figcaption>
</figure>

<style>
  figure {
    --gutter: 7.5rem;
    margin: 2.5rem 0 0;
  }

  .axis {
    position: relative;
    height: 1.2rem;
    margin-left: var(--gutter);
    margin-right: 4.25rem;
    border-bottom: 1px solid var(--color-border);
  }
  .tick {
    position: absolute;
    transform: translateX(-50%);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--color-muted);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    display: grid;
    grid-template-columns: var(--gutter) 1fr 4.25rem;
    align-items: center;
    gap: 0 0;
    padding-block: 0.95rem;
    border-bottom: 1px solid var(--color-border);
  }

  .route {
    font-size: 0.9rem;
    padding-right: 1rem;
  }

  .scale {
    position: relative;
    height: 1.5rem;
  }
  .seg {
    position: absolute;
    top: 50%;
    height: 2px;
    background: var(--color-primary);
    transform: translateY(-50%);
  }
  /* One dot per departure date. Semi-transparent, so repeated fares stack into a
     darker mark and clustering reads without a second encoding. */
  .day {
    position: absolute;
    top: 50%;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--color-primary) 45%, transparent);
    transform: translate(-50%, -50%);
  }

  .lo-label,
  .hi-label {
    position: absolute;
    top: calc(50% + 0.55rem);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--color-muted);
    white-space: nowrap;
  }
  .lo-label {
    transform: translateX(-100%);
    padding-right: 0.5rem;
  }
  .hi-label {
    padding-left: 0.5rem;
  }

  .spread {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    text-align: right;
    font-size: 0.95rem;
    color: var(--color-primary);
  }
  .spread b {
    display: block;
    font-weight: 400;
    font-size: 0.72rem;
    color: var(--color-muted);
  }

  figcaption {
    margin-top: 1.5rem;
    font-size: 0.8rem;
    color: var(--color-muted);
    max-width: 44rem;
  }

  @media (max-width: 640px) {
    figure {
      --gutter: 5.5rem;
    }
    li {
      grid-template-columns: var(--gutter) 1fr 4rem;
    }
    .route {
      font-size: 0.8rem;
    }
    .lo-label {
      display: none;
    }
  }
</style>
