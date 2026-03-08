<script lang="ts">
import { base } from '$app/paths'
import { obliterate } from 'orphan-obliterator'
import { onMount } from 'svelte'

type Mode = 'run' | 'install' | 'agent'
let mode = $state<Mode>('agent')
let copied = $state(false)
let step = $state(0)

const steps = [
  {
    title: 'Compare prices across dates',
    description:
      'Client wants Amsterdam → Tokyo in April, flexible on dates. Scan a full week in one command.',
  },
  {
    title: 'Search the cheapest date',
    description: 'April 8 is €574 — the lowest. Pull all flights for that date.',
  },
  {
    title: 'Inspect flight details',
    description: 'O1 looks good. Check the layover, aircraft, and leg breakdown.',
  },
  {
    title: 'Search Tokyo → Manila',
    description: 'Client wants a week in Tokyo, then fly to Manila. Find direct flights.',
  },
  {
    title: 'Search Manila → Amsterdam',
    description: 'A week in Manila, then home. Find the return leg.',
  },
  {
    title: 'Compose the itinerary',
    description: 'Combine all three legs into one itinerary using session refs.',
  },
  {
    title: 'Export for the client',
    description: 'Generate a markdown file with all searches and the recommended itinerary.',
  },
]

const display_map: Record<Mode, string> = {
  run: 'bunx github:doublej/flt',
  install: 'bun install -g github:doublej/flt',
  agent: 'bunx github:doublej/flt prime',
}

const copy_map: Record<Mode, string> = {
  run: 'bunx github:doublej/flt',
  install: 'bun install -g github:doublej/flt',
  agent: 'Help me find flights using flt. Run `bunx github:doublej/flt prime` to get started',
}

onMount(() => {
  const instance = obliterate({
    selectors: [
      'p',
      '.tagline',
      '.description',
      '.command-desc',
      '.feature-card p',
      '.format-card p',
    ],
    rules: { minLastLineWords: 3, maxProtectedChars: 40 },
    demo: true,
  })

  return () => {
    instance.destroy()
  }
})

function copyCommand() {
  navigator.clipboard.writeText(copy_map[mode])
  copied = true
  setTimeout(() => (copied = false), 2000)
}

const features = [
  {
    icon: '~',
    title: 'Smart Routing',
    description:
      'Type naturally. flt ams finds airports, flt AMS NRT 2026-04-10 searches flights, flt O1 inspects a result. No subcommands to memorize.',
  },
  {
    icon: '$',
    title: 'Price Matrix',
    description:
      'Compare fares across date ranges in a single view. Spot the cheapest travel windows instantly with the matrix command.',
  },
  {
    icon: '>',
    title: 'Session Memory',
    description:
      'Searches persist by route tag. Reference any result later with TAG:ID notation — no re-searching required.',
  },
  {
    icon: '#',
    title: 'Multiple Formats',
    description:
      'Output as JSONL for pipelines, TSV for spreadsheets, tables for quick reads, or brief summaries for client emails.',
  },
  {
    icon: '@',
    title: 'Itinerary Builder',
    description:
      'Combine multiple flight segments into complete itineraries. Export as structured data ready for booking systems.',
  },
  {
    icon: '*',
    title: 'Built for Agents',
    description:
      'Designed from the ground up by coding agents. Every command, flag, and output format optimized for the travel professional workflow.',
  },
]

const commands = [
  {
    name: 'search',
    syntax: 'flt AMS NRT 2026-04-10',
    description: 'Search flights between any two airports on a given date',
  },
  {
    name: 'matrix',
    syntax: 'flt matrix AMS NRT --from 2026-04-01 --to 2026-04-14',
    description: 'Price comparison grid across a date range',
  },
  {
    name: 'inspect',
    syntax: 'flt O1',
    description: 'Deep-dive into a specific search result by its ID',
  },
  {
    name: 'itinerary',
    syntax: 'flt itinerary IAO-MNL@0318:O1 MNL-NRT@0320:O3',
    description: 'Combine segments into a complete travel plan',
  },
  {
    name: 'airports',
    syntax: 'flt amsterdam',
    description: 'Fuzzy search airports by city, name, or IATA code',
  },
  {
    name: 'takeout',
    syntax: 'flt takeout --format tsv',
    description: 'Export all session data for spreadsheets or booking tools',
  },
]
</script>

