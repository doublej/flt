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
import { en as copy } from '$lib/i18n/en'
import { CABIN, DISCOVERY, FLEX, SPREADS, TOTALS } from '$lib/scenarios'
import { onMount } from 'svelte'
import { fade } from 'svelte/transition'

let tier = $state('survey')
let scrolled = $state(false)
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
/* The headline's figure is what a flexible week was worth on that route, read
   off SPREADS rather than written down, so the display type and the flap board
   below it are quoting the same row. A headline naming a route that is not on
   the board is a copy bug, and it throws at module load rather than rendering
   a blank. */
const HEADLINES = copy.hero.headlines.map((h) => {
  const i = SPREADS.findIndex((r) => r.route === h.route)
  if (i < 0) throw new Error(`hero headline names a route that is not in SPREADS: ${h.route}`)
  return { ...h, row: i, spread: SPREADS[i].high - SPREADS[i].low }
})
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
  { x: 0.3565, y: 0.427 },
  { x: 0.6445, y: 0.427 },
  { x: 0.6445, y: 0.633 },
  { x: 0.3565, y: 0.633 },
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
  supersample: 4,
  glass: false,
  bg: '#000000ff',
  pad: 0.42000000000000004,
  face: '#131313',
  ink: '#dfd6c4',
  aspect: 0.495,
  glyph: 1.07,
  squeeze: 0.66,
  baseline: 0.014,
  rowgap: 0.125,
  grit: 0.3,
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

const DEP_ROWS = SPREADS.map((r) => {
  const i = r.days.indexOf(r.low)
  const m = r.window.match(/^(\d+)\D+\d+\s+(\w+)$/)
  const day = m ? String(Number(m[1]) + i) : ''
  const mon = (m?.[2] ?? '').toUpperCase()
  return {
    day: `${day.padStart(2, '0')} ${mon}`,
    to: r.route.replace('Amsterdam → ', '').toUpperCase(),
    fare: copy.hero.boardFare(r.low),
    save: copy.hero.boardSave(r.high - r.low),
  }
})

/* The board leads with whatever route the headline is naming. A swap and not a
   reorder: two rows flap on each rotation instead of all nine, which reads as
   the board answering the headline rather than as the whole thing churning. */
const DEPARTURES = $derived.by(() => {
  const rows = DEP_ROWS.slice()
  const i = HEADLINES[hi].row
  if (i > 0) [rows[0], rows[i]] = [rows[i], rows[0]]
  return rows
})

const nf = new Intl.NumberFormat('en-GB')

/** The bar's type is dark, because at rest it stands on the page's own ground
 *  above the hero panel rather than on the photograph. It is sticky, though, so
 *  the moment the page moves it is over that black panel — which is why it takes
 *  its background on the first pixel of scroll and not, as it used to, only once
 *  the whole hero had gone past. */
onMount(() => {
  tuning = new URLSearchParams(location.search).has('tune')

  const onScroll = () => {
    scrolled = window.scrollY > 8
  }
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => window.removeEventListener('scroll', onScroll)
  }
  const t = setInterval(() => {
    if (!held) hi = (hi + 1) % HEADLINES.length
  }, 5200)
  return () => {
    window.removeEventListener('scroll', onScroll)
    clearInterval(t)
  }
})

const STEPS = copy.report.steps

const LIMITS = copy.brief.limits
</script>

<header class:solid={scrolled}>
  <div class="bar">
    <a class="mark" href="#top">{copy.nav.brand}</a>
    <nav>
      <a href="#report">{copy.nav.howItWorks}</a>
      <a href="#pricing">{copy.nav.pricing}</a>
      <a class="cta" href="#brief">{copy.nav.brief}</a>
    </nav>
  </div>
</header>

