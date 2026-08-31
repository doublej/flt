<script lang="ts">
import { getCopy, getLocale } from '$lib/i18n/copy.svelte'
import { DISCOVERY, GRAPH } from '$lib/scenarios'
import { cubicOut } from 'svelte/easing'
import { draw } from 'svelte/transition'

/** A drawing of the route graph, not of anything bookable. Each line is one
 *  possible routing from Amsterdam to Hanoi within the stop budget, and each
 *  one changes planes at a real airport — so the lines meet where the hubs
 *  are, and a busy hub draws bigger. One diagram, not three: three hop-slots
 *  sit at fixed positions and the stop budget decides how many are in play,
 *  so raising it reads as the mesh filling in, never as a new picture. A
 *  faint haze behind the drawn sample stands in for the routes we did not
 *  draw — depth for the count printed under it, not more lines to follow. */
const copy = $derived(getCopy())
const nf = $derived(new Intl.NumberFormat(getLocale() === 'nl' ? 'nl-NL' : 'en-GB'))

const W = 640
const H = 220
const PAD = 22
/** Sample actually drawn and animated in. */
const CAP = [16, 90, 240]
/** Faint background lines standing in for the rest — none at 1 stop, because
 *  16 routes is the whole picture already. */
const HAZE_CAP = [0, 320, 1100]
/** Distinct via-airports drawn in one hop column. */
const POOL = 16
/** Fixed x for the three hop-slots — left, centre, right. Which are active
 *  changes; their position on the canvas never does. */
const SLOT_X = [0.25, 0.5, 0.75].map((f) => PAD + f * (W - 2 * PAD))
/** Reveal order by slot index: 1 stop uses the centre slot alone, 2 stops
 *  adds the left one, 3 adds the right — a budget increase only ever adds a
 *  column, it never relocates one. */
const REVEAL: number[] = [1, 0, 2]

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

type Slot = { x: number; ys: number[]; w: number[]; total: number }

function slot(x: number, r: () => number): Slot {
  /* Uneven gaps: a column of airports, not a ruler. */
  const gaps = Array.from({ length: POOL }, () => 0.5 + r())
  const span = gaps.reduce((a, b) => a + b, 0)
  let run = 0
  const ys = gaps.map((g) => {
    run += g
    return PAD + ((run - g / 2) / span) * (H - 2 * PAD)
  })
  const w = ys.map(() => 0.12 + r() ** 2.4)
  return { x, ys, w, total: w.reduce((a, b) => a + b, 0) }
}

