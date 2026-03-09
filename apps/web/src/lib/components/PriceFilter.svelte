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

const lo = $derived(value?.min ?? minPrice)
const hi = $derived(value?.max ?? maxPrice)

function onMinInput(e: Event) {
  const v = Number((e.currentTarget as HTMLInputElement).value)
  const clamped = Math.min(v, hi)
  value = clamped === minPrice && hi === maxPrice ? null : { min: clamped, max: hi }
}

function onMaxInput(e: Event) {
  const v = Number((e.currentTarget as HTMLInputElement).value)
  const clamped = Math.max(v, lo)
  value = lo === minPrice && clamped === maxPrice ? null : { min: lo, max: clamped }
}

function fmt(n: number) {
  return `${currency}${Math.round(n)}`
}
</script>

{#if !allSame && prices.length > 0}
  <div class="price-filter">
    <span class="filter-label">Price</span>
    <span class="range-value">{fmt(lo)}</span>
    <div class="slider-track">
      <input
        type="range"
        min={minPrice}
        max={maxPrice}
        step="1"
        value={lo}
        oninput={onMinInput}
        class="thumb thumb-min"
      />
      <input
        type="range"
        min={minPrice}
        max={maxPrice}
        step="1"
        value={hi}
        oninput={onMaxInput}
        class="thumb thumb-max"
      />
      <div
        class="fill"
        style="left: {((lo - minPrice) / (maxPrice - minPrice)) * 100}%; right: {((maxPrice - hi) / (maxPrice - minPrice)) * 100}%"
      ></div>
    </div>
    <span class="range-value">{fmt(hi)}</span>
    {#if value}
      <button type="button" class="reset" onclick={() => (value = null)} title="Reset">&times;</button>
    {/if}
  </div>
{/if}

<style>
  .price-filter {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .filter-label {
    font-size: 0.72rem;
    color: var(--color-text);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-right: 2px;
    flex-shrink: 0;
  }
  .range-value {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--color-muted);
    white-space: nowrap;
    min-width: 40px;
    text-align: center;
  }

  /* Dual-range track */
  .slider-track {
    position: relative;
    flex: 1;
    height: 20px;
    min-width: 100px;
  }
  .fill {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 3px;
    background: var(--color-primary);
    border-radius: 2px;
    pointer-events: none;
  }

  /* Shared thumb styling */
  .thumb {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    appearance: none;
    -webkit-appearance: none;
    background: none;
    pointer-events: none;
    margin: 0;
  }
  .thumb::-webkit-slider-runnable-track {
    height: 3px;
    background: var(--color-track);
    border-radius: 2px;
  }
  .thumb-max::-webkit-slider-runnable-track {
    background: transparent;
  }
  .thumb::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--color-primary);
    border: 2px solid var(--color-surface);
    cursor: pointer;
    pointer-events: auto;
    margin-top: -5.5px;
    box-shadow: 0 0 4px var(--color-amber-glow);
  }
  .thumb::-moz-range-track {
    height: 3px;
    background: var(--color-track);
    border-radius: 2px;
    border: none;
  }
  .thumb-max::-moz-range-track {
    background: transparent;
  }
  .thumb::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--color-primary);
    border: 2px solid var(--color-surface);
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 0 4px var(--color-amber-glow);
  }

  .reset {
    background: none;
    border: none;
    color: var(--color-muted);
    font-size: 1rem;
    padding: 0 2px;
    line-height: 1;
    flex-shrink: 0;
  }
  .reset:hover {
    color: var(--color-primary);
  }
</style>
