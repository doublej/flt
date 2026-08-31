<script lang="ts">
import FlapText from '$lib/components/FlapText.svelte'
import { TIERS } from '$lib/tiers'

let { selected = $bindable('survey') }: { selected?: string } = $props()

/* Every board the same width, with the figure right-aligned in it, so the three
   cards read as one fixture rather than three differently sized ones. €3 and
   €10 would otherwise build boards a whole flap apart. */
const digits = Math.max(...TIERS.map((t) => t.price.replace('€', '').length))
const fare = (price: string) => `EUR ${price.replace('€', '').padStart(digits, ' ')}`
</script>

<div class="tiers">
  {#each TIERS as tier (tier.id)}
    <button
      class="tier"
      class:on={selected === tier.id}
      onclick={() => (selected = tier.id)}
      aria-pressed={selected === tier.id}
    >
      <span class="name">{tier.name}</span>
      <span class="well"><FlapText text={fare(tier.price)} variant="night" size="1.35rem" /></span>
      <span class="scope">{tier.scope}</span>
      <span class="meta">{tier.searches} · {tier.time}</span>
    </button>
  {/each}
</div>

<p class="foot">
  You pay for how much searching you ask for, because that is the part that takes the time. A
  Survey is split across several runs, and return-trip date grids are capped at 21 departure and
  return combinations; everything else is a matter of how much work you want done.
</p>

<style>
  .tiers {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--space-3);
    margin-top: var(--space-5);
  }
  .tier {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    text-align: left;
    /* a card lit from above rather than a flat fill */
    background:
      linear-gradient(180deg, rgb(255 255 255 / 0.7), rgb(255 255 255 / 0) 40%),
      var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    color: var(--color-text);
    cursor: pointer;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;
  }
  .tier:hover {
    transform: translateY(-2px);
    border-color: var(--color-track);
    box-shadow: 0 0.6rem 1.4rem rgb(0 0 0 / 0.09);
  }
  .tier:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
  }
  .tier.on {
    border-color: var(--color-primary);
    box-shadow:
      0 0.6rem 1.6rem rgb(0 0 0 / 0.1),
      0 0 28px var(--color-amber-glow);
  }
  .name {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
  /* The board sits in a routed recess rather than on the surface: a dark floor,
     a shadow cast down onto it and a lip catching the light at the top. That is
     what gives a small board any body at this size. */
  .well {
    align-self: start;
    margin: 0.55rem 0 0.35rem;
    padding: 0.5rem 0.6rem;
    border-radius: calc(var(--radius) * 0.9);
    background: linear-gradient(180deg, rgb(0 0 0 / 0.09), rgb(0 0 0 / 0.03));
    box-shadow:
      inset 0 1px 3px rgb(0 0 0 / 0.22),
      inset 0 -1px 0 rgb(255 255 255 / 0.55);
    line-height: 0;
  }
  .scope {
    font-size: 0.95rem;
    margin-top: 0.25rem;
  }
  .meta {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-muted);
    margin-top: auto;
    padding-top: 0.75rem;
  }
  .foot {
    margin-top: var(--space-4);
    color: var(--color-muted);
    font-size: 0.9rem;
    max-width: var(--measure);
  }
  @media (prefers-reduced-motion: reduce) {
    .tier:hover {
      transform: none;
    }
  }
</style>
