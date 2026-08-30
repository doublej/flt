<script lang="ts">
import { AVOIDING, LAYOVER_TOP } from '$lib/scenarios'

/** One dot per option that came back. The gold dots are the ones that connect
 *  in a Gulf hub — DXB, DOH, AUH, BAH, MCT or KWI. Press the switch and they
 *  go, which is exactly what excluding a hub does: it takes options away, and
 *  the cheapest fare left is whatever survives. */
let avoid = $state(false)

const nf = new Intl.NumberFormat('en-GB')
const maxLayover = Math.max(...LAYOVER_TOP.map((l) => l.count))
</script>

<div class="head">
  <button type="button" onclick={() => (avoid = !avoid)} aria-pressed={avoid}>
    {avoid ? 'Gulf hubs excluded' : 'Everything we found'}
  </button>
  <p>Press to drop every option that connects in Dubai, Doha, Abu Dhabi, Bahrain, Muscat or Kuwait.</p>
</div>

<div class="fields">
  {#each AVOIDING as a (a.route)}
    {@const price = avoid ? a.cheapestAvoiding : a.cheapest}
    <figure class:avoid>
      <figcaption>
        <span class="route">{a.route}</span>
        <span class="n">{nf.format(avoid ? a.options - a.viaGulf : a.options)} options</span>
      </figcaption>

      <div class="dots">
        {#each Array(a.options) as _, i (i)}
          <span class:gulf={i < a.viaGulf}></span>
        {/each}
      </div>

      <p class="price">
        Cheapest <b>€{price}</b>
        {#if a.cheapestAvoiding > a.cheapest}
          <em>{avoid ? `up €${a.cheapestAvoiding - a.cheapest}` : `€${a.cheapestAvoiding} without them`}</em>
        {:else}
          <em>unchanged either way</em>
        {/if}
      </p>
    </figure>
  {/each}
</div>

<div class="hubs">
  <h4>Where the connections actually happen</h4>
  <ul>
    {#each LAYOVER_TOP as l (l.code)}
      <li>
        <span class="code">{l.code}</span>
        <span class="bar" style:width="{(l.count / maxLayover) * 100}%"></span>
        <span class="v">{l.count}</span>
      </li>
    {/each}
  </ul>
  <p class="note">
    Connection counts across all 2,942 options; 66 different airports appeared in total. Excluding a
    hub matches an option's connecting airports only — it never rules out your origin or your
    destination.
  </p>
</div>

<style>
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    margin-top: var(--space-5);
  }
  .head button {
    border: 1px solid var(--color-primary);
    background: none;
    color: var(--color-primary);
    border-radius: 999px;
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    white-space: nowrap;
  }
  .head button[aria-pressed="true"] {
    background: var(--color-primary);
    color: var(--color-surface);
  }
  .head p {
    font-size: 0.83rem;
    color: var(--color-muted);
    max-width: 34rem;
  }

  .fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    gap: var(--space-4);
    margin-top: var(--space-4);
  }
  figure {
    margin: 0;
    display: grid;
    gap: 0.6rem;
    align-content: start;
  }
  figcaption {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.4rem;
  }
  .route {
    font-size: 0.95rem;
  }
  .n {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 0.78rem;
    color: var(--color-muted);
  }

  .dots {
    display: grid;
    grid-template-columns: repeat(auto-fill, 5px);
    gap: 2px;
  }
  .dots span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--color-primary) 45%, var(--color-track));
    transition: opacity 0.35s ease, background 0.35s ease;
  }
  .dots span.gulf {
    background: var(--color-saving);
  }
  figure.avoid .dots span.gulf {
    opacity: 0.12;
    background: var(--color-track);
  }

  .price {
    font-size: 0.9rem;
    color: var(--color-muted);
  }
  .price b {
    font-family: var(--font-mono);
    font-weight: 400;
    font-size: 1.05rem;
    color: var(--color-text);
  }
  .price em {
    font-style: normal;
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--color-saving);
    margin-left: 0.4rem;
  }

  .hubs {
    margin-top: var(--space-5);
    max-width: 32rem;
  }
  h4 {
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-muted);
    margin-bottom: var(--space-2);
  }
  .hubs ul {
    list-style: none;
    display: grid;
    gap: 0.4rem;
  }
  .hubs li {
    display: grid;
    grid-template-columns: 2.6rem 1fr 2.6rem;
    align-items: center;
    gap: 0.6rem;
  }
  .code,
  .v {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 0.78rem;
    color: var(--color-muted);
  }
  .v {
    text-align: right;
  }
  .bar {
    height: 0.5rem;
    background: color-mix(in srgb, var(--color-primary) 55%, var(--color-track));
    border-radius: 1px;
  }
  .note {
    margin-top: var(--space-3);
    font-size: 0.82rem;
    color: var(--color-muted);
  }
</style>
