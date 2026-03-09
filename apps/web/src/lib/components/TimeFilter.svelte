<script lang="ts">
import type { Offer } from '$lib/types'

let {
  flights,
  label,
  field,
  value = $bindable(null),
}: {
  flights: Offer[]
  label: string
  field: 'departure' | 'arrival'
  value: { min: number; max: number } | null
} = $props()

const lo = $derived(value?.min ?? 0)
const hi = $derived(value?.max ?? 1440)

function fmtTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function onMinInput(e: Event) {
  const v = Number((e.currentTarget as HTMLInputElement).value)
  const clamped = Math.min(v, hi)
  value = clamped === 0 && hi === 1440 ? null : { min: clamped, max: hi }
}

function onMaxInput(e: Event) {
  const v = Number((e.currentTarget as HTMLInputElement).value)
  const clamped = Math.max(v, lo)
  value = lo === 0 && clamped === 1440 ? null : { min: lo, max: clamped }
}
</script>

<div class="time-filter">
  <span class="filter-label">{label}</span>
  <span class="range-value">{fmtTime(lo)}</span>
  <div class="slider-track">
    <input type="range" min={0} max={1440} step={15} value={lo} oninput={onMinInput} class="thumb thumb-min" />
    <input type="range" min={0} max={1440} step={15} value={hi} oninput={onMaxInput} class="thumb thumb-max" />
    <div class="fill" style="left: {(lo / 1440) * 100}%; right: {((1440 - hi) / 1440) * 100}%"></div>
  </div>
  <span class="range-value">{fmtTime(hi)}</span>
  {#if value}
    <button type="button" class="reset" onclick={() => (value = null)}>&times;</button>
  {/if}
</div>

<style>
  .time-filter {
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
    min-width: 52px;
  }
  .range-value {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--color-muted);
    white-space: nowrap;
    min-width: 40px;
    text-align: center;
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
    cursor: pointer;
  }
  .reset:hover {
    color: var(--color-primary);
  }
</style>
