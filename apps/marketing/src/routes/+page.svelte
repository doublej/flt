<script lang="ts">
import BriefForm from '$lib/components/BriefForm.svelte'
import FareRange from '$lib/components/FareRange.svelte'
import PriceTiers from '$lib/components/PriceTiers.svelte'
import ReportShowcase from '$lib/components/ReportShowcase.svelte'
import WeekBoard from '$lib/components/WeekBoard.svelte'
import { AVOIDING, CABIN, DISCOVERY, GRAPH, TOTALS } from '$lib/scenarios'
import { onMount } from 'svelte'

let tier = $state('survey')
let scrolled = $state(false)
let hero: HTMLElement

const nf = new Intl.NumberFormat('en-GB')

/** The header sits on the photograph until you have scrolled past it, then
 *  takes the page background so the links stay readable. */
onMount(() => {
  const io = new IntersectionObserver(
    (e) => {
      scrolled = !e[0].isIntersecting
    },
    { rootMargin: '-68px 0px 0px 0px' },
  )
  io.observe(hero)
  return () => io.disconnect()
})

const STEPS = [
  {
    h: 'Tell us roughly what you want',
    p: 'Where from, where to, and the rough dates. Several destinations is fine. Vague is fine — that is the part we are good at.',
  },
  {
    h: 'We price every date',
    p: 'One search at a time, a few seconds apart, because a flight site that gets too many requests at once stops answering. It takes minutes, and you do not have to sit through them.',
  },
  {
    h: 'A report arrives',
    p: 'A PDF with prices day by day, options ranked by price and journey time, and a link to book each one. You book in the same place you always did.',
  },
]

const LIMITS = [
  'We do not book or ticket anything. We find the options and hand you the links.',
  'Prices come from public flight search results, not from the airlines. They are what was showing when we looked, so they can change before you book.',
  'Display price only — no baggage rules, fare conditions or tax breakdown.',
  'The engine is a public command-line tool called flt. It is on GitHub, and you are welcome to run it yourself and skip us entirely.',
]
</script>

<header class:solid={scrolled}>
  <div class="bar">
    <a class="mark" href="#top">Bureau</a>
    <nav>
      <a href="#report">The report</a>
      <a href="#pricing">Pricing</a>
      <a class="cta" href="#brief">Send a brief</a>
    </nav>
  </div>
</header>

<section class="hero" id="top" bind:this={hero}>
  <img src="/img/terminal.jpg" alt="" width="2000" height="853" fetchpriority="high" />
  <div class="hero-inner">
    <div class="hero-copy">
      <p class="eyebrow">Bureau — flight research</p>
      <h1>The same seat.<br />A different day.<br /><em>A different price.</em></h1>
      <p class="lead">
        We price every departure date in your window and send you the answer, so you are not the
        one holding nine tabs open at one in the morning.
      </p>
      <div class="hero-actions">
        <a class="btn" href="#brief">Send a brief — from €7</a>
        <a class="quiet" href="#report">See a real report</a>
      </div>
    </div>
  </div>
</section>

<section class="weekband">
  <div class="weekband-inner">
    <div class="weekband-copy">
      <h2>Pick a route</h2>
      <p>
        Nine real briefs, each priced on all seven departure dates in its window. Moving your dates
        was worth €147 on New York and €9 on Lyon — and nothing about either route said so in
        advance.
      </p>
      <p class="proof">
        {TOTALS.queries} searches · {nf.format(TOTALS.options)} options · {TOTALS.carriers} airlines
        · one afternoon
      </p>
    </div>
    <WeekBoard />
  </div>
</section>

