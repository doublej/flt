<script lang="ts">
import type { SearchResult } from '$lib/types'
import FlightCard from './FlightCard.svelte'

const { result }: { result: SearchResult } = $props()

const priceLabels: Record<string, { text: string; className: string }> = {
  low: { text: 'Prices are low right now', className: 'low' },
  typical: { text: 'Prices are typical', className: 'typical' },
  high: { text: 'Prices are high right now', className: 'high' },
}

const priceInfo = $derived(priceLabels[result.current_price])
</script>

<div class="results">
  {#if priceInfo}
    <div class="price-banner {priceInfo.className}">
      {priceInfo.text}
    </div>
  {/if}

  {#if result.flights.length === 0}
    <p class="empty">No flights found for this route.</p>
  {:else}
    <div class="list">
      {#each result.flights as flight}
        <FlightCard {flight} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .results {
    margin-top: 1.5rem;
  }
  .price-banner {
    text-align: center;
    padding: 10px;
    border-radius: var(--radius);
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 1rem;
  }
  .price-banner.low {
    background: #e6f4ea;
    color: #137333;
  }
  .price-banner.typical {
    background: #fef7e0;
    color: #b45309;
  }
  .price-banner.high {
    background: #fce8e6;
    color: #c5221f;
  }
  .empty {
    text-align: center;
    color: var(--color-muted);
    padding: 2rem;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
</style>
