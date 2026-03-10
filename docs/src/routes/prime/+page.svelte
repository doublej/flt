<script lang="ts">
  import Terminal from '$lib/components/Terminal.svelte'

  const regions = [
    { name: 'gulf', codes: 'DXB, DOH, AUH, BAH, MCT, KWI' },
    { name: 'middleeast', codes: 'DXB, DOH, AUH, BAH, MCT, KWI, RUH, JED, AMM, TLV, CAI, BGW, IKA, THR' },
    { name: 'russia', codes: 'SVO, DME, LED, VKO' },
    { name: 'belarus', codes: 'MSQ' },
  ]

  const phases = [
    {
      number: 1,
      name: 'Resolve',
      gate: 'All airports are confirmed IATA codes',
      steps: [
        'Resolve ambiguous cities/airports with <code>flt airports &lt;query&gt;</code>, confirm IATA codes with user.',
        'For multi-stop routes (5+ legs): run <code>flt connections &lt;from&gt; &lt;to&gt;</code> to discover viable paths.',
        'Compare transit hubs if needed: <code>flt compare KUL,BKK,IST AMS 2026-03-22</code>.',
      ],
    },
    {
      number: 2,
      name: 'Search',
      gate: 'All legs have search results',
      steps: [
        'One search per leg. Flexible dates: <code>flt matrix</code> (max 7 combos). Fixed dates: <code>flt search</code>.',
        'Refine with filters (<code>--carrier</code>, <code>--max-stops</code>, <code>--dep-after</code>, etc.). Prefer filtering one search over running many.',
        'Present top 3-5 per leg with price, duration, stops, carrier, times.',
      ],
    },
    {
      number: 3,
      name: 'Shortlist',
      gate: 'User has approved favorites for every leg',
      steps: [
        '<code>flt fav &lt;ID&gt;</code> promising offers. They survive cache expiry and are the basis for itineraries.',
        'Use <code>flt inspect &lt;ID&gt;</code> for detail. Use <code>flt favs</code> to review the full shortlist.',
        'Ask the user to confirm their preferred offer per leg. Do not proceed until each leg has a user-approved fav.',
      ],
    },
    {
      number: 4,
      name: 'Compose',
      gate: 'Itinerary previewed and user-approved',
      steps: [
        'Build itinerary: <code>flt itinerary &lt;REF:ID&gt; [REF:ID...] --title "..."</code>.',
        'Use full REF:ID format for precision, or plain IDs which search all session results.',
        'Check connection times (min 2h domestic, 3h international), total price, travel time.',
        'If connections are too tight, go back to Phase 2/3 for that leg.',
      ],
    },
    {
      number: 5,
      name: 'Deliver',
      gate: 'Export complete',
      steps: [
        '<code>flt takeout --itin "Label" REF:ID REF:ID --title "Trip Title"</code>.',
        'For PDF export: add <code>--pdf</code>.',
        'Warn user: takeout auto-closes the session unless <code>--keep-session</code> is passed.',
      ],
    },
  ]

  const commands = [
    {
      category: 'Session',
      items: [
        { syntax: 'flt session start ["name"]', desc: 'Start named session (closes active one)' },
        { syntax: 'flt session close', desc: 'Close active session' },
        { syntax: 'flt session list', desc: 'List all sessions' },
        { syntax: 'flt session reopen [id]', desc: 'Re-open last closed (or specific) session' },
        { syntax: 'flt session refs [--id s1]', desc: 'List search refs with query and offer count' },
        { syntax: 'flt session rename "new name"', desc: 'Rename active (or --id) session' },
        { syntax: 'flt session nuke', desc: 'Delete ALL data (irreversible)' },
      ],
    },
    {
      category: 'Search',
      items: [
        { syntax: 'flt AMS NRT 2026-04-10', desc: 'One-way search' },
        { syntax: 'flt AMS NRT 2026-04-10 2026-04-18', desc: 'Round-trip search' },
      ],
      options: [
        { flag: '--seat', values: 'economy | premium-economy | business | first' },
        { flag: '--pax', values: '1ad | 2ad1ch | 1ad1in' },
        { flag: '--max-stops', values: '0 | 1 | 2' },
        { flag: '--currency', values: 'EUR | USD | ...' },
        { flag: '--direct', values: 'Non-stop only' },
        { flag: '--limit', values: 'Max results' },
        { flag: '--carrier', values: 'Include carrier substring' },
        { flag: '--exclude-carrier', values: 'Exclude carriers (comma-separated)' },
        { flag: '--exclude-hub', values: 'Exclude hubs (comma-separated IATA)' },
        { flag: '--exclude-region', values: 'Exclude region shorthand' },
        { flag: '--dep-after/before', values: 'HH:MM departure window' },
        { flag: '--arr-after/before', values: 'HH:MM arrival window' },
        { flag: '--max-dur', values: 'Max duration in minutes' },
        { flag: '--sort', values: 'price | dur | stops | dep' },
        { flag: '--fmt', values: 'jsonl | tsv | table | brief' },
        { flag: '--view', values: 'min | std | full' },
        { flag: '--fields', values: 'Custom field CSV' },
      ],
    },
    {
      category: 'Matrix',
      items: [
        { syntax: 'flt matrix AMS NRT 2026-04-01 2026-04-14', desc: 'One-way date range' },
        { syntax: 'flt matrix AMS NRT 04-01 04-07 04-08 04-14', desc: 'Round-trip date range' },
      ],
    },
    {
      category: 'Compare',
      items: [
        { syntax: 'flt compare KUL,BKK,MNL AMS 2026-03-22', desc: 'Cheapest from each origin' },
        { syntax: 'flt compare CEB KUL,BKK,ICN 2026-03-19', desc: 'Cheapest to each destination' },
      ],
    },
    {
      category: 'Inspect',
      items: [
        { syntax: 'flt inspect Fa3b7', desc: 'Inspect by flight ID' },
        { syntax: 'flt Fa3b7', desc: 'Shorthand (auto-detected)' },
      ],
    },
    {
      category: 'Itinerary',
      items: [
        { syntax: 'flt itinerary REF:ID [REF:ID...] --title "..."', desc: 'Compose multi-leg itinerary' },
      ],
    },
    {
      category: 'Takeout',
      items: [
        { syntax: 'flt takeout --itin "Label" REF:ID REF:ID --title "..."', desc: 'Export session data' },
      ],
    },
    {
      category: 'Airports',
      items: [
        { syntax: 'flt airports tokyo', desc: 'Fuzzy search by city, name, or IATA' },
        { syntax: 'flt tokyo', desc: 'Shorthand (auto-detected)' },
      ],
    },
    {
      category: 'Favorites',
      items: [
        { syntax: 'flt fav O1', desc: 'Bookmark an offer' },
        { syntax: 'flt unfav O1', desc: 'Remove bookmark' },
        { syntax: 'flt favs', desc: 'List all favorites' },
      ],
    },
    {
      category: 'Connections',
      items: [
        { syntax: 'flt connections AMS SYD', desc: 'Find routing options between two airports' },
      ],
      options: [
        { flag: '--min-stops', values: 'Minimum stops (default 5)' },
        { flag: '--max-stops', values: 'Maximum stops (default 10)' },
        { flag: '--max-results', values: 'Limit results (default 50)' },
        { flag: '--max-detour', values: 'Max detour ratio (default 3.0)' },
        { flag: '--via', values: 'Force waypoints (comma-separated IATA)' },
        { flag: '--exclude', values: 'Exclude hubs (comma-separated IATA)' },
        { flag: '--exclude-region', values: 'Exclude region shorthand' },
        { flag: '--names', values: 'Show city names alongside IATA codes' },
      ],
    },
  ]

  const rules = [
    {
      title: 'Rate limits',
      icon: '⚠',
      items: [
        'Built-in 3s throttle between requests. Never add manual sleeps.',
        'Never run search/matrix in parallel.',
        'Prefer <code>flt matrix</code> for date comparisons (max 21 combos, 5-7 is safer).',
        'On <code>{"err":"BLOCKED"}</code>: stop all requests, <code>sleep 60</code>, retry with smaller scope.',
      ],
    },
    {
      title: 'Caching',
      icon: '↻',
      items: [
        'Cached by full query shape (dep/ret date, cabin, pax, stops, currency).',
        'Fresh for 6 hours. <code>--refresh</code> bypasses.',
        'Flight IDs (e.g. <code>Fa3b7</code>) are stable SHA-1 hashes from legs.',
        'Plain IDs resolve across all session searches (latest first). <code>REF:ID</code> for explicit lookups.',
        'Read-only commands (<code>inspect</code>, <code>itinerary</code>, <code>takeout</code>, <code>airports</code>, <code>favs</code>) never hit Google.',
      ],
    },
    {
      title: 'Sessions',
      icon: '▶',
      items: [
        'Auto-start on first search (named after route).',
        '<code>flt takeout</code> auto-closes the session. Use <code>--keep-session</code> to prevent.',
        'Start every response with: <strong>session: name (id)</strong>.',
      ],
    },
  ]

  const errors = [
    { code: 'NO_RESULTS', action: 'Relax filters (wider date range, allow stops, remove carrier constraint)' },
    { code: 'TOO_MANY', action: 'Fewer date combos in matrix' },
    { code: 'NO_SESSION', action: 'Run a search first to auto-start a session' },
    { code: 'BLOCKED', action: 'Stop all requests, sleep 60, retry with smaller scope' },
  ]