<main>
  <!-- Hero -->
  <section class="hero">
    <div class="container">
      <div class="badge">Built by coding agents, for travel agents</div>
      <h1>flt</h1>
      <p class="tagline">The ultimate CLI swiss army knife for finding flights</p>
      <p class="description">
        Search flights, compare prices across dates, build itineraries, and export
        data — all from your terminal.
      </p>
      <div class="hero-actions">
        <div class="install-box">
          <div class="mode-switch">
            <button class="mode-btn" class:active={mode === 'run'} onclick={() => mode = 'run'}>Run</button>
            <button class="mode-btn" class:active={mode === 'install'} onclick={() => mode = 'install'}>Install</button>
            <button class="mode-btn" class:active={mode === 'agent'} onclick={() => mode = 'agent'}>Agent</button>
          </div>
          <code>{display_map[mode]}</code>
          <button onclick={copyCommand} class="copy-btn">
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <a href="https://github.com/doublej/flt" target="_blank" class="github-link">
          View on GitHub
        </a>
      </div>
    </div>
  </section>

  <!-- Agent Session -->
  <section class="agent-session">
    <div class="container">
      <a href="{base}/agent-session.html" class="session-link">
        See full real-world scenario <span class="session-arrow">&rarr;</span>
      </a>
    </div>
  </section>

  <!-- Terminal Demo -->
  <section class="demo">
    <div class="container">
      <div class="demo-narrative">
        <div class="step-nav">
          <button class="nav-arrow" disabled={step === 0} onclick={() => step--}>&larr;</button>
          <span class="step-counter">{step + 1} / {steps.length}</span>
          <button class="nav-arrow" disabled={step === steps.length - 1} onclick={() => step++}>&rarr;</button>
        </div>
        <h3 class="step-title">{steps[step].title}</h3>
        <p class="step-description">{steps[step].description}</p>
      </div>
      <div class="terminal">
          <div class="terminal-header">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <div class="terminal-body">
          {#if step === 0}
            <div class="line"><span class="prompt">$</span> flt matrix AMS NRT 2026-04-07 2026-04-12</div>
            <div class="line output"></div>
            <div class="line output dim">date        cheapest  carrier         stops  duration</div>
            <div class="line output">2026-04-07  <span class="price">€689</span>      China Southern  1      17h 20m</div>
            <div class="line output">2026-04-08  <span class="price best-price">€574</span>      Etihad          1      19h 5m</div>
            <div class="line output">2026-04-09  <span class="price best-price">€574</span>      Etihad          1      19h 5m</div>
            <div class="line output">2026-04-10  <span class="price">€604</span>      Etihad          1      19h 5m</div>
            <div class="line output">2026-04-11  <span class="price">€604</span>      Etihad          1      19h 5m</div>
            <div class="line output">2026-04-12  <span class="price best-price">€574</span>      Etihad          1      19h 5m</div>
          {:else if step === 1}
            <div class="line"><span class="prompt">$</span> flt AMS NRT 2026-04-08 --limit 5</div>
            <div class="line output"></div>
            <div class="line output"><span class="result-id">O1</span> <span class="price">€574</span> Etihad 1 stop 19h 5m 10:25→12:30+1</div>
            <div class="line output"><span class="result-id">O2</span> <span class="price">€625</span> XiamenAir 1 stop 33h 15m 21:30→13:45+2</div>
            <div class="line output"><span class="result-id">O3</span> <span class="price">€728</span> Qatar Airways 1 stop 19h 55m 16:15→19:10+1</div>
            <div class="line output"><span class="result-id">O4</span> <span class="price">€894</span> Turkish Airlines 1 stop 21h 30m 14:40→19:10+1</div>
            <div class="line output"><span class="result-id">O5</span> <span class="price">€897</span> Turkish Airlines 1 stop 17h 15m 18:55→19:10+1</div>
            <div class="line output dim">Showing 5 of 28 results</div>
          {:else if step === 2}
            <div class="line"><span class="prompt">$</span> flt O1</div>
            <div class="line output"></div>
            <div class="line output">Etihad · <span class="price">€574</span> · 1 stop · 19h 5m</div>
            <div class="line output"></div>
            <div class="line output dim">Leg 1  AMS→AUH  10:25–19:15  6h 50m  Airbus A321neo</div>
            <div class="line output dim">       AUH layover 2h 10m</div>
            <div class="line output dim">Leg 2  AUH→NRT  21:25–12:30  10h 5m  Airbus A350</div>
          {:else if step === 3}
            <div class="line"><span class="prompt">$</span> flt NRT MNL 2026-04-14 --direct</div>
            <div class="line output"></div>
            <div class="line output"><span class="result-id">O1</span> <span class="price">€175</span> Cebu Pacific direct 5h 25m 13:45→18:10</div>
            <div class="line output"><span class="result-id">O2</span> <span class="price">€175</span> Cebu Pacific direct 5h 20m 19:15→23:35</div>
            <div class="line output"><span class="result-id">O3</span> <span class="price">€189</span> Philippines AirAsia direct 4h 40m 11:10→14:50</div>
            <div class="line output"><span class="result-id">O4</span> <span class="price">€273</span> Philippine Airlines direct 4h 50m 09:15→13:05</div>
            <div class="line output dim">Showing 4 of 7 results · tagged NRT-MNL@0414</div>
          {:else if step === 4}
            <div class="line"><span class="prompt">$</span> flt MNL AMS 2026-04-21 --limit 5</div>
            <div class="line output"></div>
            <div class="line output"><span class="result-id">O1</span> <span class="price">€390</span> Air India 1 stop 26h 22:55→18:55+1</div>
            <div class="line output"><span class="result-id">O2</span> <span class="price">€462</span> Emirates 1 stop 18h 15m 07:45→—</div>
            <div class="line output"><span class="result-id">O3</span> <span class="price">€462</span> Emirates 1 stop 22h 35m 03:25→—</div>
            <div class="line output"><span class="result-id">O4</span> <span class="price">€462</span> Emirates 1 stop 21h 5m 18:15→09:20+1</div>
            <div class="line output dim">Showing 4 of 81 results · tagged MNL-AMS@0421</div>
          {:else if step === 5}
            <div class="line"><span class="prompt">$</span> flt itinerary AMS-NRT@0408:O1 \</div>
            <div class="line output dim">    NRT-MNL@0414:O1 MNL-AMS@0421:O4 \</div>
            <div class="line output dim">    --title "Tokyo + Manila Spring 2026"</div>
            <div class="line output"></div>
            <div class="line output dim">── Tokyo + Manila Spring 2026 ─────────────────────────────</div>
            <div class="line output dim">#  Date        Route    Price   Stops   Carrier</div>
            <div class="line output">1  2026-04-08  AMS→NRT  <span class="price">€574</span>    1 stop  Etihad</div>
            <div class="line output">2  2026-04-14  NRT→MNL  <span class="price">€175</span>    direct  Cebu Pacific</div>
            <div class="line output">3  2026-04-21  MNL→AMS  <span class="price">€462</span>    1 stop  Emirates</div>
            <div class="line output dim">───────────────────────────────────────────────────────────</div>
            <div class="line output">Total: <span class="price">€1,211</span></div>
          {:else}
            <div class="line"><span class="prompt">$</span> flt takeout \</div>
            <div class="line output dim">    --title "Tokyo + Manila Apr 2026" \</div>
            <div class="line output dim">    --itin "Recommended" AMS-NRT@0408:O1 \</div>
            <div class="line output dim">    NRT-MNL@0414:O1 MNL-AMS@0421:O4</div>
            <div class="line output"></div>
            <div class="line output">{'{"ok":true,'}</div>
            <div class="line output">{' "path":"~/Desktop/flights-2026-04-05.md",'}</div>
            <div class="line output">{' "searches":4,'}</div>
            <div class="line output">{' "itineraries":1}'}</div>
          {/if}
        </div>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="features">
    <div class="container">
      <h2>Everything you need, nothing you don't</h2>
      <div class="grid">
        {#each features as feature, i}
          <div class="feature-card" style="animation-delay: {i * 100}ms">
            <div class="feature-icon"><code>{feature.icon}</code></div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Commands Reference -->
  <section class="commands">
    <div class="container">
      <h2>Command Reference</h2>
      <p class="section-subtitle">Seven commands. Zero learning curve.</p>
      <div class="command-list">
        {#each commands as cmd, i}
          <div class="command-item" style="animation-delay: {i * 100}ms">
            <div class="command-header">
              <code class="command-name">{cmd.name}</code>
              <span class="command-desc">{cmd.description}</span>
            </div>
            <pre class="command-syntax"><code>$ {cmd.syntax}</code></pre>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Getting Started -->
  <section class="getting-started">
    <div class="container">
      <h2>Get started in 60 seconds</h2>
      <div class="steps">
        <div class="step" style="animation-delay: 0ms">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Install globally</h3>
            <pre><code>bun install -g github:doublej/flt</code></pre>
          </div>
        </div>
        <div class="step" style="animation-delay: 200ms">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Search a route</h3>
            <pre><code>flt AMS NRT 2026-04-10</code></pre>
          </div>
        </div>
        <div class="step" style="animation-delay: 400ms">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Inspect a result</h3>
            <pre><code>flt O1</code></pre>
          </div>
        </div>
        <div class="step" style="animation-delay: 600ms">
          <div class="step-number">4</div>
          <div class="step-content">
            <h3>Compare dates</h3>
            <pre><code>flt matrix AMS NRT --from 2026-04-01 --to 2026-04-14</code></pre>
          </div>
        </div>
        <div class="step" style="animation-delay: 800ms">
          <div class="step-number">5</div>
          <div class="step-content">
            <h3>Export for clients</h3>
            <pre><code>flt takeout --format tsv > options.tsv</code></pre>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Output Formats -->
  <section class="formats">
    <div class="container">
      <h2>Output that fits your workflow</h2>
      <div class="format-grid">
        <div class="format-card">
          <code class="format-flag">--format jsonl</code>
          <p>Pipe into jq, feed to APIs, or build automations. One JSON object per line.</p>
        </div>
        <div class="format-card">
          <code class="format-flag">--format tsv</code>
          <p>Paste directly into Excel or Google Sheets. Tab-separated, ready to go.</p>
        </div>
        <div class="format-card">
          <code class="format-flag">--format table</code>
          <p>Human-readable aligned columns for quick terminal review.</p>
        </div>
        <div class="format-card">
          <code class="format-flag">--format brief</code>
          <p>Compact summaries perfect for dropping into client emails or Slack.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="cta">
    <div class="container">
      <h2>Ready to fly?</h2>
      <p>Install flt and start searching flights from your terminal today.</p>
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
  /* Layout */
  .container {
    max-width: var(--container-max-width);
    margin: 0 auto;
    padding: 0 var(--container-padding);
  }

  section {
    padding: var(--section-padding) 0;
  }

  /* Hero */
  .hero {
    padding: 80px 0 40px;
    text-align: center;
    animation: fadeSlideUp 0.5s ease-out forwards;
  }

  .badge {
    display: inline-block;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--accent);
    background: var(--accent-subtle);
    padding: 6px 16px;
    border-radius: 20px;
    margin-bottom: 24px;
    letter-spacing: 0.01em;
  }

  .hero h1 {
    font-family: 'DM Mono', monospace;
    font-size: 4.5rem;
    font-weight: 500;
    letter-spacing: -0.04em;
    margin-bottom: 12px;
  }

  .tagline {
    font-size: 1.35rem;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 12px;
  }

  .description {
    font-size: 1.1rem;
    color: var(--text-secondary);
    max-width: 600px;
    margin: 0 auto 32px;
  }

  .hero-actions {
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .install-box {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: var(--bg-code);
    color: var(--text-code);
    padding: 6px 6px 6px 6px;
    border-radius: 8px;
    font-size: 0.95rem;
  }

  .install-box code {
    font-size: 0.95rem;
    padding: 0 4px;
  }

  .mode-switch {
    display: flex;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 5px;
    padding: 2px;
  }

  .mode-btn {
    background: none;
    border: none;
    color: var(--text-tertiary);
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.15s;
  }

  .mode-btn.active {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-code);
  }

  .copy-btn {
    background: none;
    border: 1px solid #444;
    color: var(--text-code);
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 0.85rem;
    transition: border-color 0.2s;
  }

  .copy-btn:hover {
    border-color: #777;
  }

  .github-link {
    display: flex;
    align-items: center;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.95rem;
    padding: 0 20px;
    border: 1px solid var(--border);
    border-radius: 8px;
    transition: border-color 0.2s;
  }

  .github-link:hover {
    border-color: var(--text-tertiary);
  }

  /* Terminal Demo */
  .demo {
    padding: 20px 0 var(--section-padding);
    animation: fadeSlideUp 0.5s ease-out 0.2s forwards;
    opacity: 0;
  }

  .terminal {
    background: var(--bg-code);
    border-radius: 10px;
    overflow: hidden;
    max-width: 680px;
    margin: 0 auto;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    position: relative;
  }

  .terminal-header {
    background: var(--bg-code-header);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .dot.red { background: #e06058; }
  .dot.yellow { background: #dba730; }
  .dot.green { background: #5cb870; }

  .terminal-title {
    color: #999;
    font-size: 0.8rem;
    font-family: 'DM Mono', monospace;
    margin-left: 8px;
  }

  .demo-narrative {
    max-width: 680px;
    margin: 0 auto 16px;
  }

  .step-nav {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .nav-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: none;
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.15s;
  }

  .nav-arrow:hover:not(:disabled) {
    border-color: var(--text-primary);
  }

  .nav-arrow:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .step-counter {
    font-family: 'DM Mono', monospace;
    font-size: 0.85rem;
    color: var(--text-tertiary);
  }

  .step-title {
    font-size: 1.15rem;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .step-description {
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
  }

  .best-price {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .terminal-body {
    padding: 20px 24px;
    font-family: 'DM Mono', monospace;
    font-size: 0.85rem;
    line-height: 1.7;
    color: #bbb;
  }

  .line {
    min-height: 1.7em;
  }

  .prompt {
    color: #5cb870;
    margin-right: 8px;
  }

  .output {
    color: #888;
  }

  .result-id {
    color: var(--accent);
    font-weight: 500;
  }

  .price {
    color: #5cb870;
    font-weight: 500;
  }

  .dim {
    color: #606060;
  }

  /* Features */
  .features {
    background: var(--bg-secondary);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }

  .features h2 {
    text-align: center;
    font-size: 1.8rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-bottom: 40px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--grid-gap);
  }

  .feature-card {
    padding: 28px;
    border: 1px solid var(--border);
    border-radius: 8px;
    animation: fadeSlideUp 0.5s ease-out forwards;
    opacity: 0;
    background: var(--bg-primary);
  }

  .feature-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-code);
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .feature-icon code {
    color: var(--text-code);
    font-size: 1.1rem;
    font-weight: 500;
  }

  .feature-card h3 {
    font-size: 1.05rem;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .feature-card p {
    font-size: 0.95rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  /* Commands */
  .commands h2 {
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

  .command-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 800px;
    margin: 0 auto;
  }

  .command-item {
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    background: var(--bg-secondary);
    animation: fadeSlideUp 0.5s ease-out forwards;
    opacity: 0;
  }

  .command-header {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .command-name {
    background: var(--bg-code);
    color: var(--text-code);
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .command-desc {
    color: var(--text-secondary);
    font-size: 0.95rem;
  }

  .command-syntax {
    background: var(--bg-primary);
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    font-size: 0.85rem;
    overflow-x: auto;
    margin: 0;
  }

  /* Getting Started */
  .getting-started {
    background: var(--bg-secondary);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }

  .getting-started h2 {
    text-align: center;
    font-size: 1.8rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-bottom: 40px;
  }

  .steps {
    max-width: 650px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .step {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    animation: fadeSlideUp 0.5s ease-out forwards;
    opacity: 0;
  }

  .step-number {
    width: 36px;
    height: 36px;
    min-width: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--text-primary);
    color: white;
    border-radius: 50%;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .step-content {
    flex: 1;
  }

  .step-content h3 {
    font-size: 1.05rem;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .step-content pre {
    background: var(--bg-code);
    color: var(--text-code);
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 0.85rem;
    overflow-x: auto;
    margin: 0;
  }

  /* Output Formats */
  .formats h2 {
    text-align: center;
    font-size: 1.8rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-bottom: 40px;
  }

  .format-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--grid-gap);
    max-width: 800px;
    margin: 0 auto;
  }

  .format-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 24px;
  }

  .format-flag {
    display: inline-block;
    background: var(--bg-code);
    color: var(--text-code);
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.85rem;
    margin-bottom: 12px;
  }

  .format-card p {
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  /* Agent Session link */
  .agent-session {
    padding: 0;
    text-align: center;
  }

  .session-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9rem;
    color: var(--text-secondary);
    text-decoration: none;
    transition: color 0.2s;
  }

  .session-link:hover {
    color: var(--text-primary);
  }

  .session-arrow {
    font-size: 0.9rem;
  }

  /* CTA */
  .cta {
    text-align: center;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
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
  @media (max-width: 1000px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 700px) {
    .hero h1 {
      font-size: 3rem;
    }

    .tagline {
      font-size: 1.1rem;
    }

    .grid {
      grid-template-columns: 1fr;
    }

    .format-grid {
      grid-template-columns: 1fr;
    }

    .terminal-body {
      font-size: 0.75rem;
      padding: 16px;
    }

    .command-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
</style>
