<script lang="ts">
import { getCopy, getLocale } from '$lib/i18n/copy.svelte'
import { AVOIDING, LAYOVER_DISTINCT, LAYOVER_TOP, TOTALS } from '$lib/scenarios'

/** What excluding a hub actually does, in one bar per route. The bar is that
 *  route's own options at full width, the coloured head of it is the share that
 *  connects in a Gulf hub — DXB, DOH, AUH, BAH, MCT or KWI. Press the switch and
 *  that head goes and the bar visibly gets shorter inside its own outline, which
 *  is the whole mechanism: we read everything, then take options away.
 *
 *  This used to be one dot per option. A thousand dots made a slab ten rows deep
 *  next to Hanoi's single row, so the two routes could not be compared and the
 *  band was mostly grey. Normalised, the comparison is the point: the Gulf is a
 *  far bigger share of Hanoi's options than of Singapore's, and it is Singapore
 *  where losing them costs money. */
let avoid = $state(false)

const copy = $derived(getCopy())
const nf = $derived(new Intl.NumberFormat(getLocale() === 'nl' ? 'nl-NL' : 'en-GB'))
</script>

<div class="head">
  <button type="button" onclick={() => (avoid = !avoid)} aria-pressed={avoid}>
    {avoid ? copy.avoid.toggleOn : copy.avoid.toggleOff}
  </button>
  <p>{copy.avoid.toggleHint}</p>
</div>

<div class="fields">
  {#each AVOIDING as a (a.route)}
    {@const share = (a.viaGulf / a.options) * 100}
    {@const price = avoid ? a.cheapestAvoiding : a.cheapest}
    <figure class:avoid>
      <figcaption>
        <span class="route">{a.route}</span>
        <span class="n">
          {copy.avoid.optionCount(nf.format(avoid ? a.options - a.viaGulf : a.options))}
        </span>
      </figcaption>

      <!-- the outline is where the bar started, so the shrink has something to
           be measured against -->
      <div class="track">
        <span class="gulf" style:width="{share}%"></span>
        <span class="rest" style:width="{100 - share}%"></span>
      </div>

      <p class="lines">
        <span class="via">{copy.avoid.viaGulf(nf.format(a.viaGulf))}</span>
        <span class="price">
          {copy.avoid.cheapest} <b>€{price}</b>
          {#if a.cheapestAvoiding > a.cheapest}
            <em>
              {avoid
                ? copy.avoid.up(a.cheapestAvoiding - a.cheapest)
                : copy.avoid.without(a.cheapestAvoiding)}
            </em>
          {:else}
            <em>{copy.avoid.unchanged}</em>
          {/if}
        </span>
      </p>
    </figure>
  {/each}
</div>

<!-- Where the connections happen: six counts, one line. It was a six-row bar
     chart under its own flap plate, which is a second exhibit in a band that
     only makes one argument. -->
<p class="hubs">
  <span class="k">{copy.avoid.hubsHeading}</span>
  {#each LAYOVER_TOP as l (l.code)}
    <span class="hub"><b>{l.code}</b> {nf.format(l.count)}</span>
  {/each}
</p>
<p class="note">{copy.avoid.hubsNote(nf.format(TOTALS.options), LAYOVER_DISTINCT)}</p>

<style>
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    margin-top: var(--space-4);
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
    max-width: 28rem;
  }

  .fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: var(--space-4) var(--space-5);
    margin-top: var(--space-4);
    /* two routes, and they are meant to be read against each other rather than
       across the whole band */
    max-width: 58rem;
  }
  figure {
    margin: 0;
    display: grid;
    gap: 0.55rem;
    align-content: start;
  }
  figcaption {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.35rem;
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

  .track {
    display: flex;
    height: 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: 2px;
    /* the segments run to the outline's own edges */
    padding: 0;
  }
  .track span {
    display: block;
    height: 100%;
    transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease;
  }
  .gulf {
    background: var(--color-saving);
  }
  .rest {
    background: color-mix(in srgb, var(--color-primary) 55%, var(--color-track));
  }
  figure.avoid .gulf {
    width: 0 !important;
    opacity: 0;
  }

  .lines {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.4rem var(--space-3);
    font-size: 0.9rem;
    color: var(--color-muted);
  }
  .via {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-saving);
  }
  figure.avoid .via {
    color: var(--color-muted);
    text-decoration: line-through;
  }
  .price b {
    font-family: var(--font-mono);
    font-weight: 400;
    font-size: 1.02rem;
    color: var(--color-text);
  }
  .price em {
    font-style: normal;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-saving);
    margin-left: 0.3rem;
  }

  /* One line: a label, then the six counts. */
  .hubs {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem 0.9rem;
    margin-top: var(--space-5);
    max-width: 58rem;
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    color: var(--color-muted);
  }
  .hubs .k {
    font-size: 0.68rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .hubs .hub b {
    font-weight: 400;
    color: var(--color-text);
  }
  .note {
    margin-top: var(--space-3);
    max-width: 58ch;
    font-size: 0.82rem;
    color: var(--color-muted);
  }
</style>