</script>

<main>
  <!-- Hero -->
  <section class="hero">
    <div class="container">
      <div class="badge">flt prime</div>
      <h1>Agent Guide</h1>
      <p class="subtitle">
        The complete reference that <code>flt prime</code> outputs for AI coding agents.
        Everything an agent needs to search flights, build itineraries, and deliver results.
      </p>
      <div class="run-box">
        <Terminal maxWidth="420px">
          <div class="line"><span class="prompt">$</span> flt prime</div>
        </Terminal>
      </div>
    </div>
  </section>

  <!-- Rules -->
  <section class="section">
    <div class="container">
      <h2>Rules</h2>
      <p class="section-desc">Constraints the agent must follow during every session.</p>
      <div class="rules-grid">
        {#each rules as rule}
          <div class="rule-card">
            <h3><span class="rule-icon">{rule.icon}</span> {rule.title}</h3>
            <ul>
              {#each rule.items as item}
                <li>{@html item}</li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Workflow -->
  <section class="section alt">
    <div class="container">
      <h2>Workflow</h2>
      <p class="section-desc">Five phases, in order. Each has a gate that must be met before proceeding.</p>
      <div class="phases">
        {#each phases as phase, i}
          <div class="phase" style="animation-delay: {i * 100}ms">
            <div class="phase-header">
              <div class="phase-number">{phase.number}</div>
              <div class="phase-meta">
                <h3>{phase.name}</h3>
                <div class="phase-gate">Gate: {phase.gate}</div>
              </div>
            </div>
            <ul class="phase-steps">
              {#each phase.steps as step}
                <li>{@html step}</li>
              {/each}
            </ul>
          </div>
          {#if i < phases.length - 1}
            <div class="phase-connector">
              <div class="connector-line"></div>
              <div class="connector-arrow">&#x25BC;</div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </section>

  <!-- Commands -->
  <section class="section">
    <div class="container">
      <h2>Commands</h2>
      <p class="section-desc">Full command reference with syntax and options.</p>
      <div class="command-groups">
        {#each commands as group}
          <div class="cmd-group">
            <h3>{group.category}</h3>
            <div class="cmd-items">
              {#each group.items as item}
                <div class="cmd-row">
                  <code class="cmd-syntax">{item.syntax}</code>
                  <span class="cmd-desc">{item.desc}</span>
                </div>
              {/each}
            </div>
            {#if group.options}
              <details class="cmd-options">
                <summary>Options ({group.options.length})</summary>
                <div class="options-grid">
                  {#each group.options as opt}
                    <div class="opt-row">
                      <code class="opt-flag">{opt.flag}</code>
                      <span class="opt-values">{opt.values}</span>
                    </div>
                  {/each}
                </div>
              </details>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Regions -->
  <section class="section alt">
    <div class="container">
      <h2>Region Shorthands</h2>
      <p class="section-desc">Use with <code>--exclude-region</code>. Mixable with IATA codes.</p>
      <div class="regions-grid">
        {#each regions as region}
          <div class="region-card">
            <code class="region-name">{region.name}</code>
            <span class="region-codes">{region.codes}</span>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Errors -->
  <section class="section">
    <div class="container">
      <h2>Error Codes</h2>
      <p class="section-desc">JSON format: <code>{`{"err":"CODE","hint":"..."}`}</code></p>
      <div class="error-grid">
        {#each errors as error}
          <div class="error-row">
            <code class="error-code">{error.code}</code>
            <span class="error-action">{error.action}</span>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Output -->
  <section class="section alt">
    <div class="container">
      <h2>Output guidelines</h2>
      <p class="section-desc">How the agent should present results to the user.</p>
      <div class="output-list">
        <div class="output-item">
          <strong>Lead with context:</strong> route(s), dates, constraints, currency.
        </div>
        <div class="output-item">
          <strong>Top 3-5 options:</strong> ID, price, stops, duration, carrier, dep-arr (+day).
        </div>
        <div class="output-item">
          <strong>Matrix:</strong> summarize cheapest dates first, then detail-search best 1-2.
        </div>
        <div class="output-item">
          <strong>Multi-leg:</strong> show itineraries with total price + connection notes.
        </div>
        <div class="output-item">
          <strong>Next steps:</strong> offer only if useful ("I can widen time window / allow 1 stop / extend dates").
        </div>
        <div class="output-item">
          <strong>Formats:</strong> <code>--fmt brief</code> for readable pulls, <code>--fmt tsv</code> for compact parsing. Default <code>--limit 100</code>.
        </div>
        <div class="output-item">
          <strong>Limitations:</strong> no fare rules, baggage, seat maps, booking classes, or loyalty info. Mention only when relevant.
        </div>
      </div>
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

  .section {
    padding: var(--section-padding) 0;
  }

  .section.alt {
    background: var(--bg-secondary);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }

  /* Hero */
  .hero {
    padding: 80px 0 40px;
    text-align: center;
  }

  .badge {
    display: inline-block;
    font-family: 'DM Mono', monospace;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--accent);
    background: var(--accent-subtle);
    padding: 6px 16px;
    border-radius: 20px;
    margin-bottom: 24px;
  }

  .hero h1 {
    font-size: 2.5rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin-bottom: 16px;
  }

  .subtitle {
    font-size: 1.1rem;
    color: var(--text-secondary);
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .subtitle code {
    font-size: 0.9em;
    background: var(--accent-subtle);
    color: var(--accent);
    padding: 2px 6px;
    border-radius: 3px;
  }

  .run-box {
    margin-top: 32px;
  }

  .line { min-height: 1.7em; }
  .prompt { color: #5cb870; margin-right: 8px; }

  /* Section headings */
  .section h2 {
    font-size: 1.8rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-bottom: 8px;
  }

  .section-desc {
    color: var(--text-secondary);
    margin-bottom: 32px;
    line-height: 1.6;
  }

  .section-desc code {
    font-size: 0.85em;
    background: var(--bg-code);
    color: var(--text-code);
    padding: 2px 6px;
    border-radius: 3px;
  }

  /* Rules */
  .rules-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--grid-gap);
  }

  .rule-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 24px;
  }

  .rule-card h3 {
    font-size: 1.05rem;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .rule-icon {
    margin-right: 4px;
  }

  .rule-card ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .rule-card li {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.5;
    padding-left: 14px;
    position: relative;
  }

  .rule-card li::before {
    content: '·';
    position: absolute;
    left: 0;
    color: var(--text-tertiary);
    font-weight: 700;
  }

  .rule-card :global(code) {
    font-size: 0.8em;
    background: var(--bg-code);
    color: var(--text-code);
    padding: 1px 5px;
    border-radius: 3px;
  }

  /* Phases / Workflow */
  .phases {
    max-width: 700px;
    margin: 0 auto;
  }

  .phase {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 24px;
    background: var(--bg-primary);
    animation: fadeSlideUp 0.5s ease-out forwards;
    opacity: 0;
  }

  .phase-header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .phase-number {
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

  .phase-meta {
    flex: 1;
  }

  .phase-meta h3 {
    font-size: 1.15rem;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .phase-gate {
    font-size: 0.85rem;
    color: var(--accent);
    font-weight: 500;
  }

  .phase-steps {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 52px;
  }

  .phase-steps li {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.55;
    padding-left: 14px;
    position: relative;
  }

  .phase-steps li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: var(--text-tertiary);
  }

  .phase-steps :global(code) {
    font-size: 0.8em;
    background: var(--bg-code);
    color: var(--text-code);
    padding: 1px 5px;
    border-radius: 3px;
  }

  .phase-connector {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 0;
  }

  .connector-line {
    width: 1px;
    height: 12px;
    background: var(--border);
  }

  .connector-arrow {
    color: var(--text-tertiary);
    font-size: 0.6rem;
    line-height: 1;
  }

  /* Commands */
  .command-groups {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 800px;
    margin: 0 auto;
  }

  .cmd-group {
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    background: var(--bg-secondary);
  }

  .cmd-group h3 {
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-tertiary);
    padding: 14px 20px 10px;
  }

  .cmd-items {
    display: flex;
    flex-direction: column;
  }

  .cmd-row {
    display: flex;
    align-items: baseline;
    gap: 16px;
    padding: 8px 20px;
    flex-wrap: wrap;
  }

  .cmd-row:last-child {
    padding-bottom: 14px;
  }

  .cmd-syntax {
    font-size: 0.82rem;
    color: var(--text-code);
    background: var(--bg-code);
    padding: 3px 8px;
    border-radius: 4px;
    white-space: nowrap;
  }

  .cmd-desc {
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .cmd-options {
    border-top: 1px solid var(--border);
  }

  .cmd-options summary {
    padding: 10px 20px;
    font-size: 0.85rem;
    color: var(--text-tertiary);
    cursor: pointer;
    user-select: none;
  }

  .cmd-options summary:hover {
    color: var(--text-secondary);
  }

  .options-grid {
    display: flex;
    flex-direction: column;
    padding: 0 20px 14px;
    gap: 6px;
  }

  .opt-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
  }

  .opt-flag {
    font-size: 0.8rem;
    color: var(--accent);
    background: var(--accent-subtle);
    padding: 2px 6px;
    border-radius: 3px;
    white-space: nowrap;
  }

  .opt-values {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  /* Regions */
  .regions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    max-width: 700px;
    margin: 0 auto;
  }

  .region-card {
    display: flex;
    align-items: baseline;
    gap: 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 18px;
  }

  .region-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--accent);
    background: var(--accent-subtle);
    padding: 2px 8px;
    border-radius: 3px;
    white-space: nowrap;
  }

  .region-codes {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-family: 'DM Mono', monospace;
  }

  /* Errors */
  .error-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 700px;
    margin: 0 auto;
  }

  .error-row {
    display: flex;
    align-items: baseline;
    gap: 16px;
    padding: 14px 18px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    flex-wrap: wrap;
  }

  .error-code {
    font-size: 0.82rem;
    font-weight: 500;
    color: #c44;
    background: #fef2f2;
    padding: 3px 8px;
    border-radius: 4px;
    white-space: nowrap;
  }

  .error-action {
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  /* Output */
  .output-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 700px;
    margin: 0 auto;
  }

  .output-item {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.55;
    padding: 12px 18px;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .output-item strong {
    color: var(--text-primary);
    font-weight: 600;
  }

  .output-item :global(code) {
    font-size: 0.8em;
    background: var(--bg-code);
    color: var(--text-code);
    padding: 1px 5px;
    border-radius: 3px;
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
    .rules-grid {
      grid-template-columns: 1fr;
    }

    .regions-grid {
      grid-template-columns: 1fr;
    }

    .phase-steps {
      padding-left: 0;
    }

    .cmd-row {
      flex-direction: column;
      gap: 4px;
    }

    .hero h1 {
      font-size: 2rem;
    }
  }
</style>
