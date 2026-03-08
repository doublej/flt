<script lang="ts">
  import { base } from '$app/paths';
  import { obliterate } from 'orphan-obliterator';
  import { onMount } from 'svelte';

  let copied = $state(false);

  onMount(() => {
    const instance = obliterate('p, .tagline, .description, .command-desc, .feature-card p, .format-card p');
    return () => instance.destroy();
  });

  function copyInstall() {
    navigator.clipboard.writeText('bunx github:jurrejan/flights-app');
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  const features = [
    {
      icon: '~',
      title: 'Smart Routing',
      description: 'Type naturally. flt ams finds airports, flt AMS NRT 2026-04-10 searches flights, flt O1 inspects a result. No subcommands to memorize.'
    },
    {
      icon: '$',
      title: 'Price Matrix',
      description: 'Compare fares across date ranges in a single view. Spot the cheapest travel windows instantly with the matrix command.'
    },
    {
      icon: '>',
      title: 'Session Memory',
      description: 'Searches persist by route tag. Reference any result later with TAG:ID notation — no re-searching required.'
    },
    {
      icon: '#',
      title: 'Multiple Formats',
      description: 'Output as JSONL for pipelines, TSV for spreadsheets, tables for quick reads, or brief summaries for client emails.'
    },
    {
      icon: '@',
      title: 'Itinerary Builder',
      description: 'Combine multiple flight segments into complete itineraries. Export as structured data ready for booking systems.'
    },
    {
      icon: '*',
      title: 'Built for Agents',
      description: 'Designed from the ground up by coding agents. Every command, flag, and output format optimized for the travel professional workflow.'
    }
  ];

  const commands = [
    {
      name: 'search',
      syntax: 'flt AMS NRT 2026-04-10',
      description: 'Search flights between any two airports on a given date'
    },
    {
      name: 'matrix',
      syntax: 'flt matrix AMS NRT --from 2026-04-01 --to 2026-04-14',
      description: 'Price comparison grid across a date range'
    },
    {
      name: 'inspect',
      syntax: 'flt O1',
      description: 'Deep-dive into a specific search result by its ID'
    },
    {
      name: 'itinerary',
      syntax: 'flt itinerary IAO-MNL@0318:O1 MNL-NRT@0320:O3',
      description: 'Combine segments into a complete travel plan'
    },
    {
      name: 'airports',
      syntax: 'flt amsterdam',
      description: 'Fuzzy search airports by city, name, or IATA code'
    },
    {
      name: 'takeout',
      syntax: 'flt takeout --format tsv',
      description: 'Export all session data for spreadsheets or booking tools'
    }
  ];
</script>

<main>
  <!-- Hero -->
  <section class="hero">
    <div class="container">
      <div class="badge">Built by coding agents, for travel agents</div>
      <h1>flt</h1>
      <p class="tagline">The ultimate CLI swiss army knife for booking flights</p>
      <p class="description">
        Search flights, compare prices across dates, build itineraries, and export
        data — all from your terminal. Designed for travel professionals who move fast.
      </p>
      <div class="hero-actions">
        <div class="install-box">
          <code>bunx github:jurrejan/flights-app</code>
          <button onclick={copyInstall} class="copy-btn">
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <a href="https://github.com/jurrejan/flights" target="_blank" class="github-link">
          View on GitHub
        </a>
      </div>
    </div>
  </section>

  <!-- Terminal Demo -->
  <section class="demo">
    <div class="container">
      <div class="terminal">
        <div class="terminal-header">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <span class="terminal-title">flt</span>
        </div>
        <div class="terminal-body">
          <div class="line"><span class="prompt">$</span> flt AMS NRT 2026-04-10</div>
          <div class="line output">Searching Amsterdam → Tokyo Narita...</div>
          <div class="line output"></div>
          <div class="line output"><span class="result-id">O1</span> KLM KL861 direct · 11h 25m · <span class="price">€ 612</span></div>
          <div class="line output"><span class="result-id">O2</span> ANA NH232 via HND · 13h 40m · <span class="price">€ 589</span></div>
          <div class="line output"><span class="result-id">O3</span> JAL JL408 direct · 11h 15m · <span class="price">€ 645</span></div>
          <div class="line output"><span class="result-id">O4</span> Turkish TK1952+TK198 via IST · 16h 10m · <span class="price">€ 487</span></div>
          <div class="line output dim">4 results · tagged AMS-NRT@0410</div>
          <div class="line"></div>
          <div class="line"><span class="prompt">$</span> flt O2</div>
          <div class="line output">ANA NH232 — Amsterdam (AMS) → Tokyo Narita (NRT)</div>
          <div class="line output">  Depart: 10 Apr 2026 11:20 → Arrive: 11 Apr 07:00 (+1)</div>
          <div class="line output">  Economy · 1 stop (HND) · 13h 40m total</div>
          <div class="line output">  € 589 per passenger</div>
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
            <pre><code>bun install -g github:jurrejan/flights-app</code></pre>
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
      <pre class="cta-install"><code>bun install -g github:jurrejan/flights-app</code></pre>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div class="container">
      <p>
        <a href="https://github.com/jurrejan/flights" target="_blank">GitHub</a>
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
    align-items: center;
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
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 0.95rem;
  }

  .install-box code {
    font-size: 0.95rem;
  }

  .copy-btn {
    background: none;
    border: 1px solid #333;
    color: var(--text-code);
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 0.85rem;
    transition: border-color 0.2s;
  }

  .copy-btn:hover {
    border-color: #666;
  }

  .github-link {
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.95rem;
    padding: 12px 20px;
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

  .dot.red { background: #ff5f57; }
  .dot.yellow { background: #febc2e; }
  .dot.green { background: #28c840; }

  .terminal-title {
    color: #888;
    font-size: 0.8rem;
    font-family: 'DM Mono', monospace;
    margin-left: 8px;
  }

  .terminal-body {
    padding: 20px 24px;
    font-family: 'DM Mono', monospace;
    font-size: 0.85rem;
    line-height: 1.7;
    color: #ccc;
  }

  .line {
    min-height: 1.7em;
  }

  .prompt {
    color: #28c840;
    margin-right: 8px;
  }

  .output {
    color: #999;
  }

  .result-id {
    color: var(--accent);
    font-weight: 500;
  }

  .price {
    color: #28c840;
    font-weight: 500;
  }

  .dim {
    color: #555;
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
