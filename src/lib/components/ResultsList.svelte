<script lang="ts">
import type { SearchResult } from '$lib/types'
import { resultToMarkdown } from '$lib/utils/markdown'
import { type SortKey, parsePrice, sortFlights } from '$lib/utils/sort'
import FlightCard from './FlightCard.svelte'
import PriceFilter from './PriceFilter.svelte'
import PriceGrid from './PriceGrid.svelte'

const { result }: { result: SearchResult } = $props()

let sortKey: SortKey = $state('best')
let selectedCombo: { dep: string; ret: string | null } | null = $state(null)
let stopsFilter: number | null = $state(null)
let priceFilter: { min: number; max: number } | null = $state(null)

const hasMultipleDates = $derived(new Set(result.flights.map((f) => f.departure_date)).size > 1)

const baseFlights = $derived.by(() => {
  let list = result.flights
  if (selectedCombo) {
    const { dep, ret } = selectedCombo
    list = list.filter(
      (f) =>
        f.departure_date === dep && (ret === null ? f.return_date == null : f.return_date === ret),
    )
  }
  return list
})

const stopCounts = $derived.by(() => {
  const counts = [0, 0, 0]
  for (const f of baseFlights) {
    if (f.stops === 0) counts[0]++
    else if (f.stops === 1) counts[1]++
    else counts[2]++
  }
  return counts
})

const filteredFlights = $derived.by(() => {
  let list = [...baseFlights]
  if (stopsFilter !== null) {
    list = list.filter((f) => (stopsFilter === 2 ? f.stops >= 2 : f.stops === stopsFilter))
  }
  if (priceFilter) {
    const { min, max } = priceFilter
    list = list.filter((f) => {
      const p = parsePrice(f.price)
      return p >= min && p <= max
    })
  }
  return sortFlights(list, sortKey)
})

const priceLabels: Record<string, { text: string; className: string }> = {
  low: { text: 'Prices are low right now', className: 'low' },
  typical: { text: 'Prices are typical', className: 'typical' },
  high: { text: 'Prices are high right now', className: 'high' },
}

const priceInfo = $derived(priceLabels[result.current_price])

let aiMenuEl: HTMLDetailsElement | undefined
let copied = $state(false)

function getMarkdown() {
  return resultToMarkdown(result, filteredFlights, hasMultipleDates)
}

async function copyAsMarkdown() {
  if (aiMenuEl) aiMenuEl.open = false
  await navigator.clipboard.writeText(getMarkdown())
  copied = true
  setTimeout(() => (copied = false), 2000)
}

function saveAsMarkdown() {
  if (aiMenuEl) aiMenuEl.open = false
  const blob = new Blob([getMarkdown()], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'flights.md'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<div class="results">
  {#if priceInfo}
    <div class="price-banner {priceInfo.className}">
      {priceInfo.text}
    </div>
  {/if}

  {#if result.flights.length === 0}
    <div class="empty">
      <p>No flights found for this route.</p>
      <p class="empty-hint">Try nearby airports or a wider date range.</p>
    </div>
  {:else}
    <PriceGrid
      flights={result.flights}
      onselect={(dep, ret) => (selectedCombo = { dep, ret })}
    />

    <div class="filter-panel">
      <div class="filters">
        <span class="filter-label">Stops</span>
        <button type="button" class="chip" class:active={stopsFilter === null} onclick={() => (stopsFilter = null)}>
          Any ({baseFlights.length})
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

      <PriceFilter flights={baseFlights} bind:value={priceFilter} />
    </div>

    <div class="toolbar">
      <span class="count">
        {filteredFlights.length} flight{filteredFlights.length !== 1 ? 's' : ''}
        {#if selectedCombo}
          <button type="button" class="clear-filter" onclick={() => (selectedCombo = null)}>
            Clear filter
          </button>
        {/if}
      </span>
      <div class="toolbar-right">
        <details class="ai-menu" bind:this={aiMenuEl}>
          <summary class="ai-btn">
            {copied ? '✓ Copied' : '✦ AI tools'}
          </summary>
          <div class="ai-dropdown">
            <button type="button" onclick={copyAsMarkdown}>Copy as markdown</button>
            <button type="button" onclick={saveAsMarkdown}>Save as markdown</button>
          </div>
        </details>
        <div class="sort">
          <label class="sort-label" for="sort">Sort by</label>
          <div class="sort-select-wrap">
            <select id="sort" bind:value={sortKey}>
              <option value="best">Best</option>
              <option value="price">Price</option>
              <option value="duration">Duration</option>
              <option value="stops">Stops</option>
              <option value="departure">Departure</option>
              {#if hasMultipleDates}
                <option value="date">Date</option>
              {/if}
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="list">
      {#each filteredFlights as flight}
        <FlightCard {flight} showDate={hasMultipleDates} />
      {/each}
    </div>
    <a href={result.google_flights_url} target="_blank" rel="noopener noreferrer" class="source-link">
      View on Google Flights
    </a>
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
  .empty-hint {
    font-size: 0.85rem;
    margin-top: 4px;
  }

  /* Filter panel card */
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
    color: #fff;
    font-weight: 500;
  }

  /* Toolbar */
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .count {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.88rem;
    color: var(--color-muted);
    font-weight: 500;
  }
  .clear-filter {
    font-size: 0.8rem;
    color: var(--color-primary);
    background: none;
    border: none;
    text-decoration: underline;
    padding: 0;
  }
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* AI menu */
  .ai-menu {
    position: relative;
  }
  .ai-menu[open] .ai-btn {
    background: var(--color-surface);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  .ai-btn {
    list-style: none;
    padding: 5px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 0.82rem;
    color: var(--color-muted);
    cursor: pointer;
    white-space: nowrap;
    background: var(--color-surface);
    user-select: none;
  }
  .ai-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  .ai-btn::-webkit-details-marker { display: none; }
  .ai-dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    min-width: 170px;
    z-index: 10;
    overflow: hidden;
  }
  .ai-dropdown button {
    padding: 9px 14px;
    text-align: left;
    font-size: 0.85rem;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--color-text);
    white-space: nowrap;
  }
  .ai-dropdown button:hover {
    background: var(--color-bg);
    color: var(--color-primary);
  }

  /* Sort */
  .sort {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .sort-label {
    font-size: 0.8rem;
    color: var(--color-muted);
  }
  .sort-select-wrap {
    position: relative;
  }
  .sort-select-wrap::after {
    content: '▾';
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    font-size: 0.72rem;
    color: var(--color-muted);
  }
  .sort select {
    padding: 5px 28px 5px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 0.85rem;
    background: var(--color-surface);
    font-weight: 500;
    color: var(--color-text);
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }
  .sort select:hover {
    border-color: var(--color-primary);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .source-link {
    display: block;
    text-align: center;
    margin-top: 1rem;
    color: var(--color-muted);
    font-size: 0.85rem;
  }
</style>
