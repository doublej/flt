<script lang="ts">
import type { Offer } from '$lib/types'
import { parseDuration } from '$lib/utils/sort'

let { flights, value = $bindable(null) }: { flights: Offer[]; value: number | null } = $props()

const durations = $derived(flights.map((f) => parseDuration(f.duration)).filter((d) => d > 0))
const maxDuration = $derived(Math.max(...durations, 60))
const allSame = $derived(new Set(durations).size <= 1)

const current = $derived(value ?? maxDuration)

function fmtDur(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h}h ${m}m`
  return h ? `${h}h` : `${m}m`
}

function onInput(e: Event) {
  const v = Number((e.currentTarget as HTMLInputElement).value)
  value = v >= maxDuration ? null : v
}
</script>

{#if !allSame && durations.length > 0}
  <div class="duration-filter">
    <span class="filter-label">Max duration</span>
    <div class="slider-track">
      <input type="range" min={0} max={maxDuration} step={15} value={current} oninput={onInput} class="thumb" />
      <div class="fill" style="width: {(current / maxDuration) * 100}%"></div>
    </div>
    <span class="range-value">{fmtDur(current)}</span>
    {#if value != null}
      <button type="button" class="reset" onclick={() => (value = null)}>&times;</button>
    {/if}
  </div>
{/if}

<style>
  .duration-filter {
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
    flex-shrink: 0;
  }
  .range-value {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--color-muted);
    white-space: nowrap;
    min-width: 50px;
  }
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
    cursor: pointer;
  }
  .reset:hover {
    color: var(--color-primary);
  }
</style>
