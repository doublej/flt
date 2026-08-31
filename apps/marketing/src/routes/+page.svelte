<script lang="ts">
import Airspace from '$lib/components/Airspace.svelte'
import AvoidHubs from '$lib/components/AvoidHubs.svelte'
import BriefForm from '$lib/components/BriefForm.svelte'
import CompositeStage from '$lib/components/CompositeStage.svelte'
import FareRange from '$lib/components/FareRange.svelte'
import PriceTiers from '$lib/components/PriceTiers.svelte'
import QueryGrid from '$lib/components/QueryGrid.svelte'
import RouteWeb from '$lib/components/RouteWeb.svelte'
import type { Column, Point } from '$lib/components/SplitFlapBoard.svelte'
import WeekBoard from '$lib/components/WeekBoard.svelte'
import { CABIN, DISCOVERY, FLEX, SPREADS, TOTALS } from '$lib/scenarios'
import { onMount } from 'svelte'
import { fade } from 'svelte/transition'

let tier = $state('survey')
let scrolled = $state(false)
let hero: HTMLElement
/** ?tune opens the hero's tuning pane. Read from location rather than from
 *  $app/state because the page is prerendered and has no searchParams then. */
let tuning = $state(false)

/** Four ways of saying the same thing, every figure from the runs in
 *  `scenarios.ts`. Hanoi on 3 November was priced from five departure airports
 *  at once: cheapest of the 135 options EUR 320, dearest EUR 2,312. The
 *  Amsterdam-New York week ran 19-25 December, EUR 400 on the 22nd against
 *  EUR 547 on the 19th. Innsbruck's EUR 84 against EUR 121 is 44% of the
 *  cheaper fare. Seventy-five searches by hand at 90s each is 1.9 hours. */
let hi = $state(0)
const HEADLINES = [
  {
    kicker: 'FIVE AIRPORTS ONE DAY',
    lines: ['€320 to Hanoi.', '€2,312 to Hanoi.', 'The same day.'],
  },
  {
    kicker: 'AMSTERDAM-NEW YORK',
    lines: ['€400 on the 22nd.', '€547 on the 19th.', '€147 apart.'],
  },
  {
    kicker: 'AMSTERDAM-INNSBRUCK',
    lines: ['€84 on the 17th.', '€121 on the 16th.', '44% for one day.'],
  },
  {
    kicker: 'SEVENTY-FIVE SEARCHES',
    lines: ['75 searches.', 'Two hours in tabs.', '200 seconds here.'],
  },
]
let held = $state(false)

/* The board inside the photograph. Every row is the cheapest fare we actually
 *  found on that route, on the day it was cheapest — no gates, no statuses, no
 *  departure times, because we do not have those and will not invent them. */
const DEP_COLS: Column[] = [
  { id: 'day', width: 6 },
  { id: 'to', width: 15 },
  { id: 'fare', width: 7 },
  { id: 'save', width: 8 },
]

/* Solved on /labs/splitflap/terminal — fractions of the intrinsic 2000x853. */
let CORNERS = $state<Point[]>([
  { x: 0.361, y: 0.44 },
  { x: 0.649, y: 0.44 },
  { x: 0.649, y: 0.646 },
  { x: 0.361, y: 0.646 },
])

/* Grade tuned against the photograph itself, at full size, on the page. */
let LOOK = $state({
  renderer: 'canvas',
  exposure: 0.69,
  contrast: 1.31,
  warmth: -0.17,
  angle: 180,
  multiply: '#00000000',
  screen: '#ffca0018',
  grain: 1,
  aberration: 1.3,
  vignette: 0.13,
  blur: 0.9,
  supersample: 1,
  glass: false,
  bg: '#000000ff',
  pad: 0.52,
  face: '#131313',
  ink: '#dfd6c4',
  aspect: 0.495,
  glyph: 1.07,
  squeeze: 0.66,
  baseline: -0.04,
  rowgap: 0.19,
  grit: 0,
  pins: false,
  /* the lit header. Its tones are the photograph's own, so it stays amber even
     though the flaps beside it were graded cool. */
  signFace: '#fedf8e',
  signLip: '#ffc34e',
  signFrame: '#974716',
  signInk: '#cc6707',
  signGlow: '#ff5a0f',
  signGlyph: 0.52,
  signLetter: 0,
  signBloom: 0,
  signUp: 0,
  signDown: 0,
  signIcon: false,
  signX: 0,
  signY: -0.0001999999999999988,
  signW: 1.014,
  signH: 0.1656,
  signPad: 0.55,
  signTextY: 0.42,
  signSqueeze: 1,
})

