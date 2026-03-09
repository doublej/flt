<script lang="ts">
import type { Offer, SearchResult } from '$lib/types'
import { buildTakeout, resultToMarkdown } from '$lib/utils/markdown'
import { type SortKey, parseDuration, parsePrice, parseTime, sortFlights } from '$lib/utils/sort'
import FilterPanel from './FilterPanel.svelte'
import FlightCard from './FlightCard.svelte'
import PriceGrid from './PriceGrid.svelte'

const {
  result,
  offers,
  onaddleg,
}: { result: SearchResult; offers: Offer[]; onaddleg?: () => void } = $props()

let sortKey: SortKey = $state('best')
let selectedCombo: { dep: string; ret: string | null } | null = $state(null)
let stopsFilter: number | null = $state(null)
let priceFilter: { min: number; max: number } | null = $state(null)
let carrierFilter: Set<string> | null = $state(null)
let depTimeRange: { min: number; max: number } | null = $state(null)
let arrTimeRange: { min: number; max: number } | null = $state(null)
let maxDurFilter: number | null = $state(null)

const hasMultipleDates = $derived(new Set(offers.map((f) => f.departure_date)).size > 1)

const baseOffers = $derived.by(() => {
  let list = offers
  if (selectedCombo) {
    const { dep, ret } = selectedCombo
    list = list.filter(
      (f) =>
        f.departure_date === dep && (ret === null ? f.return_date == null : f.return_date === ret),
    )
  }
  return list
})

const filteredOffers = $derived.by(() => {
  let list = [...baseOffers]
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
  if (carrierFilter) {
    const allowed = carrierFilter
    list = list.filter((f) => f.legs.some((l) => allowed.has(l.airline)))
  }
  if (depTimeRange) {
    const { min, max } = depTimeRange
    list = list.filter((f) => {
      const t = parseTime(f.departure)
      return t >= min && t <= max
    })
  }
  if (arrTimeRange) {
    const { min, max } = arrTimeRange
    list = list.filter((f) => {
      const t = parseTime(f.arrival)
      return t >= min && t <= max
    })
  }
  if (maxDurFilter != null) {
    const maxDur = maxDurFilter
    list = list.filter((f) => parseDuration(f.duration) <= maxDur)
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
  return resultToMarkdown(result, filteredOffers, hasMultipleDates)
}

async function copyAsMarkdown() {
  if (aiMenuEl) aiMenuEl.open = false
  await navigator.clipboard.writeText(getMarkdown())
  copied = true
  setTimeout(() => {
    copied = false
  }, 2000)
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

function exportTakeout() {
  if (aiMenuEl) aiMenuEl.open = false
  const now = new Date()
  const ts = `${now.toISOString().slice(0, 10)}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
  const blob = new Blob([buildTakeout(filteredOffers)], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `flights-${ts}.md`
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

  {#if offers.length === 0}
    <div class="empty">
      <p>No flights found for this route.</p>
      <p class="empty-hint">Try nearby airports or a wider date range.</p>
    </div>
  {:else}
    <PriceGrid
      flights={offers}
      onselect={(dep, ret) => (selectedCombo = { dep, ret })}
    />

    <FilterPanel
      flights={baseOffers}
      bind:stopsFilter
      bind:priceFilter
      bind:carrierFilter
      bind:depTimeRange
      bind:arrTimeRange
      bind:maxDurFilter
    />

    <div class="toolbar">
      <span class="count">
        {filteredOffers.length} flight{filteredOffers.length !== 1 ? 's' : ''}
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
            <button type="button" onclick={exportTakeout}>Export takeout</button>
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
      {#each filteredOffers as offer}
        <FlightCard {offer} showDate={hasMultipleDates} {onaddleg} />
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
    margin-bottom: 1rem;    border: 1px solid;
  }
  .price-banner.low {
    background: rgb(63 185 80 / 0.1);
    border-color: rgb(63 185 80 / 0.3);
    color: var(--color-success);
  }
  .price-banner.typical {
    background: rgb(240 160 48 / 0.1);
    border-color: rgb(240 160 48 / 0.3);
    color: var(--color-primary);
  }
  .price-banner.high {
    background: rgb(248 81 73 / 0.1);
    border-color: rgb(248 81 73 / 0.3);
    color: var(--color-error);
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
    background: var(--color-surface-raised);
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
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
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
    background: var(--color-surface);
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
    background: var(--color-surface-raised);
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
