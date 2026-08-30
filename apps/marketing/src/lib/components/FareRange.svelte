<script lang="ts">
import { SPREADS, type Spread } from '$lib/scenarios'

/** Shared price axis, so a segment's position shows the fare and its length shows
 *  what a week of flexibility is worth. The axis does not start at zero and says so. */
const LO = 60
const HI = 650
const TICKS = [100, 200, 300, 400, 500, 600]

const pct = (v: number) => ((v - LO) / (HI - LO)) * 100

const rows = [...SPREADS].sort((a, b) => b.high - b.low - (a.high - a.low))
const widest = Math.max(...SPREADS.map((r) => r.high - r.low))

const spread = (r: Spread) => r.high - r.low
</script>

<figure>
  <div class="axis" aria-hidden="true">
    {#each TICKS as t}
      <span class="tick" style:left="{pct(t)}%">€{t}</span>
    {/each}
  </div>

  <ul>
    {#each rows as r}
      {@const wide = spread(r) === widest}
      <li class:wide>
        <span class="route">{r.route.replace('Amsterdam → ', '')}</span>
        <span class="scale">
          <span class="seg" style:left="{pct(r.low)}%" style:width="{pct(r.high) - pct(r.low)}%">
            <i class="dot lo"></i>
            <i class="dot hi"></i>
          </span>
          <span class="lo-label" style:left="{pct(r.low)}%">€{r.low}</span>
          <span class="hi-label" style:left="{pct(r.high)}%">€{r.high}</span>
        </span>
        <span class="spread">€{spread(r)}</span>
      </li>
    {/each}
  </ul>

  <figcaption>
    Each line runs from the cheapest departure date to the dearest, inside one seven-day window.
    The number on the right is what moving your dates was worth. One-way economy fares, the
    cheapest we saw at the time. The axis starts at €60, not zero.
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
    margin-right: 3.5rem;
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
    grid-template-columns: var(--gutter) 1fr 3.5rem;
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
  .wide .seg {
    background: var(--color-signal);
    height: 3px;
  }
  .dot {
    position: absolute;
    top: 50%;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--color-bg);
    border: 2px solid var(--color-primary);
    transform: translate(-50%, -50%);
  }
  .wide .dot {
    border-color: var(--color-signal);
  }
  .dot.lo {
    left: 0;
  }
  .dot.hi {
    left: 100%;
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
  .wide .spread {
    color: var(--color-signal);
    font-weight: 500;
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
      grid-template-columns: var(--gutter) 1fr 3rem;
    }
    .route {
      font-size: 0.8rem;
    }
    .lo-label {
      display: none;
    }
  }
</style>