const DEPARTURES = SPREADS.map((r) => {
  const i = r.days.indexOf(r.low)
  const m = r.window.match(/^(\d+)\D+\d+\s+(\w+)$/)
  const day = m ? String(Number(m[1]) + i) : ''
  const mon = (m?.[2] ?? '').toUpperCase()
  return {
    day: `${day.padStart(2, '0')} ${mon}`,
    to: r.route.replace('Amsterdam → ', '').toUpperCase(),
    fare: `EUR ${r.low}`,
    save: `SAVE ${r.high - r.low}`,
  }
})

const nf = new Intl.NumberFormat('en-GB')

/** The header sits on the photograph until you have scrolled past it, then
 *  takes the page background so the links stay readable. */
onMount(() => {
  tuning = new URLSearchParams(location.search).has('tune')

  const io = new IntersectionObserver(
    (e) => {
      scrolled = !e[0].isIntersecting
    },
    { rootMargin: '-68px 0px 0px 0px' },
  )
  io.observe(hero)

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => io.disconnect()
  }
  const t = setInterval(() => {
    if (!held) hi = (hi + 1) % HEADLINES.length
  }, 5200)
  return () => {
    io.disconnect()
    clearInterval(t)
  }
})

const STEPS = [
  {
    h: 'Send a rough brief',
    p: 'Where from, where to and roughly when. Several destinations is fine, and so is vague, because vague is the part we are good at.',
  },
  {
    h: 'We price every date',
    p: 'One search at a time, a few seconds apart, because a flight site that gets too many requests at once stops answering. It takes minutes, and you do not have to sit through them.',
  },
  {
    h: 'The report lands',
    p: 'A PDF with the prices day by day, every option ranked by price and journey time, and a link to book each one. The last one of these found €147 between the best departure date and the worst. You book in the same place you always did.',
  },
]

const LIMITS = [
  'We do not book or ticket anything. We find the options and hand you the links.',
  'Prices come from public flight search results rather than from the airlines, so they are what was showing when we looked and they can move before you book.',
  'Display price only, with no baggage rules, fare conditions or tax breakdown.',
  'The engine is a public command-line tool called flt. It is on GitHub, and you are welcome to run it yourself and skip us entirely.',
]
</script>

<header class:solid={scrolled}>
  <div class="bar">
    <a class="mark" href="#top">Bureau</a>
    <nav>
      <a href="#report">How it works</a>
      <a href="#pricing">Pricing</a>
      <a class="cta" href="#brief">Start a brief</a>
    </nav>
  </div>
</header>