<main>
  <section class="band" id="evidence">
    <h2>Nine routes, one week each</h2>
    <p class="lead measure">
      Every one of these was searched on all seven departure dates. Flexibility paid enormously on
      some and almost nothing on others, and nothing about the route tells you which in advance.
    </p>
    <FareRange />
    <p class="measure kicker">
      Cabin makes its own point. Across that Singapore week economy moved between €{CABIN
        .economyLow} and €{CABIN.economyHigh}, while premium economy sat at €{CABIN.premiumFlat} on
      every single day. So the step up cost €{CABIN.premiumFlat - CABIN.economyHigh} on the dearest
      economy day and €{CABIN.premiumFlat - CABIN.economyLow} on the cheapest — the upgrade never
      moved, only the thing you were comparing it against.
    </p>

    <div class="asides">
      <div>
        <h3>Avoiding an airport has a price too</h3>
        <p>
          Skip every option connecting in Dubai, Doha or Abu Dhabi and the cheapest fare to
          Singapore rises €{AVOIDING[0].cheapestAvoiding - AVOIDING[0].cheapest}, from €{AVOIDING[0]
            .cheapest} to €{AVOIDING[0].cheapestAvoiding}. On the Hanoi brief the same preference
          cost nothing at all — more of those options connected in the Gulf, but the cheapest one
          already went another way.
        </p>
      </div>
      <div>
        <h3>Most routes are not on the first page</h3>
        <p>
          We start from a map of {nf.format(GRAPH.airports)} airports and {nf.format(
            GRAPH.connections,
          )} direct connections. {DISCOVERY.route} can be flown {nf.format(
            DISCOVERY.byStops[2].routes,
          )} ways within three stops. These are possible routes rather than offers: no price, no
          timetable check, and nothing you can book. What they do is tell us where it is worth
          pointing the search.
        </p>
      </div>
    </div>
  </section>

  <section class="band" id="report">
    <h2>What you get</h2>
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
    <ReportShowcase />
  </section>

  <section class="band" id="pricing">
    <h2>You pay for how far the search goes</h2>
    <p class="lead measure">
      One date is cheap. Five destinations across a fortnight in two cabins is not, because it is
      more work. The New York job above took 28 searches and found €147 between the best day and the
      worst.
    </p>
    <PriceTiers bind:selected={tier} />
    <p class="measure kicker">
      One route on one fixed date? Do not pay us. Google Flights does that free in ninety seconds.
      We are worth the money once there are several destinations and a spread of dates, which is
      where tabs stop being any help.
    </p>
  </section>

  <section class="band" id="brief">
    <h2>Send a brief</h2>
    <p class="lead measure">
      Tell us roughly what you are after. You will get the report back the same day.
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
    font-size: 1.3rem;
    color: #f4f6ee;
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
    color: rgb(244 246 238 / 0.8);
    text-decoration: none;
    transition: color 0.25s ease;
  }
  header nav a:hover {
    color: #fff;
  }
  header nav .cta {
    color: #10201a;
    background: #f4f6ee;
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
  }
  .hero img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    /* pushes the photograph's own board clear of the headline column */
    object-position: 22% 46%;
    filter: saturate(1.04);
    z-index: -2;
  }
  .hero::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      linear-gradient(
        90deg,
        rgb(6 16 13 / 0.95) 0%,
        rgb(6 16 13 / 0.9) 22%,
        rgb(6 16 13 / 0.55) 34%,
        rgb(6 16 13 / 0.12) 46%,
        rgb(6 16 13 / 0.08) 70%,
        rgb(6 16 13 / 0.4) 100%
      ),
      linear-gradient(180deg, rgb(6 16 13 / 0.7) 0%, rgb(6 16 13 / 0) 22%);
  }
  .hero-inner {
    max-width: 74rem;
    margin: 0 auto;
    padding: 5.5rem var(--gutter) var(--space-6);
    min-height: max(36rem, min(92vh, 54vw));
    display: grid;
    align-items: center;
  }
  /* The clear glass to the left of the board is about 20rem wide once the
     container gutter is taken off, so the column is set to exactly that. */
  .hero-copy {
    max-width: 20rem;
    color: #f2f4ec;
  }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgb(242 244 236 / 0.6);
    margin-bottom: var(--space-4);
  }
  h1 {
    font-family: var(--font-display);
    font-weight: 300;
    font-size: clamp(2rem, 3.8vw, 3.1rem);
    line-height: 1.02;
    letter-spacing: -0.02em;
    text-wrap: balance;
    margin-bottom: var(--space-4);
  }
  h1 em {
    font-style: italic;
    color: #f0d489;
  }
  .hero .lead {
    color: rgb(242 244 236 / 0.84);
    font-size: 1rem;
  }
  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    margin-top: var(--space-5);
  }
  .quiet {
    color: rgb(242 244 236 / 0.82);
    font-size: 0.92rem;
    text-decoration: none;
    border-bottom: 1px solid rgb(242 244 236 / 0.35);
    padding-bottom: 1px;
  }
  .quiet:hover {
    color: #fff;
    border-bottom-color: #fff;
  }
  .hero .btn {
    background: #f4f6ee;
    color: #10201a;
  }
  .hero .btn:hover {
    background: #fff;
  }

  /* Narrow: the photograph becomes a band of its own and the copy sits under
     it, rather than being squeezed on top of the board. */
  @media (max-width: 860px) {
    .hero img {
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
      padding-top: var(--space-5);
      padding-bottom: var(--space-6);
    }
    .hero-copy {
      max-width: none;
    }
    .hero h1 {
      font-size: clamp(2.1rem, 8vw, 3rem);
    }
  }

  /* ---- the week board, still in the photograph's world ------------------ */
  .weekband {
    background: #0c1512;
    border-top: 1px solid rgb(240 244 232 / 0.1);
    color: #f2f4ec;
  }
  .weekband-inner {
    max-width: 74rem;
    margin: 0 auto;
    padding: var(--space-6) var(--gutter);
    display: grid;
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
    align-items: center;
    gap: var(--space-6);
  }
  @media (max-width: 900px) {
    .weekband-inner {
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }
  }
  .weekband h2 {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: var(--text-h2);
    line-height: 1.12;
    letter-spacing: -0.015em;
    margin-bottom: var(--space-3);
  }
  .weekband-copy p {
    color: rgb(242 244 236 / 0.76);
    font-size: var(--text-lead);
    max-width: 34ch;
  }
  .proof {
    margin-top: var(--space-4);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: rgb(242 244 236 / 0.5);
  }
  .weekband-copy .proof {
    font-size: 0.78rem;
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
  .band + .band {
    border-top: 1px solid var(--color-border);
  }

  h2 {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: var(--text-h2);
    line-height: 1.12;
    letter-spacing: -0.015em;
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

  .asides {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: var(--space-3);
    margin-top: var(--space-6);
  }
  .asides > div {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }
  .asides h3 {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(1.25rem, 2.1vw, 1.7rem);
    line-height: 1.12;
    letter-spacing: -0.01em;
    margin: 0;
    text-wrap: balance;
  }
  .asides p {
    margin: 0;
    color: var(--color-text);
    font-size: clamp(1.05rem, 1.7vw, 1.35rem);
    line-height: 1.35;
    text-wrap: pretty;
  }

  .steps {
    list-style: none;
    margin: 0 0 var(--space-6);
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
