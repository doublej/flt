<script lang="ts">
import FlapText from '$lib/components/FlapText.svelte'
import { DISCOVERY, GRAPH } from '$lib/scenarios'

/** A drawing of the route graph, not of anything bookable. Each line is one
 *  possible routing from Amsterdam to Hanoi within the stop budget, and each
 *  one changes planes at a real airport — so the lines meet where the hubs
 *  are, and a busy hub draws bigger. Past one stop there are far too many to
 *  draw, so each panel is a sample of the count printed under it. */
const nf = new Intl.NumberFormat('en-GB')

const W = 360
const H = 176
const PAD = 18
const CAP = [16, 90, 240]
/** Distinct via-airports drawn in one hop column. */
const POOL = 16

/** Fixed seed: the same picture on the server and in the browser. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

type Column = { x: number; ys: number[]; w: number[]; total: number; load: number[] }

/** One hop: a fixed set of airports, a few of them far busier than the rest. */
function column(x: number, r: () => number): Column {
  /* Uneven gaps: a column of airports, not a ruler. */
  const gaps = Array.from({ length: POOL }, () => 0.5 + r())
  const span = gaps.reduce((a, b) => a + b, 0)
  let run = 0
  const ys = gaps.map((g) => {
    run += g
    return PAD + ((run - g / 2) / span) * (H - 2 * PAD)
  })
  const w = ys.map(() => 0.12 + r() ** 2.4)
  return { x, ys, w, total: w.reduce((a, b) => a + b, 0), load: ys.map(() => 0) }
}

function pick(c: Column, r: () => number) {
  let t = r() * c.total
  for (let i = 0; i < c.w.length; i++) {
    t -= c.w[i]
    if (t <= 0) return i
  }
  return c.w.length - 1
}

/** Horizontal handles, so a routing reads as a flow through its stops. */
function curve(pts: { x: number; y: number }[]) {
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const dx = (b.x - a.x) * 0.45
    d += `C${(a.x + dx).toFixed(1)},${a.y.toFixed(1)} ${(b.x - dx).toFixed(1)},${b.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`
  }
  return d
}

function panel(stops: number, routes: number, cap: number) {
  const r = seeded(stops * 7919 + 13)
  const drawn = Math.min(routes, cap)
  const cols = Array.from({ length: stops }, (_, k) =>
    column(PAD + ((k + 1) * (W - 2 * PAD)) / (stops + 1), r),
  )
  const paths = Array.from({ length: drawn }, (_, n) => {
    const pts = [{ x: PAD, y: H / 2 }]
    for (const c of cols) {
      const i = drawn <= POOL ? n : pick(c, r)
      c.load[i]++
      pts.push({ x: c.x, y: c.ys[i] })
    }
    pts.push({ x: W - PAD, y: H / 2 })
    return curve(pts)
  })
  return { stops, routes, cols, paths }
}

const top = Math.max(...DISCOVERY.byStops.map((b) => b.routes))
const panels = DISCOVERY.byStops.map((b, i) => ({
  ...panel(b.stops, b.routes, CAP[i]),
  /** The bar is a log reading: the counts are three orders apart. */
  mag: Math.log(b.routes) / Math.log(top),
  ink: [0.42, 0.26, 0.15][i],
  weight: [1, 0.8, 0.6][i],
}))

const hubR = (load: number) => 1.1 + Math.sqrt(load) * 0.55
</script>

<div class="panels">
  {#each panels as p (p.stops)}
    <figure>
      <svg
        viewBox="0 0 {W} {H}"
        role="img"
        aria-label="{nf.format(p.routes)} routings within {p.stops} {p.stops === 1
          ? 'stop'
          : 'stops'}"
        style="--ink:{p.ink}; --weight:{p.weight}"
      >
        <defs>
          <linearGradient id="rw{p.stops}" gradientUnits="userSpaceOnUse" x1={PAD} x2={W - PAD}>
            <stop offset="0%" stop-color="var(--color-saving)" />
            <stop offset="14%" stop-color="var(--color-primary)" />
            <stop offset="86%" stop-color="var(--color-primary)" />
            <stop offset="100%" stop-color="var(--color-saving)" />
          </linearGradient>
        </defs>
        <g class="web" stroke="url(#rw{p.stops})">
          {#each p.paths as d, i (i)}
            <path {d} />
          {/each}
        </g>
        {#each p.cols as c, k (k)}
          {#each c.ys as y, i (i)}
            {#if c.load[i] > 0}
              <circle class="hub" cx={c.x} cy={y} r={hubR(c.load[i])} />
            {/if}
          {/each}
        {/each}
        <circle class="halo" cx={PAD} cy={H / 2} r="8" />
        <circle class="halo" cx={W - PAD} cy={H / 2} r="8" />
        <circle class="end" cx={PAD} cy={H / 2} r="3.4" />
        <circle class="end" cx={W - PAD} cy={H / 2} r="3.4" />
      </svg>
      <div class="mag" style="--f:{p.mag}"></div>
      <figcaption>
        <span class="k">Up to {p.stops} {p.stops === 1 ? 'stop' : 'stops'}</span>
        <b><FlapText text={String(p.routes)} size="0.72rem" /></b>
      </figcaption>
    </figure>
  {/each}
</div>

<p class="note">
  Amsterdam to Hanoi, walked over a map of {nf.format(GRAPH.airports)} airports and {nf.format(
    GRAPH.connections,
  )} direct connections in {DISCOVERY.seconds} seconds. Nothing here is priced, timetabled or
  bookable; it is a static snapshot of what connects to what, capped at {DISCOVERY.maxDetour}× the
  direct distance, and we use it to decide which routes are worth searching. Rule the Gulf hubs
  out and {nf.format(DISCOVERY.byStops[2].routes)} routings become {nf.format(
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
  }
  .web path {
    fill: none;
    stroke-width: calc(0.75px * var(--weight));
    stroke-opacity: var(--ink);
    stroke-linecap: round;
  }
  .hub {
    fill: var(--color-primary);
    fill-opacity: 0.55;
  }
  .halo {
    fill: var(--color-saving);
    fill-opacity: 0.13;
  }
  .end {
    fill: var(--color-saving);
  }

  /* How much of the whole map this stop budget reaches, on a log scale — the
     three counts are three orders of magnitude apart. */
  .mag {
    height: 2px;
    border-radius: 2px;
    background: var(--color-border);
    margin-top: var(--space-1);
  }
  .mag::before {
    content: '';
    display: block;
    height: 100%;
    width: calc(var(--f) * 100%);
    border-radius: inherit;
    background: var(--color-primary);
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
    font-weight: 400;
    font-size: 1.05rem;
    color: var(--color-primary);
  }
  .note {
    margin-top: var(--space-4);
    max-width: var(--measure);
    font-size: 0.84rem;
    color: var(--color-muted);
  }
</style>
