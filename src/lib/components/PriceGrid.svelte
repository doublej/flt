<script lang="ts">
import type { Flight } from '$lib/types'
import { formatDateShort } from '$lib/utils/dates'
import { parsePrice } from '$lib/utils/sort'

const {
  flights,
  onselect,
}: { flights: Flight[]; onselect?: (dep: string, ret: string | null) => void } = $props()

const departureDates = $derived([...new Set(flights.map((f) => f.departure_date))].sort())
const returnDates = $derived(
  [...new Set(flights.map((f) => f.return_date).filter((d): d is string => d != null))].sort(),
)
const isOneWay = $derived(returnDates.length === 0)

type CellData = { price: number; label: string }
const priceMap = $derived.by(() => {
  const map = new Map<string, CellData>()
  for (const f of flights) {
    if (!f.return_date) continue
    const key = `${f.departure_date}|${f.return_date}`
    const price = parsePrice(f.price)
    const existing = map.get(key)
    if (!existing || price < existing.price) {
      map.set(key, { price, label: f.price })
    }
  }
  return map
})

const oneWayPriceMap = $derived.by(() => {
  const map = new Map<string, CellData>()
  for (const f of flights) {
    if (f.return_date) continue
    const price = parsePrice(f.price)
    const existing = map.get(f.departure_date)
    if (!existing || price < existing.price) {
      map.set(f.departure_date, { price, label: f.price })
    }
  }
  return map
})

const priceRange = $derived.by(() => {
  const source = isOneWay ? oneWayPriceMap : priceMap
  let min = Number.MAX_SAFE_INTEGER
  let max = 0
  for (const { price } of source.values()) {
    if (price < min) min = price
    if (price > max) max = price
  }
  return { min, max }
})

function cellColor(price: number): string {
  const { min, max } = priceRange
  if (min === max) return '#1a3a2a'
  const t = (price - min) / (max - min)
  if (t <= 0.5) return lerpColor('#1a3a2a', '#2a2a1a', t * 2)
  return lerpColor('#2a2a1a', '#3a1a1a', (t - 0.5) * 2)
}

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const bl = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

let hoveredDep: string | null = $state(null)
</script>

<div class="grid-wrapper">
	{#if isOneWay}
		<div class="grid" style="grid-template-columns: repeat({departureDates.length}, 1fr);">
			{#each departureDates as dep}
				{@const data = oneWayPriceMap.get(dep)}
				{#if data}
					<button
						type="button"
						class="cell data"
						style="background: {cellColor(data.price)}"
						onclick={() => onselect?.(dep, null)}
					>
						<span class="oneway-date">{formatDateShort(dep)}</span>
						{data.label}
					</button>
				{:else}
					<div class="cell data empty">
						<span class="oneway-date">{formatDateShort(dep)}</span>
						&ndash;
					</div>
				{/if}
			{/each}
		</div>
	{:else}
		<div class="grid" style="grid-template-columns: auto repeat({departureDates.length}, 1fr);">
			<!-- Corner cell -->
			<div class="cell header corner"></div>

			<!-- Column headers (departure dates) -->
			{#each departureDates as dep}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="cell header col-header"
					class:hovered={hoveredDep === dep}
					onmouseenter={() => (hoveredDep = dep)}
					onmouseleave={() => (hoveredDep = null)}
				>
					{formatDateShort(dep)}
				</div>
			{/each}

			<!-- Rows -->
			{#each returnDates as ret}
				<!-- Row header (return date) -->
				<div class="cell header row-header">{formatDateShort(ret)}</div>

				<!-- Data cells -->
				{#each departureDates as dep}
					{@const data = priceMap.get(`${dep}|${ret}`)}
					{#if data}
						<button
							type="button"
							class="cell data"
							class:dimmed={hoveredDep != null && hoveredDep !== dep}
							style="background: {cellColor(data.price)}"
							onmouseenter={() => (hoveredDep = dep)}
							onmouseleave={() => (hoveredDep = null)}
							onclick={() => onselect?.(dep, ret)}
						>
							{data.label}
						</button>
					{:else}
						<div
							class="cell data empty"
							class:dimmed={hoveredDep != null && hoveredDep !== dep}
						>
							&ndash;
						</div>
					{/if}
				{/each}
			{/each}
		</div>
	{/if}
</div>

<style>
	.grid-wrapper {
		overflow-x: auto;
		margin-bottom: 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: 6px;
	}
	.grid {
		display: grid;
		gap: 3px;
		min-width: fit-content;
	}
	.cell {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px 12px;
		font-size: 0.82rem;
		white-space: nowrap;
		transition: opacity 0.15s;
	}
	.header {
		font-weight: 600;
		color: var(--color-muted);
		font-size: 0.75rem;
	}
	.col-header {
		cursor: default;
	}
	.col-header.hovered {
		color: var(--color-primary);
	}
	.row-header {
		justify-content: flex-end;
		padding-right: 10px;
	}
	.data {
		border-radius: 5px;
		font-weight: 600;
		min-height: 50px;
		flex-direction: column;
		color: var(--color-text);
	}
	button.data {
		border: 2px solid transparent;
		cursor: pointer;
		font: inherit;
		font-weight: 600;
		font-size: 0.82rem;
	}
	button.data:hover {
		border-color: var(--color-primary);
	}
	.empty {
		background: var(--color-surface-raised);
		color: var(--color-muted);
	}
	.dimmed {
		opacity: 0.35;
	}
	.oneway-date {
		display: block;
		font-size: 0.65rem;
		color: var(--color-muted);
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		margin-bottom: 3px;
	}
	button.data .oneway-date {
		color: inherit;
		opacity: 0.6;
	}
</style>
