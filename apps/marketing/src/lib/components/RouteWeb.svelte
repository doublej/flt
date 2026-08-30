<script lang="ts">
import { DISCOVERY, GRAPH } from '$lib/scenarios'

/** A drawing of the route graph, not of anything bookable. Each line is one
 *  possible routing from Amsterdam to Hanoi within the stop budget. Past one
 *  stop there are far too many to draw, so each panel says how many are on
 *  screen and how many exist. */
const nf = new Intl.NumberFormat('en-GB')

const W = 340
const H = 170
const CAP = [16, 90, 240]

/** Fixed seed: the same picture on the server and in the browser. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function fan(stops: number, count: number) {
  const r = seeded(stops * 7919 + 13)
  const lines: string[] = []
  for (let n = 0; n < count; n++) {
    const pts = [`10,${H / 2}`]
    for (let k = 1; k <= stops; k++) {
      const x = 10 + (k * (W - 20)) / (stops + 1)
      const y = 14 + r() * (H - 28)
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
    }
    pts.push(`${W - 10},${H / 2}`)
    lines.push(pts.join(' '))
  }
  return lines
}

const panels = DISCOVERY.byStops.map((b, i) => ({
  ...b,
  drawn: Math.min(b.routes, CAP[i]),
  lines: fan(b.stops, Math.min(b.routes, CAP[i])),
}))
</script>

<div class="panels">
  {#each panels as p (p.stops)}
    <figure>
      <svg viewBox="0 0 {W} {H}" role="img" aria-label="{nf.format(p.routes)} routings within {p.stops} {p.stops === 1 ? 'stop' : 'stops'}">
        {#each p.lines as pts, i (i)}
          <polyline points={pts} />
        {/each}
        <circle cx="10" cy={H / 2} r="4" />
        <circle cx={W - 10} cy={H / 2} r="4" />
      </svg>
      <figcaption>
        <span class="k">Up to {p.stops} {p.stops === 1 ? 'stop' : 'stops'}</span>
        <b>{nf.format(p.routes)}</b>
        <span class="d">
          {p.drawn === p.routes ? 'all drawn' : `${p.drawn} drawn`}
        </span>
      </figcaption>
    </figure>
  {/each}
</div>

<p class="note">
  Amsterdam to Hanoi, walked over a map of {nf.format(GRAPH.airports)} airports and {nf.format(
    GRAPH.connections,
  )} direct connections in {DISCOVERY.seconds} seconds. Nothing here is priced, timetabled or
  bookable — it is a static snapshot of what connects to what, capped at {DISCOVERY.maxDetour}×
  the direct distance, and we use it to decide where the searching is worth doing. Rule the Gulf
  hubs out and {nf.format(DISCOVERY.byStops[2].routes)} routings become {nf.format(
    DISCOVERY.noGulfAt3,
  )}.
</p>

<style>
  .panels {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: var(--space-4);
    margin-top: var(--space-5);
  }
  figure {
    margin: 0;
    display: grid;
    gap: var(--space-2);
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }
  polyline {
    fill: none;
    stroke: var(--color-primary);
    stroke-width: 0.6;
    stroke-opacity: 0.3;
  }
  circle {
    fill: var(--color-saving);
  }

  figcaption {
    display: flex;
    align-items: baseline;
    gap: 0.55rem;
    flex-wrap: wrap;
  }
  .k {
    font-size: 0.85rem;
  }
  figcaption b {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: 400;
    font-size: 1.05rem;
    color: var(--color-primary);
  }
  .d {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--color-muted);
  }

  .note {
    margin-top: var(--space-4);
    max-width: var(--measure);
    font-size: 0.84rem;
    color: var(--color-muted);
  }
</style>
