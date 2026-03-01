<script lang="ts">
import type { Flight } from '$lib/types'
import { parsePrice } from '$lib/utils/sort'

let {
  flights,
  value = $bindable(null),
}: { flights: Flight[]; value: { min: number; max: number } | null } = $props()

const prices = $derived(
  flights.map((f) => parsePrice(f.price)).filter((p) => p < Number.MAX_SAFE_INTEGER),
)
const minPrice = $derived(Math.min(...prices))
const maxPrice = $derived(Math.max(...prices))
const allSame = $derived(minPrice === maxPrice)

const currency = $derived(flights[0]?.price.match(/^[^0-9]*/)?.[0] ?? '')

type Bucket = { label: string; min: number; max: number; count: number }
const buckets = $derived.by(() => {
  const width = (maxPrice - minPrice) / 3
  const ranges: [number, number][] = [
    [minPrice, minPrice + width],
    [minPrice + width, minPrice + width * 2],
    [minPrice + width * 2, maxPrice],
  ]
  return ranges
    .map(([lo, hi], i): Bucket => {
      const count = prices.filter((p) => (i < 2 ? p >= lo && p < hi : p >= lo && p <= hi)).length
      const label =
        i === 0
          ? `< ${currency}${Math.round(lo + width)}`
          : i === 1
            ? `${currency}${Math.round(lo)} – ${currency}${Math.round(hi)}`
            : `> ${currency}${Math.round(lo)}`
      return { label, min: lo, max: hi, count }
    })
    .filter((b) => b.count > 0)
})

function isActive(b: Bucket) {
  return value?.min === b.min && value?.max === b.max
}

function toggle(b: Bucket) {
  value = isActive(b) ? null : { min: b.min, max: b.max }
}
</script>

{#if !allSame && prices.length > 0}
  <div class="filters">
    <span class="filter-label">Price</span>
    <button type="button" class="chip" class:active={value === null} onclick={() => (value = null)}>
      Any ({prices.length})
    </button>
    {#each buckets as b}
      <button type="button" class="chip" class:active={isActive(b)} onclick={() => toggle(b)}>
        {b.label} ({b.count})
      </button>
    {/each}
  </div>
{/if}

<style>
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
</style>
