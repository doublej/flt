<script lang="ts">
import { searchAirports } from '$lib/api'
import type { Airport } from '$lib/types'

let {
  label,
  value = $bindable(''),
  displayValue = $bindable(''),
  placeholder = 'Search airport...',
}: { label: string; value: string; displayValue?: string; placeholder?: string } = $props()

let query = $state('')
let suggestions = $state<Airport[]>([])
let open = $state(false)
let highlighted = $state(-1)
let searching = $state(false)
let timer: ReturnType<typeof setTimeout> | null = null
const listboxId = $derived(`airport-listbox-${label.toLowerCase().replace(/\s+/g, '-')}`)

$effect(() => {
  displayValue = query
})

function handleInput(e: Event) {
  const input = e.target as HTMLInputElement
  query = input.value
  value = ''
  highlighted = -1
  if (query.length >= 2) searching = true
  debounceSearch(query)
}

function debounceSearch(q: string) {
  if (timer) clearTimeout(timer)
  if (q.length < 2) {
    suggestions = []
    searching = false
    return
  }
  timer = setTimeout(async () => {
    suggestions = await searchAirports(q)
    open = suggestions.length > 0
    highlighted = -1
    searching = false
  }, 300)
}

function select(airport: Airport) {
  value = airport.code
  query = `${airport.name} (${airport.code})`
  open = false
  suggestions = []
  highlighted = -1
}

function handleKeydown(e: KeyboardEvent) {
  if (!open || suggestions.length === 0) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlighted = (highlighted + 1) % suggestions.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlighted = highlighted <= 0 ? suggestions.length - 1 : highlighted - 1
  } else if (e.key === 'Enter' && highlighted >= 0) {
    e.preventDefault()
    select(suggestions[highlighted])
  } else if (e.key === 'Escape') {
    open = false
    highlighted = -1
  }
}

function handleBlur() {
  setTimeout(() => {
    open = false
    highlighted = -1
  }, 150)
}

export function fill(code: string, name: string) {
  value = code
  query = name
}
</script>

<div class="airport-input">
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label class="label">
    {label}
    <div class="input-wrap">
      <input
        type="text"
        {placeholder}
        value={query}
        oninput={handleInput}
        onkeydown={handleKeydown}
        onfocus={() => {
          if (suggestions.length > 0) open = true
        }}
        onblur={handleBlur}
        autocomplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={highlighted >= 0 ? `${listboxId}-opt-${highlighted}` : undefined}
      />
      {#if searching}
        <span class="searching-indicator" aria-hidden="true"></span>
      {/if}
    </div>
  </label>
  {#if open}
    <ul id={listboxId} class="dropdown" role="listbox">
      {#each suggestions as airport, i}
        <li
          id="{listboxId}-opt-{i}"
          role="option"
          aria-selected={i === highlighted}
        >
          <button type="button" class:highlighted={i === highlighted} onmousedown={() => select(airport)}>
            <span class="code">{airport.code}</span>
            <span class="details">
              <span class="name">{airport.name}</span>
              <span class="city">{airport.city}, {airport.country}</span>
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .airport-input {
    position: relative;
  }
  .label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-muted);
    margin-bottom: 4px;
  }
  .input-wrap {
    position: relative;
  }
  input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 0.95rem;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }
  input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgb(26 115 232 / 0.15);
  }
  .searching-indicator {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 14px;
    height: 14px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    pointer-events: none;
  }
  @keyframes spin {
    to { transform: translateY(-50%) rotate(360deg); }
  }
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    list-style: none;
    max-height: 240px;
    overflow-y: auto;
    z-index: 10;
    margin-top: 4px;
  }
  .dropdown button {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border: none;
    background: none;
    text-align: left;
    font-size: 0.9rem;
  }
  .dropdown button:hover,
  .dropdown button.highlighted {
    background: var(--color-bg);
  }
  .code {
    font-weight: 700;
    color: var(--color-primary);
    min-width: 36px;
  }
  .details {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .name {
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .city {
    font-size: 0.78rem;
    color: var(--color-muted);
  }
</style>
