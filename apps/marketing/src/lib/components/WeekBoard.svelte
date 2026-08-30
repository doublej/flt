<script lang="ts">
import { SPREADS } from '$lib/scenarios'
import { onMount } from 'svelte'

/** The hero's argument, made touchable: pick a route, see what each of the
 *  seven departure days cost. Every figure is a real fare from the runs in
 *  `scenarios.ts`. Bars are scaled inside each route, because between routes
 *  the fares differ by an order of magnitude — the prices are printed, so the
 *  bar never has to carry a number on its own. */
const routes = SPREADS.map((r) => ({
  ...r,
  short: r.route.replace('Amsterdam → ', ''),
  spread: r.high - r.low,
  /* '19-25 Dec' -> ['19','20',...,'25'] — the seven dates actually searched. */
  labels: (() => {
    const m = r.window.match(/^(\d+)\D+(\d+)\s+(\w+)$/)
    if (!m) return r.days.map((_, i) => String(i + 1))
    const from = Number(m[1])
    return r.days.map((_, i) => String(from + i))
  })(),
}))

let i = $state(0)
let touched = $state(false)
const cur = $derived(routes[i])

/** 40% floor so the cheapest day is still a bar, not a sliver. */
const height = (v: number) =>
  cur.high === cur.low ? 100 : 40 + 60 * ((v - cur.low) / (cur.high - cur.low))

function pick(n: number) {
  touched = true
  i = n
}

onMount(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const t = setInterval(() => {
    if (!touched) i = (i + 1) % routes.length
  }, 3600)
  return () => clearInterval(t)
})
</script>

<div class="board">
  <div class="chips" role="group" aria-label="Choose a route">
    {#each routes as r, n}
      <button type="button" aria-pressed={i === n} onclick={() => pick(n)}>{r.short}</button>
    {/each}
  </div>

  <p class="head">
    <span class="route">Amsterdam → {cur.short}</span>
    <span class="win">{cur.window} · every departure date</span>
  </p>

  <ol class="week">
    {#each cur.days as fare, d}
      <li class:best={fare === cur.low}>
        <span class="fare">€{fare}</span>
        <span class="col" style:height="{height(fare)}%"></span>
        <span class="day">{cur.labels[d]}</span>
      </li>
    {/each}
  </ol>

  <p class="foot">
    Cheapest day <b>€{cur.low}</b>, dearest <b>€{cur.high}</b> — being flexible was worth
    <b class="save">€{cur.spread}</b> on this route. One-way economy.
  </p>
</div>

<style>
  .board {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    background: rgb(9 18 15 / 0.62);
    border: 1px solid rgb(240 244 232 / 0.16);
    backdrop-filter: blur(14px);
    color: #f2f4ec;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .chips button {
    background: none;
    border: 1px solid rgb(240 244 232 / 0.22);
    border-radius: 999px;
    padding: 0.28rem 0.7rem;
    font-size: 0.74rem;
    color: rgb(242 244 236 / 0.72);
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
  .chips button:hover {
    color: #f2f4ec;
    border-color: rgb(240 244 232 / 0.5);
  }
  .chips button[aria-pressed="true"] {
    background: #f2f4ec;
    border-color: #f2f4ec;
    color: #10201a;
  }

  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.6rem;
    margin-top: var(--space-1);
  }
  .route {
    font-family: var(--font-display);
    font-size: 1.35rem;
    letter-spacing: -0.01em;
  }
  .win {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: rgb(242 244 236 / 0.6);
  }

  .week {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    align-items: end;
    gap: 0.4rem;
    height: 11rem;
  }
  .week li {
    display: grid;
    grid-template-rows: auto 1fr auto;
    align-items: end;
    justify-items: center;
    gap: 0.35rem;
    height: 100%;
  }
  .fare {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 0.72rem;
    color: rgb(242 244 236 / 0.66);
  }
  .col {
    width: 100%;
    align-self: end;
    background: rgb(242 244 236 / 0.28);
    border-radius: 1px;
    transition: height 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .week li.best .col {
    background: var(--color-saving);
  }
  .week li.best .fare {
    color: #f0d489;
  }
  .day {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.06em;
    color: rgb(242 244 236 / 0.45);
  }

  .foot {
    font-size: 0.85rem;
    color: rgb(242 244 236 / 0.72);
    line-height: 1.5;
  }
  .foot b {
    font-family: var(--font-mono);
    font-weight: 400;
    color: #f2f4ec;
  }
  .foot b.save {
    color: #f0d489;
  }

  @media (max-width: 520px) {
    .week {
      height: 8.5rem;
    }
    .fare {
      font-size: 0.62rem;
    }
  }
</style>
