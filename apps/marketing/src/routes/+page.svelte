<script lang="ts">
import Bars from '$lib/components/Bars.svelte'
import BriefForm from '$lib/components/BriefForm.svelte'
import PriceTiers from '$lib/components/PriceTiers.svelte'
import ReportShowcase from '$lib/components/ReportShowcase.svelte'
import Scenarios from '$lib/components/Scenarios.svelte'
import TabStrip from '$lib/components/TabStrip.svelte'
import {
  AVOIDING,
  CABIN,
  DISCOVERY,
  GRAPH,
  LAYOVER_DISTINCT,
  LAYOVER_TOP,
  SPREADS,
  TOTALS,
} from '$lib/scenarios'

let tier = $state('survey')

const nf = new Intl.NumberFormat('en-GB')

const spreadBars = SPREADS.map((r) => ({
  label: r.route,
  value: r.high - r.low,
  display: `€${r.high - r.low}`,
  hint: `${r.window} · cheapest day €${r.low}, dearest €${r.high}`,
})).sort((a, b) => b.value - a.value)

const avoidBars = AVOIDING.flatMap((a) => [
  {
    label: `${a.route} — any routing`,
    value: a.cheapest,
    display: `€${a.cheapest}`,
  },
  {
    label: `${a.route} — not connecting in the Gulf`,
    value: a.cheapestAvoiding,
    display: `€${a.cheapestAvoiding}`,
    hint:
      a.cheapestAvoiding === a.cheapest
        ? `No change. ${a.viaGulf} of ${nf.format(a.options)} options connected in the Gulf, but the cheapest already did not.`
        : `€${a.cheapestAvoiding - a.cheapest} more. ${a.viaGulf} of ${nf.format(a.options)} options connected in the Gulf.`,
  },
])

const hubBars = LAYOVER_TOP.map((h) => ({
  label: h.code,
  value: h.count,
  display: nf.format(h.count),
}))

const ERAS = [
  {
    year: '1985',
    title: 'Someone else did this.',
    body: 'You said where you wanted to go and roughly when. They went away, did the work, and came back with four options and a reason for each. You never saw the searching, which was rather the point.',
  },
  {
    year: '2015',
    title: 'You did it. Badly. At 1am.',
    body: 'The agents closed and the work landed on you. Eleven tabs, a price you half remember from Tuesday, and a booking made mostly to stop looking at it.',
  },
  {
    year: 'Today',
    title: "We do it again, and we don't get bored on search 26.",
    body: 'Same job, same patience. You tell us what you want, we search every route and date you asked for, and a report comes back with the numbers laid out and links to book.',
  },
]

const HONEST = [
  {
    is: false,
    text: "One route on one fixed date? Do it yourself — Google Flights takes ninety seconds and costs nothing. We're worth paying for at five destinations across nine dates, where tabs stop being any help.",
  },
  { is: true, text: 'Searches every route and date combination you ask for, one after another.' },
  {
    is: true,
    text: 'Sends a PDF: a map, price-by-date charts, ranked options with airline, routing and total time.',
  },
  {
    is: true,
    text: 'Gives you a booking link for each option. You book in the same place you always did.',
  },
  {
    is: false,
    text: "Excluding an airport filters what came back, rather than searching differently. We read every option and then drop the ones connecting where you didn't want, which is also how we can tell you what it cost you. It only matches connecting airports, so it can't exclude where you start or land. Excluding an airline is best-effort — a codeshare can slip through under a different name.",
  },
  {
    is: false,
    text: "The map of possible routes comes from a published snapshot of who flies where, and treats every route as two-way even where it's only flown one way. These routes have no price, haven't been checked against a timetable, and can't be booked. They tell us where to search. They are never the answer.",
  },
  {
    is: true,
    text: "The engine is a public command-line tool called flt. It's on GitHub — you can read it, or run it yourself and skip us entirely.",
  },
  {
    is: false,
    text: "We don't book flights. We don't ticket or hold anything, and no payment to an airline goes through us.",
  },
  {
    is: false,
    text: "Prices come from public flight search results, not from the airlines. They're what was showing when we looked, so they can change before you book.",
  },
  {
    is: false,
    text: 'Display price only — no baggage rules, fare conditions, tax breakdown or loyalty earning.',
  },
  {
    is: false,
    text: 'Return-trip date grids are capped at 21 departure and return combinations. The seven-day windows in the examples above were our choice, not a limit — a wider search just costs more, because it is more work.',
  },
]