function pick(s: Slot, r: () => number) {
  let t = r() * s.total
  for (let i = 0; i < s.w.length; i++) {
    t -= s.w[i]
    if (t <= 0) return i
  }
  return s.w.length - 1
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

/** Generated once, so a slot's own airports never reshuffle when it joins
 *  or leaves the picture — only its load does. */
const SLOTS = SLOT_X.map((x) => slot(x, seeded(7919 + 13)))
const hubR = (load: number) => 1.1 + Math.sqrt(load) * 0.55

function activeCols(stops: number) {
  const order = [...REVEAL.slice(0, stops)].sort((a, b) => a - b)
  return { order, cols: order.map((si) => SLOTS[si]) }
}

function scene(stops: number) {
  const routes = DISCOVERY.byStops[stops - 1].routes
  const { order, cols } = activeCols(stops)
  const drawn = Math.min(routes, CAP[stops - 1])
  const r = seeded(stops * 7919 + 13)
  const load: number[][] = SLOTS.map((s) => s.ys.map(() => 0))
  const paths = Array.from({ length: drawn }, (_, n) => {
    const pts = [{ x: PAD, y: H / 2 }]
    cols.forEach((c, ci) => {
      const i = drawn <= POOL ? n : pick(c, r)
      load[order[ci]][i]++
      pts.push({ x: c.x, y: c.ys[i] })
    })
    pts.push({ x: W - PAD, y: H / 2 })
    return curve(pts)
  })

  const hazeCount = HAZE_CAP[stops - 1]
  const hr = seeded(stops * 7919 + 555)
  const haze = Array.from({ length: hazeCount }, () => {
    const pts = [{ x: PAD, y: H / 2 }]
    for (const c of cols) pts.push({ x: c.x, y: c.ys[pick(c, hr)] })
    pts.push({ x: W - PAD, y: H / 2 })
    return curve(pts)
  })

  return { stops, routes, paths, haze, on: new Set(order), load }
}

const scenes = [1, 2, 3].map(scene)

/* Open on 3 stops so the first paint shows the number the heading claims. */
let active = $state(3)
let hold = $state(false)
const current = $derived(scenes[active - 1])
const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

$effect(() => {
  if (hold || reduceMotion) return
  const t = setInterval(() => {
    active = active === 3 ? 1 : active + 1
  }, 3600)
  return () => clearInterval(t)
})
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="stage"
  onmouseenter={() => (hold = true)}
  onmouseleave={() => (hold = false)}
  onfocusin={() => (hold = true)}
  onfocusout={() => (hold = false)}
>
  <svg viewBox="0 0 {W} {H}" role="img" aria-label={copy.routes.webLabel(nf.format(current.routes), current.stops)}>
    <defs>
      <linearGradient id="rw" gradientUnits="userSpaceOnUse" x1={PAD} x2={W - PAD}>
        <stop offset="0%" stop-color="var(--color-saving)" />
        <stop offset="10%" stop-color="var(--color-primary)" />
        <stop offset="90%" stop-color="var(--color-primary)" />
        <stop offset="100%" stop-color="var(--color-saving)" />
      </linearGradient>
    </defs>
    <g class="haze">
      {#each current.haze as d, i (i)}
        <path {d} />
      {/each}
    </g>
    <g class="web" stroke="url(#rw)">
      {#each current.paths as d, i (`${active}-${i}`)}
        <path
          {d}
          in:draw={{ duration: reduceMotion ? 0 : 560, delay: reduceMotion ? 0 : Math.min(i * 3, 260), easing: cubicOut }}
        />
      {/each}
    </g>
    {#each SLOTS as s, si (si)}
      <g class="slot" class:on={current.on.has(si)}>
        {#each s.ys as y, i (i)}
          {#if current.load[si][i] > 0}
            <circle class="hub" cx={s.x} cy={y} r={hubR(current.load[si][i])} />
          {/if}
        {/each}
      </g>
    {/each}
    <circle class="halo" cx={PAD} cy={H / 2} r="9" />
    <circle class="halo" cx={W - PAD} cy={H / 2} r="9" />
    <circle class="end" cx={PAD} cy={H / 2} r="3.6" />
    <circle class="end" cx={W - PAD} cy={H / 2} r="3.6" />
  </svg>

  <div class="count">
    <b class="n">{nf.format(current.routes)}</b>
    <span class="k">{copy.routes.webUpTo(current.stops)}</span>
  </div>

  <div class="tabs" role="tablist" aria-label={copy.routes.tabsLabel}>
    {#each DISCOVERY.byStops as b (b.stops)}
      <button
        type="button"
        role="tab"
        aria-selected={active === b.stops}
        class:on={active === b.stops}
        onclick={() => (active = b.stops)}
      >
        <span class="k">{copy.routes.webUpTo(b.stops)}</span>
        <span class="n">{nf.format(b.routes)}</span>
      </button>
    {/each}
  </div>
</div>

<p class="note">
  {copy.routes.webNote(nf.format(GRAPH.airports), nf.format(GRAPH.connections), nf.format(DISCOVERY.seconds))}
</p>

<style>
  .stage {
    margin-top: var(--space-5);
    max-width: 44rem;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .haze path {
    fill: none;
    stroke: var(--color-primary);
    stroke-opacity: 0.09;
    stroke-width: 0.5px;
  }
  .web path {
    fill: none;
    stroke-width: 0.9px;
    stroke-opacity: 0.4;
    stroke-linecap: round;
  }
  .hub {
    fill: var(--color-primary);
    fill-opacity: 0.55;
    transition: r 0.5s ease;
  }
  .slot {
    opacity: 0.15;
    transition: opacity 0.5s ease;
  }
  .slot.on {
    opacity: 1;
  }
  .halo {
    fill: var(--color-saving);
    fill-opacity: 0.13;
  }
  .end {
    fill: var(--color-saving);
  }

  .count {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    margin-top: var(--space-2);
  }
  .count .n {
    font-family: var(--font-mono);
    font-weight: 400;
    font-variant-numeric: tabular-nums;
    font-size: 1.4rem;
    color: var(--color-primary);
  }
  .k {
    font-size: 0.85rem;
    color: var(--color-muted);
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-3);
  }
  .tabs button {
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
    border: 1px solid var(--color-border);
    background: none;
    border-radius: 999px;
    padding: 0.35rem 0.9rem;
    font: inherit;
    color: var(--color-text);
  }
  .tabs button.on {
    border-color: var(--color-primary);
    background: var(--color-surface-raised);
  }
  .tabs .k {
    font-size: 0.82rem;
    color: inherit;
  }
  .tabs .n {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
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
