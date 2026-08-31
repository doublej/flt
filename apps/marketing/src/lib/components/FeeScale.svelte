<script lang="ts">
import { en as copy } from '$lib/i18n/en'
import { FLEX, SPREADS } from '$lib/scenarios'
import { TIERS } from '$lib/tiers'

/** One euro axis, and both ends of the argument on it. Everything Bureau
 *  charges is the block at the origin; every route's week spread is a dot
 *  further along the same scale. The section can then stop asserting that the
 *  fee is small against what the right departure date is worth, because the
 *  distance across the page says it — and both ends came off the same runs, so
 *  neither can drift from the other. */

const fee = (price: string) => Number(price.replace(/[^\d]/g, ''))
const byFee = [...TIERS].sort((a, b) => fee(a.price) - fee(b.price))
const dearest = byFee[byFee.length - 1]

/** The axis runs to the biggest spread we measured, so the rightmost dot is
 *  the far end of the scale rather than a point floating inside it. */
const top = FLEX.best
const pct = (v: number) => `${(v / top) * 100}%`

const routes = SPREADS.map((r) => ({
  name: r.route.replace('Amsterdam → ', ''),
  window: r.window,
  spread: r.high - r.low,
})).sort((a, b) => a.spread - b.spread)

const best = routes[routes.length - 1]

/** Newark and Singapore both returned exactly €144. Drawn at the same point
 *  they are one dot, which would show eight marks under a caption claiming
 *  nine, so an exact repeat goes a row up. Only an exact repeat: everything
 *  else is far enough apart to read as two overlapping rings. */
const dots: { spread: number; row: number }[] = []
for (const r of routes) {
  const prev = dots[dots.length - 1]
  dots.push({ spread: r.spread, row: prev?.spread === r.spread ? prev.row + 1 : 0 })
}
</script>

<figure class="scale">
  <div class="labels">
    <p class="charged" style:--w={pct(fee(dearest.price))}>
      {copy.pricing.scale.charged(byFee[0].price, dearest.price)}
    </p>
    <p class="worth">{copy.pricing.scale.worth(best.spread, best.name)}</p>
  </div>

  <div class="axis">
    <span class="band" style:width={pct(fee(dearest.price))}></span>
    <ul aria-hidden="true">
      {#each dots as d, n (n)}
        <li style:--x={pct(d.spread)} style:--row={d.row}></li>
      {/each}
    </ul>
  </div>

  <figcaption>
    {copy.pricing.scale.caption(FLEX.routes, FLEX.paidForItself)}
  </figcaption>
</figure>

<style>
  /* The figure steps out of the copy measure and takes the whole band: the
     length of the axis is the argument, so it gets every pixel the section has. */
  /* Inset by a ring's radius: the last route sits at 100% of the axis, and
     without this its right half — and the label above it — hang over the
     section's own edge. */
  .scale {
    margin: var(--space-5) 0 0;
    padding-inline: 0.4rem;
  }

  .labels {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: var(--space-3);
    font-family: var(--font-mono);
    font-size: 0.76rem;
    line-height: 1.35;
  }
  /* The fee block ends at 6.8% of the axis, which no label fits inside, so the
     label overhangs it and a hairline drops from the label's own left edge down
     to where the block stops. Without it "what we charge" reads as a caption for
     the whole rule rather than for the sliver at the start of it. */
  .charged {
    position: relative;
    padding-bottom: 0.5rem;
    color: var(--color-primary);
  }
  .charged::after {
    content: "";
    position: absolute;
    left: var(--w);
    bottom: 0;
    width: 1px;
    height: 0.35rem;
    background: var(--color-primary);
  }
  .worth {
    padding-bottom: 0.5rem;
    text-align: right;
    color: var(--color-saving-ink);
  }

  /* One rule, zero on the left and the biggest spread we measured on the right. */
  .axis {
    position: relative;
    height: 1.5rem;
    border-top: 1px solid var(--color-border);
  }
  .band {
    position: absolute;
    top: -0.45rem;
    left: 0;
    height: 0.9rem;
    background: var(--color-primary);
    border-radius: 1px;
  }

  .axis ul {
    list-style: none;
  }
  /* Rings rather than discs: two spreads a few euro apart land within a dot's
     width of each other on a narrow screen, and two overlapping rings still
     read as two. */
  .axis li {
    position: absolute;
    top: calc(-0.34rem + var(--row) * 0.78rem);
    left: var(--x);
    width: 0.68rem;
    height: 0.68rem;
    translate: -50% 0;
    border: 2px solid var(--color-saving);
    border-radius: 50%;
    background: var(--color-bg);
  }

  figcaption {
    margin-top: var(--space-3);
    max-width: var(--measure);
    font-size: 0.84rem;
    color: var(--color-muted);
  }

  /* Narrow: the two labels cannot sit on one line, so the right-hand one drops
     below and stays flush right, which is what keeps it attached to the far end
     of the axis rather than to the near one. */
  @media (max-width: 620px) {
    /* An explicit track, because a grid that still carries the flex rule's
       `space-between` sizes its implicit column to max-content — and then the
       right-hand label aligns to the end of the longer label above it rather
       than to the end of the axis. */
    .labels {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 0.2rem;
    }
    .worth {
      justify-self: end;
    }
  }
</style>
