<script lang="ts">
import { type RecentSearch, loadRecent, removeRecent } from '$lib/recent-searches'

const { onselect }: { onselect: (entry: RecentSearch) => void } = $props()

let entries = $state<RecentSearch[]>([])

$effect(() => {
  entries = loadRecent()
})

export function refresh() {
  entries = loadRecent()
}

function handleRemove(index: number, e: MouseEvent) {
  e.stopPropagation()
  removeRecent(index)
  entries = loadRecent()
}

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
</script>

{#if entries.length > 0}
  <div class="recent">
    <span class="recent-label">Recent</span>
    <div class="chips">
      {#each entries as entry, i}
        <div class="chip" role="button" tabindex="0" onclick={() => onselect(entry)} onkeydown={(e) => { if (e.key === 'Enter') onselect(entry) }}>
          <span class="route">
            {entry.params.from_airport} &rarr; {entry.params.to_airport}
          </span>
          <span class="date">{formatDate(entry.params.date)}</span>
          {#if entry.params.return_date}
            <span class="trip-type" title="Round-trip">&olarr;</span>
          {/if}
          <button
            class="remove"
            type="button"
            title="Remove"
            onmousedown={(e) => handleRemove(i, e)}
          >&times;</button>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .recent {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-top: 0.75rem;
  }
  .recent-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted);
    white-space: nowrap;
    padding-top: 5px;
  }
  .chips {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    flex-wrap: wrap;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 100px;
    font-size: 0.8rem;
    color: var(--color-text);
    white-space: nowrap;
    transition: background 0.15s, border-color 0.15s;
  }
  .chip:hover {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;
  }
  .chip:hover .date,
  .chip:hover .trip-type {
    color: rgb(255 255 255 / 0.8);
  }
  .chip:hover .remove {
    color: rgb(255 255 255 / 0.7);
  }
  .chip:hover .remove:hover {
    color: #fff;
  }
  .route {
    font-weight: 600;
  }
  .date {
    color: var(--color-muted);
    font-size: 0.75rem;
  }
  .trip-type {
    color: var(--color-muted);
    font-size: 0.75rem;
  }
  .remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    background: none;
    color: var(--color-muted);
    font-size: 0.85rem;
    line-height: 1;
    border-radius: 50%;
    cursor: pointer;
  }
  .remove:hover {
    color: var(--color-error);
  }

  @media (max-width: 540px) {
    .chips {
      flex-wrap: nowrap;
    }
  }
</style>