<section class="hero" class:tune={tuning} id="top">
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
        sign={copy.hero.boardSign}
        editable={tuning}
        storageKey="hero"
      />
    {/key}
  </div>
  <div class="hero-inner">
    <div class="rotor" aria-live="polite">
      {#key hi}
        <div class="slab" in:fade={{ duration: 600 }} out:fade={{ duration: 300 }}>
          <p class="route">{HEADLINES[hi].kicker}</p>
          <h1>
            <em>€{HEADLINES[hi].spread}</em>
            <span class="clause">{copy.hero.clause}</span>
          </h1>
        </div>
      {/key}
    </div>
    <p class="pitch">{copy.hero.pitch}</p>
    <div class="hero-actions">
      <a class="btn" href="#brief">{copy.hero.ctaBrief}</a>
      <a class="quiet" href="#report">{copy.hero.ctaHow}</a>
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
      <h2>{copy.weekband.heading(FLEX.best)}</h2>
      <p>{copy.weekband.body(FLEX.best, FLEX.worst)}</p>
      <div class="weekband-actions">
        <a class="btn" href="#brief">{copy.weekband.ctaBrief}</a>
        <a class="quiet" href="#report">{copy.weekband.ctaHow}</a>
      </div>
      <p class="proof">
        {copy.weekband.proof(
          TOTALS.queries,
          nf.format(TOTALS.options),
          TOTALS.carriers,
          TOTALS.searchingSeconds,
        )}
      </p>
    </div>
    <WeekBoard />
  </div>
</section>

<main>
  <section class="band" id="evidence">
    <h2>{copy.evidence.heading(FLEX.best, FLEX.worst)}</h2>
    <p class="lead measure">
      {copy.evidence.lead(FLEX.paidForItself, FLEX.routes, FLEX.timesOver)}
    </p>
    <FareRange />
    <p class="measure kicker">
      {copy.evidence.kicker(
        CABIN.economyLow,
        CABIN.economyHigh,
        CABIN.premiumFlat,
        CABIN.premiumFlat - CABIN.economyHigh,
        CABIN.premiumFlat - CABIN.economyLow,
      )}
    </p>

  </section>

  <section class="band" id="work">
    <h2>{copy.work.heading}</h2>
    <p class="lead measure">{copy.work.lead}</p>
    <QueryGrid />
  </section>

  <section class="band" id="avoid">
    <h2>{copy.avoid.heading}</h2>
    <p class="lead measure">{copy.avoid.lead}</p>
    <AvoidHubs />
  </section>

  <section class="band" id="routes">
    <h2>{copy.routes.heading(nf.format(DISCOVERY.byStops[2].routes), DISCOVERY.seconds)}</h2>
    <p class="lead measure">{copy.routes.lead}</p>
    <RouteWeb />
  </section>

  <section class="band air" id="report">
    <Airspace set={0} />
    <h2>{copy.report.heading}</h2>
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
    <h2>{copy.pricing.heading}</h2>
    <p class="lead measure">{copy.pricing.lead}</p>
    <PriceTiers bind:selected={tier} />
    <p class="measure kicker">{copy.pricing.kicker}</p>
  </section>

  <section class="band air" id="brief">
    <Airspace set={2} />
    <h2>{copy.brief.heading}</h2>
    <p class="lead measure">{copy.brief.lead}</p>
    <BriefForm {tier} />
    <ul class="limits">
      {#each LIMITS as l}
        <li>{l}</li>
      {/each}
    </ul>
  </section>
</main>

<footer>
  <p>{copy.footer.line}</p>
  <nav>
    <a href="https://github.com/jurrejan/flights">{copy.footer.github}</a>
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
    /* the bar stands on the page now, not on the photograph */
    color: var(--color-text);
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
    color: var(--color-muted);
    text-decoration: none;
    transition: color 0.25s ease;
  }
  header nav a:hover {
    color: var(--color-text);
  }
  header nav .cta {
    color: var(--color-surface);
    background: var(--color-primary);
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
    /* The hero is a panel laid on the page rather than a band bled to its
       edges: inset by the gutter and rounded hard, so the photograph reads as
       a held object and the page's own ground frames it. */
    margin: 0 var(--gutter) var(--gutter);
    border-radius: clamp(1.5rem, 3vw, 2.75rem);
    isolation: isolate;
    background: #000;
    /* the camera moves, so the stage is oversized and the hero clips it — and
       the same clip is what keeps the photograph inside the rounded corners */
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
     of the board — about 30rem once the container gutter is taken off.

     The headline used to be three lines of prose quoting two fares and their
     difference, set beside a flap board already showing all three numbers one
     column over. So it is now one figure and one clause: the board carries the
     evidence, the type carries the claim, and the figure gets the room that
     buys. Everything in here is sized off that figure. */
  .rotor {
    display: grid;
    max-width: 30rem;
  }
  .slab {
    grid-area: 1 / 1;
  }
  /* The route, in the board's own idiom — mono, letterspaced, amber — so the
     eye ties this line to the row that just flapped to the top. */
  .route {
    font-family: var(--font-mono);
    font-size: clamp(0.68rem, 0.85vw, 0.78rem);
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: #f0d489;
    margin-bottom: 1.1em;
    animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  }
  .rotor h1 {
    font-family: var(--font-display);
    font-stretch: var(--display-wide);
    font-weight: 500;
    color: #edf3ef;
  }
  /* The one piece of type on this page allowed to be this big. Three digits and
     a currency mark at worst, so it cannot wrap; the cap is set by the clear
     glass to the left of the board, not by the text. */
  .rotor h1 em {
    display: block;
    font-style: normal;
    font-size: clamp(4.25rem, 10.4vw, 9.75rem);
    line-height: 0.8;
    letter-spacing: -0.055em;
    animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) backwards;
    animation-delay: 90ms;
  }
  .rotor h1 .clause {
    display: block;
    max-width: 17em;
    margin-top: 0.8rem;
    font-size: clamp(1.05rem, 1.45vw, 1.3rem);
    font-weight: 400;
    line-height: 1.22;
    letter-spacing: -0.012em;
    color: rgb(237 243 239 / 0.72);
    animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) backwards;
    animation-delay: 190ms;
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
  /* The hero is a black panel inset by the gutter, so this one is too: the two
     read as a stacked pair rather than as a card followed by a full-width band.
     Same radius, same inset, one notch off black so the seam between them is
     still legible. */
  .weekband {
    margin: 0 var(--gutter) var(--gutter);
    border-radius: clamp(1.5rem, 3vw, 2.75rem);
    background: #0c1512;
    color: #edf3ef;
  }
  .weekband-inner {
    max-width: 74rem;
    margin: 0 auto;
    padding: clamp(var(--space-6), 9vw, var(--space-7)) clamp(var(--gutter), 4vw, var(--space-5));
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
    font-size: clamp(2.15rem, 3.4vw, 3.05rem);
    line-height: 1.05;
    letter-spacing: -0.028em;
    text-wrap: balance;
    margin-bottom: var(--space-4);
  }
  .weekband-copy p {
    color: rgb(237 243 239 / 0.76);
    font-size: clamp(1.05rem, 1.35vw, 1.2rem);
    line-height: 1.55;
    max-width: 42ch;
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
