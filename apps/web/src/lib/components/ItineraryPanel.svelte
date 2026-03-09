<script lang="ts">
import {
  type StoredItinerary,
  createItinerary,
  deleteItinerary,
  getActive,
  getActiveId,
  listItineraries,
  removeLeg,
  renameItinerary,
  setActiveId,
} from '$lib/itinerary-store'
import { checkConnections, formatTotal, totalTravelTime } from '@flights/core/itinerary'
import { onMount } from 'svelte'
import BookingLinks from './BookingLinks.svelte'

let expanded = $state(false)
let itineraries = $state<StoredItinerary[]>([])
let active = $state<StoredItinerary | null>(null)
let editingName = $state(false)
let nameInput = $state('')

export function refresh() {
  itineraries = listItineraries()
  active = getActive()
}

onMount(refresh)

const warnings = $derived(active?.legs.length ? checkConnections(active.legs) : [])
const total = $derived(active?.legs.length ? formatTotal(active.legs) : null)
const travelTime = $derived(active?.legs.length ? totalTravelTime(active.legs) : null)

function handleNew() {
  const it = createItinerary(`Trip ${itineraries.length + 1}`)
  refresh()
  expanded = true
}

function handleSwitch(id: string) {
  setActiveId(id)
  refresh()
}

function handleDelete(id: string) {
  deleteItinerary(id)
  refresh()
}

function handleRemoveLeg(index: number) {
  if (!active) return
  removeLeg(active.id, index)
  refresh()
}

function startRename() {
  if (!active) return
  nameInput = active.name
  editingName = true
}

function finishRename() {
  if (!active) return
  renameItinerary(active.id, nameInput.trim() || active.name)
  editingName = false
  refresh()
}
</script>

{#if itineraries.length > 0 || active}
  <div class="panel" class:expanded>
    <button type="button" class="bar" onclick={() => (expanded = !expanded)}>
      <span class="bar-text">
        {#if active}
          {active.name}: {active.legs.length} leg{active.legs.length !== 1 ? 's' : ''}
          {#if total} · {total}{/if}
        {:else}
          No active itinerary
        {/if}
      </span>
      <span class="bar-chevron" class:open={expanded}>&#9662;</span>
    </button>

    {#if expanded}
      <div class="body">
        <div class="header">
          {#if editingName}
            <input
              class="name-input"
              bind:value={nameInput}
              onblur={finishRename}
              onkeydown={(e) => e.key === 'Enter' && finishRename()}
            />
          {:else if active}
            <button type="button" class="name-btn" onclick={startRename}>{active.name}</button>
          {/if}
          <div class="header-actions">
            {#if itineraries.length > 1}
              <select class="itin-select" value={getActiveId() ?? ''} onchange={(e) => handleSwitch((e.currentTarget as HTMLSelectElement).value)}>
                {#each itineraries as it}
                  <option value={it.id}>{it.name}</option>
                {/each}
              </select>
            {/if}
            <button type="button" class="action-btn" onclick={handleNew}>+ New</button>
            {#if active}
              <button type="button" class="action-btn danger" onclick={() => handleDelete(active!.id)}>Delete</button>
            {/if}
          </div>
        </div>

        {#if active && active.legs.length > 0}
          <div class="legs">
            {#each active.legs as leg, i}
              <div class="leg-row">
                <span class="leg-num">{i + 1}</span>
                <div class="leg-info">
                  <span class="leg-route">{leg.departure_date} · {leg.name} · {leg.departure}→{leg.arrival}</span>
                  <span class="leg-meta">{leg.duration} · {leg.stops === 0 ? 'Nonstop' : `${leg.stops} stop${leg.stops > 1 ? 's' : ''}`} · {leg.price}</span>
                  <BookingLinks offer={leg} size="small" />
                </div>
                <button type="button" class="remove-btn" onclick={() => handleRemoveLeg(i)} title="Remove leg">&times;</button>
              </div>
            {/each}
          </div>

          {#if warnings.length > 0}
            <div class="warnings">
              {#each warnings as w}
                <p class="warning">{w}</p>
              {/each}
            </div>
          {/if}

          <div class="totals">
            {#if total}<span>Total: {total}</span>{/if}
            {#if travelTime}<span>Door-to-door: {travelTime}</span>{/if}
          </div>
        {:else if active}
          <p class="empty">Add flights from search results using the + button</p>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .panel {
    position: sticky;
    bottom: 0;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    box-shadow: 0 -4px 20px rgb(0 0 0 / 0.4);
    z-index: 30;
    margin-top: 1.5rem;
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 16px;
    background: none;
    border: none;
    color: var(--color-text);
    font-size: 0.88rem;
    font-weight: 500;
    cursor: pointer;
  }
  .bar-chevron {
    font-size: 0.7rem;
    color: var(--color-muted);
    transition: transform 0.2s;
  }
  .bar-chevron.open {
    transform: rotate(180deg);
  }
  .body {
    padding: 0 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .header-actions {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .name-btn {
    background: none;
    border: none;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-primary);
    padding: 0;
    cursor: pointer;
  }
  .name-input {
    font-size: 0.9rem;
    font-weight: 600;
    padding: 2px 6px;
    border: 1px solid var(--color-primary);
    border-radius: 4px;
    background: var(--color-surface-raised);
    color: var(--color-text);
  }
  .itin-select {
    padding: 4px 8px;
    font-size: 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-surface-raised);
    color: var(--color-text);
  }
  .action-btn {
    padding: 4px 10px;
    font-size: 0.78rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: none;
    color: var(--color-muted);
    cursor: pointer;
    white-space: nowrap;
  }
  .action-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  .action-btn.danger:hover {
    border-color: var(--color-error);
    color: var(--color-error);
  }
  .legs {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .leg-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 6px 8px;
    background: var(--color-bg);
    border-radius: var(--radius);
  }
  .leg-num {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-muted);
    min-width: 18px;
    padding-top: 2px;
  }
  .leg-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .leg-route {
    font-size: 0.82rem;
    font-weight: 500;
  }
  .leg-meta {
    font-size: 0.75rem;
    color: var(--color-muted);
  }
  .remove-btn {
    background: none;
    border: none;
    color: var(--color-muted);
    font-size: 1rem;
    padding: 0 2px;
    line-height: 1;
    cursor: pointer;
    flex-shrink: 0;
  }
  .remove-btn:hover {
    color: var(--color-error);
  }
  .warnings {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .warning {
    font-size: 0.78rem;
    color: var(--color-primary);
    padding: 4px 8px;
    background: rgb(240 160 48 / 0.08);
    border-radius: 4px;
  }
  .totals {
    display: flex;
    gap: 16px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-primary);
  }
  .empty {
    font-size: 0.82rem;
    color: var(--color-muted);
    text-align: center;
    padding: 8px 0;
  }
</style>