<section class="hero" class:tune={tuning} id="top" bind:this={hero}>
  <div class="stage">
    <!-- ?tune is only known after mount, and CompositeStage builds its pane in
         its own onMount. Keying on it remounts the stage once, with editable
         already true, instead of flipping a prop the pane never re-reads. -->
    {#key tuning}
      <CompositeStage
        src="/img/terminal.jpg"
        imageWidth={2000}
        imageHeight={853}
        objectPosition="0% 46%"
        rows={DEPARTURES}
        columns={DEP_COLS}
        bind:corners={CORNERS}
        bind:look={LOOK}
        sign="Cheapest day by route"
        editable={tuning}
        storageKey="hero"
      />
    {/key}
  </div>
  <div class="hero-inner">
    <div class="rotor" aria-live="polite">
      {#key hi}
        <div class="slab" in:fade={{ duration: 600 }} out:fade={{ duration: 300 }}>
          <h1>
            {#each HEADLINES[hi].lines as line, n (n)}
              <span style:--n={n} class:last={n === 2}>{line}</span>
            {/each}
          </h1>
        </div>
      {/key}
    </div>
    <p class="pitch">
      We price every date you could fly, then send one report. On the nine routes below, the
      right day was worth up to €{FLEX.best}. Reports from €3.
    </p>
    <div class="hero-actions">
      <a class="btn" href="#brief">Start a brief</a>
      <a class="quiet" href="#report">See how it works</a>
    </div>
    <ol class="ticks">
      {#each HEADLINES as h, n (h.kicker)}
        <li>
          <button
            type="button"
            aria-label={h.kicker}
            aria-current={hi === n}
            onclick={() => {
              held = true
              hi = n
            }}
          ></button>
        </li>
      {/each}
    </ol>
  </div>
</section>

<section class="weekband">
  <div class="weekband-inner">
    <div class="weekband-copy">
      <h2>Seven departure dates, up to €{FLEX.best} between the best one and the worst</h2>
      <p>
        Nine real routes, each priced on all seven departure dates in its window. Moving your dates
        was worth €{FLEX.best} on New&nbsp;York and €{FLEX.worst} on Lyon, and nothing about either
        route said which it would be in advance. The New York answer cost €10.
      </p>
      <div class="weekband-actions">
        <a class="btn" href="#brief">Start a brief, from €3</a>
        <a class="quiet" href="#report">See how it works</a>
      </div>
      <p class="proof">
        {TOTALS.queries} searches · {nf.format(TOTALS.options)} options · {TOTALS.carriers} airlines
        · {TOTALS.searchingSeconds} seconds
      </p>
    </div>
    <WeekBoard />
  </div>
</section>

<main>
  <section class="band" id="evidence">
    <h2>The right departure date was worth €{FLEX.best} on New&nbsp;York and €{FLEX.worst} on Lyon</h2>
    <p class="lead measure">
      Every route here was searched on all seven of its departure dates, so the spread is exactly
      what moving your dates would have saved you. {FLEX.paidForItself} of the {FLEX.routes}
      returned more than the €10 we charge to look, and the best of them returned {FLEX.timesOver}
      times it. You cannot tell which kind of route you have until someone checks.
    </p>
    <FareRange />
    <p class="measure kicker">
      Cabin makes its own point. Across that Singapore week economy moved between €{CABIN
        .economyLow} and €{CABIN.economyHigh}, while premium economy sat at €{CABIN.premiumFlat} on
      every single day. The step up cost €{CABIN.premiumFlat - CABIN.economyHigh} on the dearest
      economy day and €{CABIN.premiumFlat - CABIN.economyLow} on the cheapest. The upgrade never
      moved; only the thing you were comparing it against did. Fourteen searches and 37 seconds
      bought that answer.
    </p>

  </section>

  <section class="band" id="work">
    <h2>Seventy-five searches took us 200 seconds. By&nbsp;hand they take two hours.</h2>
    <p class="lead measure">
      Four briefs, seventy-five searches. One search is one route priced on one date, so a brief
      that leaves both open is not one question but dozens — and dozens is exactly where a row of
      browser tabs stops being any use.
    </p>
    <QueryGrid />
  </section>

  <section class="band" id="avoid">
    <h2>Ruling out the Gulf cost €73 on Singapore and nothing at all on Hanoi</h2>
    <p class="lead measure">
      Say you will not change planes in the Gulf. We read every option first, then take away the
      ones that connect there. On Singapore that took out 113 of 1,060 options and put €73 on the
      cheapest fare; on Hanoi it took out 50 of 135 and changed the price by nothing. You only find
      out which by having priced both.
    </p>
    <AvoidHubs />
  </section>

  <section class="band" id="routes">
    <h2>
      There are {nf.format(DISCOVERY.byStops[2].routes)} ways to reach Hanoi, and we read the map
      in {DISCOVERY.seconds} seconds before pricing one of them
    </h2>
    <p class="lead measure">
      Every line is one way of getting from Amsterdam to Hanoi within a stop budget. Nothing here
      has a price on it yet. We look at what connects to what first, and then go and price the
      routes worth pricing.
    </p>
    <RouteWeb />
  </section>

  <section class="band air" id="report">
    <Airspace set={0} />
    <h2>How it works</h2>
    <ol class="steps">
      {#each STEPS as step, i}
        <li>
          <span class="n">{i + 1}</span>
          <div>
            <h3>{step.h}</h3>
            <p>{step.p}</p>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <section class="band air" id="pricing">
    <Airspace set={1} />
    <h2>You pay for the searching, not the seat</h2>
    <p class="lead measure">
      One date is cheap to answer. Five destinations across a fortnight in two cabins is not,
      because it is far more work: the New York job above took 28 searches to find the €147 between
      its best day and its worst. That is a €10 report returning fourteen times its price, on one
      leg, for one traveller.
    </p>
    <PriceTiers bind:selected={tier} />
    <p class="measure kicker">
      One route on one fixed date? Do not pay us for that, because Google Flights does it free in
      ninety seconds. We are worth paying once you have several destinations and a spread of
      dates — which is where tabs stop being any help, and where the spread is usually worth more
      than the fee.
    </p>
  </section>

  <section class="band air" id="brief">
    <Airspace set={2} />
    <h2>Send a brief</h2>
    <p class="lead measure">
      Only the destination is required. Everything else is a tap, or leave it and we will use our
      judgement — the vaguest briefs are the ones worth most, because they have the most dates to
      be wrong about. The report comes back the same day.
    </p>
    <BriefForm {tier} />
    <ul class="limits">
      {#each LIMITS as l}
        <li>{l}</li>
      {/each}
    </ul>
  </section>
</main>

<footer>
  <p>Bureau — flight research reports. We find the flights; you book them.</p>
  <nav>
    <a href="https://github.com/jurrejan/flights">The engine on GitHub</a>
  </nav>
</footer>

<style>
  /* ---- header ---------------------------------------------------------- */
  header {
    position: sticky;
    top: 0;
    z-index: 10;
    transition: background 0.25s ease, border-color 0.25s ease;
    border-bottom: 1px solid transparent;
  }
  header .bar {
    max-width: 74rem;
    margin: 0 auto;
    padding: var(--space-3) var(--gutter);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }
  header.solid {
    background: color-mix(in srgb, var(--color-bg) 96%, transparent);
    backdrop-filter: blur(12px) saturate(1.2);
    border-bottom-color: var(--color-border);
  }

  .mark {
    font-family: var(--font-display);
    font-stretch: var(--display-wide);
    font-weight: 600;
    letter-spacing: 0.01em;
    font-size: 1.3rem;
    color: #f0f5f1;
    text-decoration: none;
    transition: color 0.25s ease;
  }
  header nav {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    font-size: 0.88rem;
  }
  header nav a {
    color: rgb(240 245 241 / 0.8);
    text-decoration: none;
    transition: color 0.25s ease;
  }
  header nav a:hover {
    color: #fff;
  }
  header nav .cta {
    color: #12211c;
    background: #f0f5f1;
    padding: 0.45rem 0.9rem;
    border-radius: var(--radius);
  }

  header.solid .mark {
    color: var(--color-text);
  }
  header.solid nav a {
    color: var(--color-muted);
  }
  header.solid nav a:hover {
    color: var(--color-text);
  }
  header.solid nav .cta {
    color: var(--color-surface);
    background: var(--color-primary);
  }
  header.solid nav .cta:hover {
    background: var(--color-primary-hover);
    color: var(--color-surface);
  }
  @media (max-width: 620px) {
    header nav a:not(.cta) {
      display: none;
    }
  }

  /* ---- hero ------------------------------------------------------------ */
  /* The photograph is the point, so it is never cropped harder than it has to
     be and the copy stays in the dark glass on the left, clear of the board. */
  .hero {
    position: relative;
    margin-top: -5.5rem;
    isolation: isolate;
    background: #08120f;
    /* the camera moves, so the stage is oversized and the hero clips it */
    overflow: hidden;
  }
  /* CompositeStage maps the corners through the same object-position as the
     photograph, so our board stays on the concourse board through any crop. */
  .stage {
    position: absolute;
    inset: 0;
    z-index: -2;
  }
  /* No `ratio` is passed — the hero sets its own height, so the stage's own
     boxes have to be told to fill it. */
  .stage :global(.work),
  .stage :global(.photo) {
    height: 100%;
  }

  /* ---- the camera ------------------------------------------------------
     The hero is meant to read as one held shot of a concourse, board and all,
     so the whole composite moves together: a slow tripod creep on the stage,
     a handheld tremble on the photo, an exposure that hunts and a lens that
     loses focus for a beat. Periods are coprime so the loop never lands in the
     same place twice. */
  .stage {
    /* zoomed enough that the tremble and the roll never walk an edge in */
    transform: scale(1.015);
  }
  .stage::after {
    content: "";
    position: absolute;
    /* over-hangs the frame so the grain can crawl without showing its own edge */
    inset: -90px;
    pointer-events: none;
    opacity: 0.09;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  @media (prefers-reduced-motion: no-preference) {
    .stage {
      animation: hero-drift 29s ease-in-out infinite;
    }
    .stage :global(.photo) {
      animation:
        hero-handheld 4.9s ease-in-out infinite,
        hero-camera 15s ease-in-out infinite;
    }
    .stage::after {
      animation: hero-grain 0.45s steps(1) infinite;
    }
  }
  /* tuning fights a moving target */
  .hero.tune .stage,
  .hero.tune .stage :global(.photo),
  .hero.tune .stage::after {
    animation: none;
  }
  @keyframes hero-drift {
    0%,
    100% {
      transform: scale(1.015) translate3d(0, 0, 0) rotate(0deg);
    }
    23% {
      transform: scale(1.019) translate3d(-0.17%, 0.12%, 0) rotate(0.07deg);
    }
    47% {
      transform: scale(1.015) translate3d(0.13%, 0.18%, 0) rotate(-0.06deg);
    }
    71% {
      transform: scale(1.02) translate3d(0.19%, -0.1%, 0) rotate(0.05deg);
    }
  }
  @keyframes hero-handheld {
    0%,
    100% {
      transform: translate3d(0, 0, 0);
    }
    17% {
      transform: translate3d(0.7px, -1.3px, 0);
    }
    34% {
      transform: translate3d(-1.4px, 0.5px, 0);
    }
    52% {
      transform: translate3d(1px, 1.1px, 0);
    }
    68% {
      transform: translate3d(-0.6px, -0.8px, 0);
    }
    85% {
      transform: translate3d(1.3px, 0.3px, 0);
    }
  }
  /* Exposure hunts slowly; focus goes twice, and a focus hunt is quick — the
     blur ramps and snaps back inside a second, so the keyframes sit close. */
  @keyframes hero-camera {
    0%,
    100% {
      filter: brightness(1) contrast(1) blur(0px);
    }
    12% {
      filter: brightness(1.07) contrast(0.97) blur(0px);
    }
    24% {
      filter: brightness(1.02) contrast(1) blur(0px);
    }
    27% {
      filter: brightness(1.015) contrast(1) blur(1.2px);
    }
    31% {
      filter: brightness(1.008) contrast(1.015) blur(0px);
    }
    56% {
      filter: brightness(0.93) contrast(1.05) blur(0px);
    }
    71% {
      filter: brightness(0.98) contrast(1.01) blur(0px);
    }
    74% {
      filter: brightness(0.99) contrast(1) blur(0.8px);
    }
    78% {
      filter: brightness(1.02) contrast(0.99) blur(0px);
    }
  }
  @keyframes hero-grain {
    0% {
      transform: translate3d(0, 0, 0);
    }
    20% {
      transform: translate3d(-48px, 30px, 0);
    }
    40% {
      transform: translate3d(36px, -45px, 0);
    }
    60% {
      transform: translate3d(-22px, -35px, 0);
    }
    80% {
      transform: translate3d(42px, 18px, 0);
    }
  }

  /* ?tune only. The stage normally sits at z-index -2, behind the whole page,
     which is exactly where the tuning pane would end up too. In tune mode the
     hero is lifted over the sections below it, the pane is pulled out of the
     stage's two-column grid and floated, and the copy stays on top so the
     headline can still be judged against the photograph. */
  .hero.tune {
    z-index: 50;
  }
  .hero.tune .stage {
    z-index: 0;
  }
  /* The copy box spans the whole hero, so it sits over the fixed pane in the
     top-right corner and swallows every click aimed at it. In tune mode it is
     there to be looked at, not used. */
  .hero.tune .hero-inner {
    position: relative;
    z-index: 1;
    pointer-events: none;
  }
  .hero.tune .stage :global(.work) {
    display: block;
  }
  .hero.tune .stage :global(.panel) {
    position: fixed;
    pointer-events: auto;
    top: 5rem;
    right: 1rem;
    z-index: 2;
    width: 21rem;
    max-height: calc(100vh - 2rem);
    overflow: auto;
  }
  /* The copy box spans the whole hero, so it lies over the board and swallows
     every pointer event aimed at it — which is what kept the flap board from
     being hoverable. Children get their events back rather than just the links,
     so the headline and pitch stay selectable; they are narrow left-column
     blocks, so handing them back does not re-cover the board. */
  .hero-inner {
    pointer-events: none;
  }
  .hero-inner > * {
    pointer-events: auto;
  }
  .hero-inner {
    /* The photograph is left-anchored and `cover`, so it is never narrower than
       the viewport and the concourse board always begins at 36.1% of whatever
       width the photo ends up displayed at. The copy column is placed against
       that edge rather than against a centred container, which at wide viewports
       drifts right faster than the board does and walks the text onto it. */
    --photo-w: max(100vw, calc(max(30rem, min(82vh, 48vw)) * 2.3447));
    --board-x: calc(0.361 * var(--photo-w));
    max-width: none;
    margin: 0;
    padding: 6rem var(--gutter) var(--space-5)
      min(
        max(var(--gutter), calc((100vw - 74rem) / 2 + var(--gutter))),
        calc(var(--board-x) - 30rem)
      );
    min-height: max(30rem, min(82vh, 48vw));
    display: grid;
    align-content: center;
    justify-items: start;
    gap: var(--space-3);
  }
  /* Only the headline sits on the photograph, in the clear glass to the left
     of the board — about 22rem once the container gutter is taken off. */
  .rotor {
    display: grid;
    max-width: 27rem;
  }
  .slab {
    grid-area: 1 / 1;
  }
  .rotor h1 {
    font-family: var(--font-display);
    font-stretch: var(--display-wide);
    font-weight: 500;
    font-size: clamp(2rem, 3.1vw, 2.75rem);
    line-height: 1.04;
    letter-spacing: -0.015em;
    color: #edf3ef;
  }
  .rotor h1 span {
    display: block;
    animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) backwards;
    animation-delay: calc(var(--n) * 110ms);
  }
  .rotor h1 span.last {
    font-style: italic;
    color: #f0d489;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(0.5em);
    }
  }

  /* The hero says what the thing is, once, in the same glass as the headline. */
  .pitch {
    max-width: 27rem;
    color: rgb(237 243 239 / 0.82);
    font-size: 1.02rem;
    line-height: 1.5;
  }
  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
  }
  .hero-actions .btn {
    background: #f0f5f1;
    color: #12211c;
  }
  .hero-actions .btn:hover {
    background: #fff;
  }

  .ticks {
    list-style: none;
    display: flex;
    gap: 0.5rem;
  }
  .ticks button {
    width: 2.2rem;
    height: 3px;
    padding: 0;
    border: none;
    border-radius: 2px;
    background: rgb(237 243 239 / 0.28);
    transition: background 0.25s ease;
  }
  .ticks button:hover {
    background: rgb(237 243 239 / 0.6);
  }
  .ticks button[aria-current="true"] {
    background: #f0d489;
  }

  /* Narrow: the photograph becomes a band of its own and the copy sits under
     it, rather than being squeezed on top of the board. */
  @media (max-width: 860px) {
    .stage {
      position: relative;
      height: 42vh;
      min-height: 15rem;
      z-index: 0;
    }
    .hero::before {
      background: linear-gradient(180deg, rgb(6 16 13 / 0.55) 0%, rgb(6 16 13 / 0) 30%);
    }
    .hero-inner {
      min-height: 0;
      padding: var(--space-5) var(--gutter) var(--space-6);
    }
    .rotor,
    .pitch {
      max-width: none;
    }
    .rotor h1 {
      font-size: clamp(2.1rem, 8vw, 3rem);
    }
  }

  /* ---- the week board, still in the photograph's world ------------------ */
  .weekband {
    background: #0c1512;
    border-top: 1px solid rgb(240 244 232 / 0.1);
    color: #edf3ef;
  }
  .weekband-inner {
    max-width: 74rem;
    margin: 0 auto;
    padding: var(--space-6) var(--gutter);
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    align-items: center;
    gap: var(--space-6);
  }
  @media (max-width: 900px) {
    .weekband-inner {
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }
  }
  /* Not --text-h2: that is sized for the full 74rem measure, and this headline
     lives in a column half that wide, where 3.75rem wraps to five lines. */
  .weekband h2 {
    font-family: var(--font-display);
    font-stretch: var(--display-wide);
    font-weight: 500;
    font-size: clamp(1.85rem, 2.7vw, 2.3rem);
    line-height: 1.1;
    letter-spacing: -0.02em;
    text-wrap: balance;
    margin-bottom: var(--space-3);
  }
  .weekband-copy p {
    color: rgb(237 243 239 / 0.76);
    font-size: var(--text-lead);
    max-width: 38ch;
  }
  .weekband-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    margin-top: var(--space-4);
  }
  .weekband .btn {
    background: #f0f5f1;
    color: #12211c;
  }
  .weekband .btn:hover {
    background: #fff;
  }
  .quiet {
    color: rgb(237 243 239 / 0.82);
    font-size: 0.92rem;
    text-decoration: none;
    border-bottom: 1px solid rgb(237 243 239 / 0.35);
    padding-bottom: 1px;
  }
  .quiet:hover {
    color: #fff;
    border-bottom-color: #fff;
  }
  .proof {
    margin-top: var(--space-4);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: rgb(237 243 239 / 0.5);
  }
  /* the measure cap above is for the lead paragraph; this line is one mono
     sentence and fits the column unbroken without it */
  .weekband-copy .proof {
    font-size: 0.78rem;
    max-width: none;
  }

  /* ---- page ------------------------------------------------------------ */
  main {
    max-width: 74rem;
    margin: 0 auto;
    padding: 0 var(--gutter);
  }
  section.band {
    padding-block: var(--section-y);
  }
  /* holds the Airspace layer's negative z-index inside its own band. No
     overflow here on purpose: the layer spans the viewport, so clipping it to
     this box is what cut a straight edge through a cloud. It sizes itself to
     the band, and the svg's own "meet" fits the artwork inside without ever
     cropping it, so there is nothing here that needs clipping. */
  section.air {
    position: relative;
    isolation: isolate;
  }
  .band + .band {
    border-top: 1px solid var(--color-border);
  }

  h2 {
    font-family: var(--font-display);
    font-stretch: var(--display-wide);
    font-weight: 500;
    font-size: var(--text-h2);
    line-height: 1.08;
    letter-spacing: -0.02em;
    max-width: var(--measure-heading);
    text-wrap: balance;
    margin-bottom: var(--space-3);
  }
  h3 {
    font-size: var(--text-h3);
    font-weight: 600;
    margin-bottom: var(--space-1);
  }
  .lead {
    font-size: var(--text-lead);
    color: var(--color-muted);
    max-width: var(--measure);
  }
  .measure {
    max-width: var(--measure);
  }
  .kicker {
    margin-top: var(--space-5);
    color: var(--color-muted);
    font-size: 0.95rem;
  }

  .btn {
    display: inline-block;
    padding: 0.8rem 1.4rem;
    border-radius: var(--radius);
    background: var(--color-primary);
    color: var(--color-surface);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.95rem;
    border: 1px solid transparent;
    transition: background 0.15s ease;
  }
  .btn:hover {
    background: var(--color-primary-hover);
  }

  .steps {
    list-style: none;
    margin: var(--space-4) 0 0;
    display: grid;
    gap: var(--space-4);
    max-width: 46rem;
  }
  .steps li {
    display: grid;
    grid-template-columns: 2rem 1fr;
    gap: var(--space-3);
  }
  .steps .n {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--color-primary);
    padding-top: 0.2rem;
  }
  .steps p {
    color: var(--color-muted);
    font-size: 0.95rem;
    /* The three steps sit in a wide grid track, which left these running to about
       ninety characters a line. Small text needs the cap more than large does. */
    max-width: var(--measure);
  }

  .limits {
    list-style: none;
    margin-top: var(--space-6);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
    display: grid;
    gap: var(--space-2);
    max-width: var(--measure);
  }
  .limits li {
    font-size: 0.83rem;
    color: var(--color-muted);
    padding-left: 1rem;
    position: relative;
  }
  .limits li::before {
    content: "—";
    position: absolute;
    left: 0;
  }

  footer {
    border-top: 1px solid var(--color-border);
    padding: var(--space-5) var(--gutter);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-3);
    font-size: 0.83rem;
    color: var(--color-muted);
    max-width: 74rem;
    margin: 0 auto;
  }
  footer a {
    color: var(--color-muted);
  }
</style>
