<script lang="ts">
import BriefForm from '$lib/components/BriefForm.svelte'
import PriceTiers from '$lib/components/PriceTiers.svelte'
import ReportShowcase from '$lib/components/ReportShowcase.svelte'
import TabStrip from '$lib/components/TabStrip.svelte'

let tier = $state('survey')

const ERAS = [
  {
    year: '1985',
    title: 'Someone else did this.',
    body: 'You said where and roughly when. They went away, worked the terminal, and came back with four options and a reason for each. You did not see the work. That was the point.',
  },
  {
    year: '2015',
    title: 'You did it. Badly. At 1am.',
    body: 'The agent went away and the work came to you. Eleven tabs, a price you half remember from Tuesday, and a booking made mostly to stop looking.',
  },
  {
    year: 'Today',
    title: 'The Bureau does it, and does not get bored on search 26.',
    body: 'Same job, same patience, no terminal. You brief it, it works every route and date you asked for, and a report comes back with the numbers laid out and the links to book.',
  },
]

const HONEST = [
  { is: true, text: 'Searches every route and date combination you ask for, one after another.' },
  {
    is: true,
    text: 'Sends a report: a map, price-by-date charts, ranked options with airline, routing and total time.',
  },
  { is: true, text: 'Hands you the booking link for each option. You book where you always did.' },
  {
    is: false,
    text: 'It does not book, ticket, or hold anything. No payment to an airline passes through us.',
  },
  {
    is: false,
    text: 'Prices come from public flight search results, not an airline feed. Treat them as what was showing when we looked, not a promise.',
  },
  {
    is: false,
    text: 'Display price only. No baggage rules, fare conditions, tax breakdown or loyalty earning.',
  },
  {
    is: false,
    text: 'Flexibility has limits: a run covers a 7-day window and 21 searches. Longer trips get split across runs.',
  },
]

const STEPS = [
  {
    n: '01',
    h: 'Brief the Bureau',
    p: 'Where from, where to, roughly when, and what you actually care about. Two minutes.',
  },
  {
    n: '02',
    h: 'It works the routes',
    p: 'Every destination against every date, one search at a time, throttled on purpose. It takes minutes. You are not the one waiting.',
  },
  {
    n: '03',
    h: 'The report arrives',
    p: 'A document you can read on a phone, argue about over dinner, and book from when you have decided.',
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
    <p class="eyebrow">We bring back travel agents</p>
    <h1>
      You used to have<br />a travel agent.<br />
      <em>Now you have eleven tabs.</em>
    </h1>
    <p class="lead">
      Brief the Bureau the way you once briefed a person at a desk. It works every route and every
      date you asked about, and comes back with a report — the prices, the routings, the trade-offs,
      and the link to book each one.
    </p>
    <div class="hero-actions">
      <a class="btn" href="#brief">Brief the Bureau</a>
      <a class="btn ghost" href="#report">See what lands in your inbox</a>
    </div>
    <div class="strip"><TabStrip /></div>
  </section>

  <div class="rule" aria-hidden="true">
    <i></i><span></span><i></i><span></span><i></i>
  </div>

  <!-- 2. The arithmetic -->
  <section class="band">
    <h2>It is not annoying. It is arithmetic.</h2>
    <p class="lead measure">
      A real trip last month: five possible arrival cities, a nine-day window either side of the date
      that mattered, economy and premium worth comparing. That is
      <strong>26 separate searches</strong> and <strong>985 options</strong> — and the answer only
      falls out when you hold all of them at once.
    </p>
    <div class="stats">
      <div><span class="num">5</span><span class="cap">destinations worth comparing</span></div>
      <div><span class="num">26</span><span class="cap">searches to cover them</span></div>
      <div><span class="num">985</span><span class="cap">options that came back</span></div>
      <div><span class="num">€185</span><span class="cap">between the best day and the worst, one route</span></div>
    </div>
    <p class="measure kicker">Tabs let you compare two things at a time. That is the whole problem.</p>
  </section>

  <!-- 3. Then / now / now again -->
  <section class="band">
    <h2>Then, now, and now again</h2>
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

  <div class="rule" aria-hidden="true">
    <i></i><span></span><i></i>
  </div>

  <!-- 4. The report -->
  <section class="band" id="report">
    <h2>What lands in your inbox</h2>
    <p class="lead measure">
      Not a link to a search. A document — the thing a travel agent used to hand across the desk,
      except it covers every date you were curious about.
    </p>
    <ReportShowcase />
  </section>

  <!-- 5. How it works -->
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
      The slowness is the product. Searches go out one at a time, spaced out, because a search engine
      that is hammered stops answering honestly. Four minutes is what the work costs — and it was
      always what a good agent did. They went away. They came back with options.
    </p>
  </section>

  <!-- 6. Pricing -->
  <section class="band" id="pricing">
    <h2>Priced by depth, not by seat</h2>
    <p class="lead measure">
      You are not paying for a ticket. You are paying for how far the search goes — one date, one
      week, or the whole shape of a trip.
    </p>
    <PriceTiers bind:selected={tier} />
  </section>

  <div class="rule" aria-hidden="true">
    <i></i><span></span><i></i><span></span><i></i>
  </div>

  <!-- 7. Honesty panel -->
  <section class="band">
    <h2>What it is, and what it is not</h2>
    <p class="lead measure">
      We do not sell tickets, so there is no airline relationship to protect and no inventory to
      push. Nothing bends the ranking. The cheapest option is at the top because it is the cheapest.
    </p>
    <ul class="honest">
      {#each HONEST as row}
        <li class:no={!row.is}>
          <span class="glyph" aria-hidden="true">{row.is ? '+' : '−'}</span>
          <span>{row.text}</span>
        </li>
      {/each}
    </ul>
  </section>

  <!-- 8. Brief -->
  <section class="band" id="brief">
    <h2>Brief the Bureau</h2>
    <p class="lead measure">
      Tell it what you would have told the person at the desk. Vague is fine — vague is what it is
      good at.
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
  .lead strong {
    color: var(--color-text);
    font-weight: 500;
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

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1.5rem;
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-border);
  }
  .stats div {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .num {
    font-family: var(--font-mono);
    font-size: clamp(2.25rem, 4.5vw, 3.25rem);
    line-height: 1;
    color: var(--color-primary);
  }
  .cap {
    font-size: 0.85rem;
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
