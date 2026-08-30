<script lang="ts">
import { TIERS } from '$lib/tiers'

let { selected = $bindable('survey') }: { selected?: string } = $props()
</script>

<div class="tiers">
  {#each TIERS as tier}
    <button
      class="tier"
      class:on={selected === tier.id}
      onclick={() => (selected = tier.id)}
      aria-pressed={selected === tier.id}
    >
      <span class="name">{tier.name}</span>
      <span class="price">{tier.price}</span>
      <span class="scope">{tier.scope}</span>
      <span class="meta">{tier.searches} · {tier.time}</span>
    </button>
  {/each}
</div>

<p class="foot">
  You pay for how much searching you ask for, because that's the part that takes time. A Survey is
  split across several runs. Return-trip date grids are capped at 21 departure and return
  combinations; everything else is a matter of how much work you want done.
</p>

<style>
  .tiers {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 1rem;
  }
  .tier {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    text-align: left;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    color: var(--color-text);
    transition: all 0.2s ease;
  }
  .tier:hover {
    border-color: var(--color-track);
  }
  .tier.on {
    border-color: var(--color-primary);
    box-shadow: 0 0 28px var(--color-amber-glow);
  }
  .name {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
  .price {
    font-family: var(--font-mono);
    font-size: 2.6rem;
    line-height: 1;
    color: var(--color-primary);
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
    margin-top: 1.5rem;
    color: var(--color-muted);
    font-size: 0.9rem;
    max-width: var(--measure);
  }
</style>
