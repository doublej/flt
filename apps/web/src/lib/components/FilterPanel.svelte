<script lang="ts">
import type { Offer } from '$lib/types'
import AirlineFilter from './AirlineFilter.svelte'
import DurationFilter from './DurationFilter.svelte'
import PriceFilter from './PriceFilter.svelte'
import TimeFilter from './TimeFilter.svelte'

let {
  flights,
  stopsFilter = $bindable(null),
  priceFilter = $bindable(null),
  carrierFilter = $bindable(null),
  depTimeRange = $bindable(null),
  arrTimeRange = $bindable(null),
  maxDurFilter = $bindable(null),
}: {
  flights: Offer[]
  stopsFilter: number | null
  priceFilter: { min: number; max: number } | null
  carrierFilter: Set<string> | null
  depTimeRange: { min: number; max: number } | null
  arrTimeRange: { min: number; max: number } | null
  maxDurFilter: number | null
} = $props()

let showAdvanced = $state(false)

const stopCounts = $derived.by(() => {
  const counts = [0, 0, 0]
  for (const f of flights) {
    if (f.stops === 0) counts[0]++
    else if (f.stops === 1) counts[1]++
    else counts[2]++
  }
  return counts
})

const advancedFilterCount = $derived(
  (carrierFilter ? 1 : 0) +
    (depTimeRange ? 1 : 0) +
    (arrTimeRange ? 1 : 0) +
    (maxDurFilter != null ? 1 : 0),
)
</script>

<div class="filter-panel">
  <div class="filters">
    <span class="filter-label">Stops</span>
    <button type="button" class="chip" class:active={stopsFilter === null} onclick={() => (stopsFilter = null)}>
      Any ({flights.length})
    </button>
    {#if stopCounts[0] > 0}
      <button type="button" class="chip" class:active={stopsFilter === 0} onclick={() => (stopsFilter = stopsFilter === 0 ? null : 0)}>
        Non-stop ({stopCounts[0]})
      </button>
    {/if}
    {#if stopCounts[1] > 0}
      <button type="button" class="chip" class:active={stopsFilter === 1} onclick={() => (stopsFilter = stopsFilter === 1 ? null : 1)}>
        1 stop ({stopCounts[1]})
      </button>
    {/if}
    {#if stopCounts[2] > 0}
      <button type="button" class="chip" class:active={stopsFilter === 2} onclick={() => (stopsFilter = stopsFilter === 2 ? null : 2)}>
        2+ ({stopCounts[2]})
      </button>
    {/if}
  </div>

  <PriceFilter {flights} bind:value={priceFilter} />

  <button type="button" class="advanced-toggle" onclick={() => (showAdvanced = !showAdvanced)}>
    {showAdvanced ? 'Hide' : 'More'} filters
    {#if advancedFilterCount > 0}
      <span class="filter-badge">{advancedFilterCount}</span>
    {/if}
  </button>

  {#if showAdvanced}
    <div class="advanced-filters">
      <AirlineFilter {flights} bind:value={carrierFilter} />
      <TimeFilter {flights} label="Departure" field="departure" bind:value={depTimeRange} />
      <TimeFilter {flights} label="Arrival" field="arrival" bind:value={arrTimeRange} />
      <DurationFilter {flights} bind:value={maxDurFilter} />
    </div>
  {/if}
</div>

<style>
  .filter-panel {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 10px 14px;
    margin-bottom: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .filters {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .filter-label {
    font-size: 0.72rem;
    color: var(--color-text);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-right: 4px;
    min-width: 32px;
  }
  .chip {
    padding: 5px 12px;
    border: 1px solid var(--color-border);
    border-radius: 16px;
    font-size: 0.82rem;
    background: var(--color-surface);
    color: var(--color-muted);
    white-space: nowrap;
    transition: border-color 0.12s, color 0.12s;
  }
  .chip:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  .chip.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-bg);
    font-weight: 500;
  }
  .advanced-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: var(--color-muted);
    font-size: 0.8rem;
    padding: 0;
    cursor: pointer;
  }
  .advanced-toggle:hover {
    color: var(--color-primary);
  }
  .filter-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    font-size: 0.7rem;
    font-weight: 700;
    background: var(--color-primary);
    color: var(--color-bg);
    border-radius: 50%;
  }
  .advanced-filters {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 4px;
  }
</style>
