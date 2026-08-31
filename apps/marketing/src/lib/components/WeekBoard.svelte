<script lang="ts">
import FlapText from '$lib/components/FlapText.svelte'
import { SPREADS } from '$lib/scenarios'
import { onMount } from 'svelte'

/** The hero's argument on a loop: a route turns up, and you see what each of
 *  its seven departure days cost. The fares and the destinations are real runs
 *  from `scenarios.ts`; the departure airport cycles through the five we
 *  actually searched from, so the board reads as indicative rather than as a
 *  quote. Bars are scaled inside each route, because between routes the fares
 *  differ by an order of magnitude — the prices are printed, so the bar never
 *  has to carry a number on its own. */

/** The gateway brief's five origins: 'any airport I can reach by train'. */
const ORIGINS = ['Amsterdam', 'Brussels', 'Paris', 'Düsseldorf', 'Frankfurt']

const routes = SPREADS.map((r, n) => ({
  ...r,
  short: r.route.replace('Amsterdam → ', ''),
  /* Fixed per route, so the board is the same on the server and in the
     browser and does not reshuffle under you between ticks. */
  from: ORIGINS[(n * 7 + 3) % ORIGINS.length],
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
const cur = $derived(routes[i])

/** 40% floor so the cheapest day is still a bar, not a sliver. */
const height = (v: number) =>
  cur.high === cur.low ? 100 : 40 + 60 * ((v - cur.low) / (cur.high - cur.low))

onMount(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const t = setInterval(() => {
    i = (i + 1) % routes.length
  }, 3600)
  return () => clearInterval(t)
})
</script>

<div class="board">
  <div class="head">
    <span class="route">{cur.from} → {cur.short}</span>
    <span class="win">
      <FlapText text={cur.window} variant="night" size="0.6rem" />
      every departure date
    </span>
  </div>

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
    padding: var(--space-4) 0 0;
    color: #f2f4ec;
  }

  /* All nine routes stay on one line. They only just fit at the widest the panel
     gets, so below that the row scrolls rather than wrapping to a second line
     and changing the panel's height. */
  /* Route and window each get their own line whatever the route is called.
     Sharing one wrapping line meant Lyon sat beside its dates and New York JFK
     pushed them below, so the panel changed height as the route cycled. */
  .head {
    display: grid;
    gap: 0.2rem;
    margin-top: var(--space-1);
  }
  .route {
    font-family: var(--font-display);
    font-stretch: var(--display-wide);
    font-weight: 500;
    font-size: 1.35rem;
    letter-spacing: -0.005em;
  }
  .win {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    justify-self: start;
    font-family: var(--font-mono);
    font-size: 0.72rem;
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

  /* Two lines are reserved: the sentence is one line on the short routes and two
     on the long ones, and the page must not jump between them. */
  .foot {
    font-size: 0.85rem;
    color: rgb(242 244 236 / 0.72);
    line-height: 1.5;
    min-height: 2.55rem;
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
