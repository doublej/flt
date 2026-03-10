<script lang="ts">
  import { base } from '$app/paths'
  import Terminal from '$lib/components/Terminal.svelte'

  const comparison = [
    { feature: 'Multi-origin compare', flt: true, google: false, skyscanner: false },
    { feature: 'Offline route graph', flt: true, google: false, skyscanner: false },
    { feature: 'Composable filters', flt: true, google: false, skyscanner: false },
    { feature: 'Session memory', flt: true, google: false, skyscanner: false },
    { feature: 'CLI + TUI + Web', flt: true, google: false, skyscanner: false },
    { feature: 'Date range matrix', flt: true, google: true, skyscanner: true },
    { feature: 'Itinerary builder', flt: true, google: true, skyscanner: false },
    { feature: 'Export (PDF/MD/TSV)', flt: true, google: false, skyscanner: false },
    { feature: 'Agent-first design', flt: true, google: false, skyscanner: false },
    { feature: 'Stable flight IDs', flt: true, google: false, skyscanner: false },
  ]
</script>

<main>
  <!-- Hero -->
  <section class="hero">
    <div class="container">
      <h1>What makes flt different</h1>
      <p class="subtitle">
        Power features you won't find on Google Flights or Skyscanner. Built for agents who search hundreds of routes.
      </p>
    </div>
  </section>

  <!-- 1. Multi-Origin Compare -->
  <section class="feature-section">
    <div class="container">
      <div class="feature-row">
        <div class="feature-text">
          <span class="feature-label">01</span>
          <h2>Multi-Origin Compare</h2>
          <p>
            Client flexible on departure city? Search KUL, BKK, and MNL to Amsterdam
            in one command. One sorted result set across all origins.
          </p>
        </div>
        <div class="feature-demo">
          <Terminal>
            <div class="line"><span class="prompt">$</span> flt compare KUL,BKK,MNL AMS 2026-03-22</div>
            <div class="line output"></div>
            <div class="line output dim">origin  cheapest  carrier           stops  duration</div>
            <div class="line output">KUL     <span class="price">€412</span>      Malaysia Airlines  1      15h 40m</div>
            <div class="line output">BKK     <span class="price">€438</span>      EVA Air            1      17h 10m</div>
            <div class="line output">MNL     <span class="price">€523</span>      KLM                1      16h 55m</div>
            <div class="line output dim">3 origins · 84 total results</div>
          </Terminal>
        </div>
      </div>
    </div>
  </section>

  <!-- 2. Route Connections -->
  <section class="feature-section alt">
    <div class="container">
      <div class="feature-row reverse">
        <div class="feature-text">
          <span class="feature-label">02</span>
          <h2>Route Intelligence</h2>
          <p>
            An offline route graph with 67,000+ edges. See which hubs connect two cities,
            find bridge airports, and force waypoints. Works without an internet connection.
          </p>
        </div>
        <div class="feature-demo">
          <Terminal>
            <div class="line"><span class="prompt">$</span> flt connections AMS SYD --max-stops 2 --names</div>
            <div class="line output"></div>
            <div class="line output dim">hub         via              distance</div>
            <div class="line output">SIN         Singapore         15,840 km</div>
            <div class="line output">HKG         Hong Kong         16,220 km</div>
            <div class="line output">DXB         Dubai             16,710 km</div>
            <div class="line output">DOH         Doha              17,090 km</div>
            <div class="line output dim">18 connection routes found</div>
          </Terminal>
        </div>
      </div>
    </div>
  </section>

  <!-- 3. Advanced Filters -->
  <section class="feature-section">
    <div class="container">
      <div class="feature-row">
        <div class="feature-text">
          <span class="feature-label">03</span>
          <h2>Power Filters</h2>
          <p>
            Composable filters that stack: exclude Gulf carriers, require morning departures,
            cap duration at 16 hours, avoid specific hubs. Set defaults once via config and they
            apply to every search.
          </p>
        </div>
        <div class="feature-demo">
          <Terminal>
            <div class="line"><span class="prompt">$</span> flt AMS NRT 2026-04-08 \</div>
            <div class="line output dim">    --exclude-region gulf \</div>
            <div class="line output dim">    --dep-after 08:00 \</div>
            <div class="line output dim">    --max-dur 960 --limit 3</div>
            <div class="line output"></div>
            <div class="line output"><span class="result-id">O1</span> <span class="price">€728</span> Qatar Airways 1 stop 15h 55m 08:15→07:10+1</div>
            <div class="line output"><span class="result-id">O2</span> <span class="price">€894</span> Turkish 1 stop 14h 30m 09:40→07:10+1</div>
            <div class="line output"><span class="result-id">O3</span> <span class="price">€912</span> Finnair 1 stop 13h 45m 10:15→06:00+1</div>
            <div class="line output dim">Filtered: 28 → 3 results</div>
          </Terminal>
        </div>
      </div>
    </div>
  </section>

  <!-- 4. Favorites -->
  <section class="feature-section alt">
    <div class="container">
      <div class="feature-row reverse">
        <div class="feature-text">
          <span class="feature-label">04</span>
          <h2>Session Favorites</h2>
          <p>
            Bookmark any result during a session. Favorites store full offer snapshots,
            so they survive cache expiry. Compare options hours later without re-searching.
          </p>
        </div>
        <div class="feature-demo">
          <Terminal>
            <div class="line"><span class="prompt">$</span> flt fav O1</div>
            <div class="line output">Saved: AMS→NRT €574 Etihad (1 stop, 19h 5m)</div>
            <div class="line output"></div>
            <div class="line"><span class="prompt">$</span> flt favs</div>
            <div class="line output"></div>
            <div class="line output dim">#  route    price  carrier  stops  duration</div>
            <div class="line output"><span class="result-id">F1</span> AMS→NRT  <span class="price">€574</span>   Etihad   1      19h 5m</div>
            <div class="line output"><span class="result-id">F2</span> NRT→MNL  <span class="price">€175</span>   Cebu Pac direct  5h 25m</div>
            <div class="line output"><span class="result-id">F3</span> MNL→AMS  <span class="price">€390</span>   Air India 1     26h</div>
            <div class="line output dim">Total: €1,139</div>
          </Terminal>
        </div>
      </div>
    </div>
  </section>

  <!-- 5. Three Interfaces -->
  <section class="feature-section">
    <div class="container">
      <div class="feature-row">
        <div class="feature-text">
          <span class="feature-label">05</span>
          <h2>Three Interfaces, One Engine</h2>
          <p>
            Same search engine powers a modern CLI, a retro Sabre-style TUI, and a SvelteKit
            web app with streaming results and route maps.
          </p>
        </div>
        <div class="feature-demo">
          <div class="triptych">
            <Terminal maxWidth="100%">
              <div class="line dim">CLI</div>
              <div class="line"><span class="prompt">$</span> flt AMS NRT 2026-04-08</div>
              <div class="line output"><span class="result-id">O1</span> <span class="price">€574</span> Etihad 1 stop</div>
            </Terminal>
            <Terminal maxWidth="100%" variant="green">
              <div class="line tg-dim">TUI</div>
              <div class="line tg">1AMSNRT08APR</div>
              <div class="line tg-dim">01 574EUR EY 1STP 19H05</div>
            </Terminal>
            <div class="web-preview">
              <div class="web-preview-header">
                <span class="dot red"></span>
                <span class="dot yellow"></span>
                <span class="dot green"></span>
              </div>
              <div class="web-preview-body">
                <div class="web-label">Web</div>
                <div class="web-row">
                  <span class="web-carrier">Etihad</span>
                  <span class="web-price">€574</span>
                </div>
                <div class="web-detail">1 stop · 19h 5m · AUH</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 6. Sabre TUI -->
  <section class="feature-section alt">
    <div class="container">
      <div class="feature-row reverse">
        <div class="feature-text">
          <span class="feature-label">06</span>
          <h2>Sabre-Style TUI</h2>
          <p>
            A fullscreen green-on-black terminal that speaks GDS. Type <code>1AMSNRT08APR/C</code>
            for business class, <code>*1</code> to inspect, <code>MD</code> to scroll.
            Complete with boot animation and forced uppercase input.
          </p>
        </div>
        <div class="feature-demo">
          <Terminal variant="green">
            <div class="line tg-bright">SABRE</div>
            <div class="line tg">&gt; 1AMSNRT08APR/C</div>
            <div class="line tg"></div>
            <div class="line tg-dim">01 EY  AMS NRT 1025 1230+1 J  1STP 574EUR A321/A350</div>
            <div class="line tg-dim">02 QR  AMS NRT 1615 1910+1 J  1STP 728EUR B777/A350</div>
            <div class="line tg-dim">03 TK  AMS NRT 1440 1910+1 J  1STP 894EUR A321/B787</div>
            <div class="line tg"></div>
            <div class="line tg-dim">3 OF 28 RESULTS  &gt;</div>
          </Terminal>
        </div>
      </div>
    </div>
  </section>

  <!-- 7. Connection Gap Analysis -->
  <section class="feature-section">
    <div class="container">
      <div class="feature-row">
        <div class="feature-text">
          <span class="feature-label">07</span>
          <h2>Connection Gap Analysis</h2>
          <p>
            The itinerary builder calculates door-to-door time between segments and warns about
            tight connections or long layovers. Know before you book whether a 2h10m transfer
            at AUH is comfortable or cutting it close.
          </p>
        </div>
        <div class="feature-demo">
          <Terminal>
            <div class="line"><span class="prompt">$</span> flt itinerary AMS-NRT@0408:O1 \</div>
            <div class="line output dim">    NRT-MNL@0414:O1 --analyze</div>
            <div class="line output"></div>
            <div class="line output dim">Leg 1  AMS→AUH  10:25–19:15  6h 50m</div>
            <div class="line output dim">       AUH layover 2h 10m</div>
            <div class="line output dim">Leg 2  AUH→NRT  21:25–12:30  10h 5m</div>
            <div class="line output"></div>
            <div class="line output warn">⚠ Gap AMS-NRT → NRT-MNL: 6 days 1h 15m</div>
            <div class="line output dim">  Arrives: Apr 9 12:30 · Departs: Apr 14 13:45</div>
            <div class="line output"></div>
            <div class="line output dim">Leg 3  NRT→MNL  13:45–18:10  5h 25m  direct</div>
          </Terminal>
        </div>
      </div>
    </div>
  </section>

  <!-- 8. Agent-First Design -->
  <section class="feature-section alt">
    <div class="container">
      <div class="feature-row reverse">
        <div class="feature-text">
          <span class="feature-label">08</span>
          <h2>Agent-First Design</h2>
          <p>
            Built for AI coding agents. <code>flt prime</code> outputs a structured briefing.
            JSONL output, stable flight IDs (SHA-1 hashed from legs), structured error codes,
            and a phased workflow for autonomous operation.
          </p>
        </div>
        <div class="feature-demo">
          <Terminal>
            <div class="line"><span class="prompt">$</span> flt prime</div>
            <div class="line output"></div>
            <div class="line output dim">{'{'}"phase":"orient","commands":['}</div>
            <div class="line output dim">  "flt airports &lt;city&gt;",</div>
            <div class="line output dim">  "flt connections &lt;from&gt; &lt;to&gt;",</div>
            <div class="line output dim">  "flt config show"</div>
            <div class="line output dim">{']}'}</div>
            <div class="line output dim">{'{'}"phase":"search","commands":['}</div>
            <div class="line output dim">  "flt &lt;from&gt; &lt;to&gt; &lt;date&gt;",</div>
            <div class="line output dim">  "flt matrix &lt;from&gt; &lt;to&gt; --from --to"</div>
            <div class="line output dim">{']}'}</div>
          </Terminal>
        </div>
      </div>
    </div>
  </section>

  <!-- Comparison Table -->
  <section class="comparison">
    <div class="container">
      <h2>Feature Comparison</h2>
      <p class="section-subtitle">How flt stacks up against the alternatives.</p>
      <div class="table-wrap">
        <table class="compare-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>flt</th>
              <th>Google Flights</th>
              <th>Skyscanner</th>
            </tr>
          </thead>
          <tbody>
            {#each comparison as row}
              <tr>
                <td>{row.feature}</td>
                <td class="check">{row.flt ? '✓' : '—'}</td>
                <td class="check">{row.google ? '✓' : '—'}</td>
                <td class="check">{row.skyscanner ? '✓' : '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="cta">
    <div class="container">
      <h2>Ready to fly?</h2>
      <p>Install flt and start searching flights from your terminal.</p>
      <pre class="cta-install"><code>bun install -g github:doublej/flt</code></pre>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div class="container">
      <p>
        <a href="https://github.com/doublej/flt" target="_blank">GitHub</a>
        <span class="sep">&middot;</span>
        MIT License
      </p>
    </div>
  </footer>
</main>

<style>
  .container {
    max-width: var(--container-max-width);
    margin: 0 auto;
    padding: 0 var(--container-padding);
  }

  /* Hero */
  .hero {
    padding: 80px 0 40px;
    text-align: center;
  }

  .hero h1 {
    font-size: 2.5rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin-bottom: 16px;
  }

  .subtitle {
    font-size: 1.15rem;
    color: var(--text-secondary);
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* Feature sections */
  .feature-section {
    padding: 60px 0;
  }

  .feature-section.alt {
    background: var(--bg-secondary);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }

  .feature-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: center;
  }

  .feature-row.reverse {
    direction: rtl;
  }

  .feature-row.reverse > * {
    direction: ltr;
  }

  .feature-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.8rem;
    color: var(--accent);
    font-weight: 500;
    display: block;
    margin-bottom: 8px;
  }

  .feature-text h2 {
    font-size: 1.6rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-bottom: 12px;
  }

  .feature-text p {
    font-size: 1rem;
    color: var(--text-secondary);
    line-height: 1.65;
  }

  .feature-text code {
    font-size: 0.85em;
    background: var(--bg-code);
    color: var(--text-code);
    padding: 2px 6px;
    border-radius: 3px;
  }

  /* Terminal line styles (shared across demos) */
  .line {
    min-height: 1.7em;
  }

  .prompt {
    color: #5cb870;
    margin-right: 8px;
  }

  .output { color: #888; }
  .result-id { color: var(--accent); font-weight: 500; }
  .price { color: #5cb870; font-weight: 500; }
  .dim { color: #606060; }
  .warn { color: #dba730; }

  /* Green terminal text */
  .tg { color: #33ff33; }
  .tg-dim { color: #1a9a1a; }
  .tg-bright { color: #66ff66; font-weight: 500; }

  /* Triptych */
  .triptych {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }

  .web-preview {
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    border: 1px solid var(--border);
  }

  .web-preview-header {
    background: #f0f0f0;
    padding: 10px 14px;
    display: flex;
    gap: 6px;
  }

  .web-preview-header .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .web-preview-body {
    padding: 16px;
    font-size: 0.8rem;
    color: var(--text-primary);
    line-height: 1.6;
  }

  .web-label {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    margin-bottom: 8px;
  }

  .web-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .web-carrier {
    font-weight: 600;
  }

  .web-price {
    color: #5cb870;
    font-weight: 600;
    font-family: 'DM Mono', monospace;
  }

  .web-detail {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  /* Comparison */
  .comparison {
    padding: 60px 0;
  }

  .comparison h2 {
    text-align: center;
    font-size: 1.8rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-bottom: 8px;
  }

  .section-subtitle {
    text-align: center;
    color: var(--text-secondary);
    margin-bottom: 40px;
  }

  .table-wrap {
    max-width: 700px;
    margin: 0 auto;
    overflow-x: auto;
  }

  .check {
    text-align: center !important;
    font-size: 1.1rem;
  }

  /* CTA */
  .cta {
    text-align: center;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 60px 0;
  }

  .cta h2 {
    font-size: 1.8rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-bottom: 12px;
  }

  .cta p {
    color: var(--text-secondary);
    margin-bottom: 24px;
  }

  .cta-install {
    display: inline-block;
    background: var(--bg-code);
    color: var(--text-code);
    padding: 14px 28px;
    border-radius: 8px;
    font-size: 1rem;
    margin: 0;
  }

  /* Footer */
  footer {
    padding: 32px 0;
    text-align: center;
    color: var(--text-tertiary);
    font-size: 0.9rem;
  }

  footer a {
    color: var(--text-secondary);
    text-decoration: none;
  }

  footer a:hover {
    text-decoration: underline;
  }

  .sep {
    margin: 0 8px;
  }

  /* Responsive */
  @media (max-width: 800px) {
    .feature-row,
    .feature-row.reverse {
      grid-template-columns: 1fr;
      direction: ltr;
      gap: 24px;
    }

    .triptych {
      grid-template-columns: 1fr;
    }

    .hero h1 {
      font-size: 2rem;
    }
  }
</style>
