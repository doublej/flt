<script lang="ts">
import BriefForm from '$lib/components/BriefForm.svelte'
import FareRange from '$lib/components/FareRange.svelte'
import PriceTiers from '$lib/components/PriceTiers.svelte'
import ReportShowcase from '$lib/components/ReportShowcase.svelte'
import { AVOIDING, CABIN, DISCOVERY, GRAPH, TOTALS } from '$lib/scenarios'

let tier = $state('survey')

const nf = new Intl.NumberFormat('en-GB')

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

<header>
  <a class="mark" href="#top">Bureau</a>
  <nav>
    <a href="#report">The report</a>
    <a href="#pricing">Pricing</a>
    <a class="cta" href="#brief">Send a brief</a>
  </nav>
</header>

<main id="top">
  <section class="hero">
    <p class="eyebrow">Bureau — flight research</p>
    <h1>€147 on New York.<br /><em>€9 on Lyon.</em></h1>
    <p class="lead">
      That is what moving your dates inside one week was worth on those two routes. Same week, same
      cabin. There is no way to tell which one you are looking at without pricing every day — so we
      price every day, and send you the answer.
    </p>
    <div class="hero-actions">
      <a class="btn" href="#brief">Send a brief — from €7</a>
      <a class="btn ghost" href="#report">See a real report</a>
    </div>
    <p class="proof">
      {TOTALS.queries} searches · {nf.format(TOTALS.options)} options · {TOTALS.carriers} airlines ·
      one afternoon
    </p>
  </section>

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
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 1.25rem clamp(1.25rem, 5vw, 4rem);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    background: color-mix(in srgb, var(--color-bg) 88%, transparent);
    backdrop-filter: blur(8px);
    z-index: 10;
  }
  .mark {
    font-family: var(--font-display);
    font-size: 1.3rem;
    letter-spacing: 0.01em;
    color: var(--color-text);
    text-decoration: none;
  }
  header nav {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    font-size: 0.88rem;
  }
  header nav a {
    color: var(--color-muted);
    text-decoration: none;
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
  header nav .cta:hover {
    background: var(--color-primary-hover);
    color: var(--color-surface);
  }
  @media (max-width: 620px) {
    header nav a:not(.cta) {
      display: none;
    }
  }

  main {
    max-width: 74rem;
    margin: 0 auto;
    padding: 0 clamp(1.25rem, 5vw, 4rem);
  }

  section {
    padding-block: var(--section-y);
  }
  .band + .band,
  .hero + .band {
    border-top: 1px solid var(--color-border);
  }

  .hero {
    padding-block: clamp(3.5rem, 9vw, 7rem);
  }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
    margin-bottom: 1.75rem;
  }
  h1 {
    font-family: var(--font-display);
    font-weight: 300;
    font-size: var(--text-display);
    line-height: 1.02;
    letter-spacing: -0.02em;
    text-wrap: balance;
    margin-bottom: 1.75rem;
  }
  h1 em {
    font-style: italic;
    color: var(--color-signal);
  }

  h2 {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: var(--text-h2);
    line-height: 1.12;
    letter-spacing: -0.015em;
    text-wrap: balance;
    margin-bottom: 1.25rem;
  }
  h3 {
    font-size: var(--text-h3);
    font-weight: 600;
    margin-bottom: 0.5rem;
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
    margin-top: 2rem;
    color: var(--color-muted);
    font-size: 0.95rem;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 2.25rem;
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
    transition: background 0.15s ease;
  }
  .btn:hover {
    background: var(--color-primary-hover);
  }
  .btn.ghost {
    background: none;
    color: var(--color-primary);
    border: 1px solid var(--color-border);
  }
  .btn.ghost:hover {
    background: var(--color-surface);
  }

  .proof {
    margin-top: 2.5rem;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--color-muted);
  }

  .asides {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: 1.25rem;
    margin-top: 3.5rem;
  }
  .asides > div {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: clamp(1.4rem, 2.4vw, 1.9rem);
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
    font-size: clamp(1.12rem, 1.9vw, 1.5rem);
    line-height: 1.3;
    text-wrap: pretty;
  }

  .steps {
    list-style: none;
    margin: 0 0 3.5rem;
    padding: 0;
    display: grid;
    gap: 1.75rem;
    max-width: 46rem;
  }
  .steps li {
    display: grid;
    grid-template-columns: 2rem 1fr;
    gap: 1.25rem;
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
    margin: 3rem 0 0;
    padding: 1.75rem 0 0;
    border-top: 1px solid var(--color-border);
    display: grid;
    gap: 0.7rem;
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
    padding: 2.5rem clamp(1.25rem, 5vw, 4rem);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.83rem;
    color: var(--color-muted);
    max-width: 74rem;
    margin: 0 auto;
  }
  footer a {
    color: var(--color-muted);
  }
</style>