const STEPS = [
  {
    n: '01',
    h: 'Brief the Bureau',
    p: 'Where from, where to, roughly when, and what you care about. Two minutes.',
  },
  {
    n: '02',
    h: 'It works the routes',
    p: "We search every destination against every date, one at a time, with a pause between each. It takes a few minutes and you don't have to sit through them.",
  },
  {
    n: '03',
    h: 'The report arrives',
    p: "A PDF arrives in your inbox. Read it on your phone, argue about it over dinner, then book from the links once you've decided.",
  },
]
</script>

<header>
  <a class="mark" href="#top">Bureau</a>
  <nav>
    <a href="#report">The report</a>
    <a href="#pricing">Pricing</a>
    <a class="cta" href="#brief">Brief the Bureau</a>
  </nav>
</header>

<main id="top">
  <!-- 1. Hero -->
  <section class="hero">
    <p class="eyebrow">Bureau — we bring back travel agents</p>
    <h1>
      One route. One week. <br />
      <em>€335 to €4,586.</em>
    </h1>
    <p class="lead">
      Those are one-way fares to Singapore, all in the same week. We read 1,060 options to find
      both ends of that range. Google shows you a screenful and leaves the rest to you.
    </p>
    <p class="lead">
      Bureau does the searching for you. Tell us where you want to go and roughly when. We check
      every route against every date you're considering and send back a PDF: prices day by day,
      options ranked, and a link to book each one.
    </p>
    <div class="hero-actions">
      <a class="btn" href="#brief">Brief the Bureau — two minutes</a>
      <a class="btn ghost" href="#answers">See what it finds</a>
    </div>
    <div class="strip"><TabStrip /></div>
  </section>

  <div class="rule" aria-hidden="true">
    <i></i><span></span><i></i><span></span><i></i>
  </div>

  <!-- 2. Three questions a tab cannot answer -->
  <section class="band" id="answers">
    <h2>Three questions a tab cannot answer</h2>
    <p class="lead measure">
      Each one needs dozens of searches lined up next to each other, and a browser tab shows you
      one search at a time. Every number below comes from real runs, listed further down.
    </p>

    <div class="qa">
      <h3>Is it worth moving my dates?</h3>
      <p class="measure">
        Sometimes it saves you a lot. Sometimes it saves you nothing at all. Here are nine routes,
        each across a seven-day window:
      </p>
      <Bars bars={spreadBars} unit="The gap between the cheapest and the most expensive departure date within one seven-day window. One-way economy fares, the cheapest we saw at the time." />
      <p class="measure kicker">
        Moving your New York flight a few days saves €147. The same shift to Lyon saves €9. You
        can't tell which one you're dealing with until someone checks both.
      </p>
    </div>

    <div class="qa">
      <h3>What does avoiding an airport cost?</h3>
      <p class="measure">
        Say you'd rather not connect in Dubai or Doha. That's an easy thing to ask for, but what
        it costs depends completely on where you're going:
      </p>
      <Bars bars={avoidBars} unit="The cheapest one-way fare we saw, before and after removing every option that connects in Dubai, Doha, Abu Dhabi, Bahrain, Muscat or Kuwait." />
      <p class="measure kicker">
        To Singapore it costs €73. To Hanoi it costs nothing, even though far more of the Hanoi
        options connected in the Gulf. The cheapest one there already went another way. There's no
        rule of thumb for this, which is why we check.
      </p>
    </div>

    <div class="qa">
      <h3>Which routes even exist?</h3>
      <p class="measure">
        Before we search anything, we check a map of which airports connect to which —
        {nf.format(GRAPH.airports)} airports and {nf.format(GRAPH.connections)} direct connections —
        and count the ways your trip could be put together without going more than three times the
        direct distance. {DISCOVERY.route}:
      </p>
      <ol class="stops">
        {#each DISCOVERY.byStops as s}
          <li>
            <span class="k">{s.stops} stop{s.stops > 1 ? 's' : ''}</span>
            <span class="v">{nf.format(s.routes)}</span>
            <span class="u">route{s.routes > 1 ? 's' : ''}</span>
          </li>
        {/each}
      </ol>
      <p class="measure kicker">
        Every extra connection you'll put up with multiplies the options about sixty times. This
        step takes {DISCOVERY.seconds} seconds and costs nothing, because nothing has been searched
        yet. It's a map of what connects, not a list of what's for sale — these routes have no
        price, haven't been checked against a timetable, and can't be booked. Some of them nobody
        sells at all. They just tell us where to point the search.
      </p>
    </div>
  </section>

  <div class="rule" aria-hidden="true">
    <i></i><span></span><i></i>
  </div>

  <!-- 3. The searching -->
  <section class="band" id="work">
    <h2>So we do the searching</h2>
    <p class="lead measure">
      Four real briefs, run start to finish in one afternoon. Not a demo and not an estimate — the
      counts come straight from the engine's own log.
    </p>
    <Scenarios />
  </section>

  <!-- 4. How it works -->
  <section class="band">
    <h2>How it works</h2>
    <ol class="steps">
      {#each STEPS as step}
        <li>
          <span class="n">{step.n}</span>
          <h3>{step.h}</h3>
          <p>{step.p}</p>
        </li>
      {/each}
    </ol>
    <p class="measure kicker">
      Searches go out one at a time, a few seconds apart, because a flight site that gets too many
      requests at once stops answering. That's why this takes minutes rather than seconds. You're
      not the one sitting there waiting for it.
    </p>
  </section>

  <div class="rule" aria-hidden="true">
    <i></i><span></span><i></i><span></span><i></i>
  </div>

  <!-- 5. The report -->
  <section class="band" id="report">
    <h2>What comes back</h2>
    <p class="lead measure">
      The kind of PDF a travel agent used to hand across the desk, covering every date you asked
      about.
    </p>
    <ReportShowcase />
  </section>

  <!-- 6. The aside -->
  <section class="band">
    <h2>This used to be someone's job</h2>
    <div class="eras">
      {#each ERAS as era}
        <article>
          <span class="year">{era.year}</span>
          <h3>{era.title}</h3>
          <p>{era.body}</p>
        </article>
      {/each}
    </div>
  </section>

  <!-- 7. Pricing -->
  <section class="band" id="pricing">
    <h2>Priced by depth, not by seat</h2>
    <p class="lead measure">
      You pay for how far the search goes: one route on one date, one route across a week of dates,
      or several destinations in more than one cabin. The New York job above took 28 searches and
      found €147 between the best day and the worst.
    </p>
    <PriceTiers bind:selected={tier} />
  </section>

  <div class="rule" aria-hidden="true">
    <i></i><span></span><i></i><span></span><i></i>
  </div>

  <!-- 8. Honesty panel -->
  <section class="band">
    <h2>The whole list, limits included</h2>
    <p class="lead measure">
      We don't sell tickets, so there's no airline deal to protect and no seats of our own to push.
      The cheapest option is at the top because it's the cheapest.
    </p>
    <ul class="honest">
      {#each HONEST as row}
        <li class:no={!row.is}>
          <span class="glyph" aria-hidden="true">{row.is ? '+' : '−'}</span>
          <span>{row.text}</span>
        </li>
      {/each}
    </ul>
    <div class="hubs">
      <h3>Where those {nf.format(TOTALS.options)} options changed planes</h3>
      <Bars bars={hubBars} unit="The six busiest of the {LAYOVER_DISTINCT} connecting airports we saw. This is how the network is shaped, not a recommendation." />
    </div>
  </section>

  <!-- 9. Brief -->
  <section class="band" id="brief">
    <h2>Brief the Bureau</h2>
    <p class="lead measure">
      Tell us roughly what you're after. Vague is fine — that's the part we're good at.
    </p>
    <BriefForm {tier} />
  </section>
</main>

<footer>
  <span class="mark">Bureau</span>
  <nav>
    <a href="https://doublej.github.io/flt/">flt — the CLI this runs on</a>
    <a href="https://github.com/doublej/flt">GitHub</a>
  </nav>
</footer>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem clamp(1rem, 5vw, 4rem);
    background: rgb(12 14 20 / 0.82);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border);
  }
  .mark {
    font-family: var(--font-mono);
    font-size: 1.15rem;
    letter-spacing: 0.06em;
    color: var(--color-text);
    text-decoration: none;
  }
  header nav {
    display: flex;
    align-items: center;
    gap: clamp(0.75rem, 2vw, 1.75rem);
    font-size: 0.9rem;
  }
  header nav a {
    color: var(--color-muted);
    text-decoration: none;
  }
  header nav a:hover {
    color: var(--color-text);
  }
  header nav a.cta {
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    border-radius: 999px;
    padding: 0.35rem 0.9rem;
  }
  header nav a.cta:hover {
    background: var(--color-primary);
    color: var(--color-bg);
  }

  main {
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 clamp(1rem, 5vw, 2rem);
  }

  section {
    padding-block: var(--section-y);
  }

  .hero {
    padding-top: clamp(3.5rem, 9vw, 7rem);
  }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--color-primary);
  }
  h1 {
    font-size: var(--text-display);
    line-height: 1.02;
    letter-spacing: -0.03em;
    font-weight: 600;
    margin: 1.5rem 0 1.75rem;
    max-width: 16ch;
  }
  h1 em {
    font-style: normal;
    color: var(--color-primary);
    text-shadow: 0 0 42px var(--color-amber-glow);
  }
  .lead {
    font-size: var(--text-lead);
    color: var(--color-muted);
    max-width: var(--measure);
  }
  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin: 2.25rem 0 clamp(3rem, 7vw, 5rem);
  }
  .btn {
    background: var(--color-primary);
    color: var(--color-bg);
    border-radius: var(--radius);
    padding: 0.85rem 1.5rem;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.2s ease;
  }
  .btn:hover {
    background: var(--color-primary-hover);
  }
  .btn.ghost {
    background: transparent;
    color: var(--color-text);
    border: 1px solid var(--color-border);
  }
  .btn.ghost:hover {
    background: transparent;
    border-color: var(--color-track);
  }

  .strip {
    animation: rise 0.9s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
  }

  .qa {
    margin-top: 3.5rem;
  }
  .qa h3 {
    font-size: clamp(1.2rem, 2.2vw, 1.6rem);
    margin: 0 0 0.75rem;
    text-wrap: balance;
  }
  .qa > p:first-of-type {
    margin-bottom: 1.75rem;
  }
  .qa .kicker {
    margin-top: 1.5rem;
  }

  .stops {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.5rem;
    max-width: 30rem;
  }
  .stops li {
    display: grid;
    grid-template-columns: 6rem auto 1fr;
    gap: 0.75rem;
    align-items: baseline;
    padding-block: 0.5rem;
    border-bottom: 1px solid var(--color-border);
  }
  .stops .k {
    color: var(--color-muted);
    font-size: 0.85rem;
  }
  .stops .v {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: clamp(1.3rem, 3vw, 1.9rem);
    color: var(--color-primary);
    text-shadow: 0 0 20px var(--color-amber-glow);
  }
  .stops .u {
    color: var(--color-muted);
    font-size: 0.85rem;
  }

  .hubs {
    margin-top: 3rem;
  }
  .hubs h3 {
    font-size: 1.05rem;
    margin: 0 0 1.25rem;
    color: var(--color-muted);
    font-weight: 500;
  }

  /* Section divider, borrowed from the app's flight-path rule */
  .rule {
    display: flex;
    align-items: center;
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 clamp(1rem, 5vw, 2rem);
  }
  .rule i {
    flex: 1;
    height: 1px;
    background: var(--color-track);
  }
  .rule i:nth-of-type(2) {
    flex: 2;
  }
  .rule span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    border: 1.5px solid var(--color-muted);
    background: var(--color-bg);
    margin: 0 4px;
    flex-shrink: 0;
  }

  h2 {
    font-size: var(--text-h2);
    line-height: 1.1;
    letter-spacing: -0.02em;
    font-weight: 600;
    margin-bottom: 1.25rem;
    max-width: 20ch;
  }
  h3 {
    font-size: var(--text-h3);
    font-weight: 600;
    line-height: 1.25;
  }
  .kicker {
    margin-top: 2rem;
    color: var(--color-muted);
  }

  .eras {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 2.5rem;
  }
  .eras article {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    border-top: 1px solid var(--color-border);
    padding-top: 1.25rem;
  }
  .year {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    letter-spacing: 0.16em;
    color: var(--color-primary);
  }
  .eras p {
    color: var(--color-muted);
    font-size: 0.95rem;
  }

  .steps {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 2.5rem;
  }
  .steps li {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .n {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--color-muted);
    letter-spacing: 0.16em;
  }
  .steps p {
    color: var(--color-muted);
    font-size: 0.95rem;
  }

  .honest {
    list-style: none;
    margin-top: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    max-width: 72ch;
  }
  .honest li {
    display: flex;
    gap: 0.9rem;
    align-items: baseline;
    padding-bottom: 0.9rem;
    border-bottom: 1px solid var(--color-border);
  }
  .glyph {
    font-family: var(--font-mono);
    color: var(--color-primary);
    flex-shrink: 0;
    width: 1ch;
  }
  .honest li.no {
    color: var(--color-muted);
  }
  .honest li.no .glyph {
    color: var(--color-muted);
  }

  footer {
    border-top: 1px solid var(--color-border);
    padding: 2.5rem clamp(1rem, 5vw, 4rem);
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
  }
  footer .mark {
    color: var(--color-muted);
  }
  footer nav {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    font-size: 0.9rem;
  }
  footer nav a {
    color: var(--color-muted);
    text-decoration: none;
  }
  footer nav a:hover {
    color: var(--color-text);
  }
</style>
