<script lang="ts">
import type { Offer } from '$lib/types'

let { flights, value = $bindable(null) }: { flights: Offer[]; value: Set<string> | null } = $props()

const airlines = $derived.by(() => {
  const map = new Map<string, string>()
  for (const f of flights) {
    for (const l of f.legs) {
      if (!map.has(l.airline)) map.set(l.airline, l.airline_name)
    }
  }
  return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
})

const logoUrl = (code: string) => `https://www.gstatic.com/flights/airline_logos/70px/${code}.png`

function toggle(code: string) {
  if (!value) {
    const all = new Set(airlines.map(([c]) => c))
    all.delete(code)
    value = all
    return
  }
  const next = new Set(value)
  if (next.has(code)) next.delete(code)
  else next.add(code)
  value = next.size === airlines.length ? null : next
}

function hideBrokenImg(e: Event) {
  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
}
</script>

{#if airlines.length > 1}
  <div class="airline-filter">
    <span class="filter-label">Airlines</span>
    <div class="chips">
      {#each airlines as [code, name]}
        <button
          type="button"
          class="chip"
          class:active={!value || value.has(code)}
          onclick={() => toggle(code)}
        >
          <img class="logo" src={logoUrl(code)} alt="" onerror={hideBrokenImg} />
          {name}
        </button>
      {/each}
    </div>
    {#if value}
      <button type="button" class="reset" onclick={() => (value = null)}>&times;</button>
    {/if}
  </div>
{/if}

<style>
  .airline-filter {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .filter-label {
    font-size: 0.72rem;
    color: var(--color-text);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
  }
  .chips {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: 1px solid var(--color-border);
    border-radius: 16px;
    font-size: 0.78rem;
    background: var(--color-surface);
    color: var(--color-muted);
    cursor: pointer;
    white-space: nowrap;
    transition: border-color 0.12s, color 0.12s, opacity 0.12s;
  }
  .chip:not(.active) {
    opacity: 0.45;
  }
  .chip:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    opacity: 1;
  }
  .chip.active {
    color: var(--color-text);
    border-color: var(--color-border);
  }
  .logo {
    width: 16px;
    height: 16px;
    object-fit: contain;
    border-radius: 2px;
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
