<script lang="ts">
let {
  adults = $bindable(1),
  children = $bindable(0),
  infants_in_seat = $bindable(0),
  infants_on_lap = $bindable(0),
}: {
  adults: number
  children: number
  infants_in_seat: number
  infants_on_lap: number
} = $props()

let open = $state(false)

const total = $derived(adults + children + infants_in_seat + infants_on_lap)

const summary = $derived.by(() => {
  const parts: string[] = [`${adults} adult${adults !== 1 ? 's' : ''}`]
  if (children > 0) parts.push(`${children} child${children !== 1 ? 'ren' : ''}`)
  if (infants_in_seat > 0) parts.push(`${infants_in_seat} infant seat`)
  if (infants_on_lap > 0) parts.push(`${infants_on_lap} infant lap`)
  return parts.join(', ')
})

type Row = {
  label: string
  sub: string
  get: () => number
  set: (v: number) => void
  min: number
  max: number
}

const rows: Row[] = [
  {
    label: 'Adults',
    sub: '',
    get: () => adults,
    set: (v) => {
      adults = v
    },
    min: 1,
    max: 9,
  },
  {
    label: 'Children',
    sub: '2–11 years',
    get: () => children,
    set: (v) => {
      children = v
    },
    min: 0,
    max: 8,
  },
  {
    label: 'Infants',
    sub: 'In seat',
    get: () => infants_in_seat,
    set: (v) => {
      infants_in_seat = v
    },
    min: 0,
    max: 4,
  },
  {
    label: 'Infants',
    sub: 'On lap',
    get: () => infants_on_lap,
    set: (v) => {
      infants_on_lap = v
    },
    min: 0,
    max: 4,
  },
]

function canIncrement(row: Row): boolean {
  return row.get() < row.max && total < 9
}

function canDecrement(row: Row): boolean {
  return row.get() > row.min
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.passenger-picker')) open = false
}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="passenger-picker">
  <span class="label">Passengers</span>
  <button type="button" class="trigger" onclick={(e) => { e.stopPropagation(); open = !open }}>
    {summary}
  </button>

  {#if open}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="dropdown" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && (open = false)}>
      {#each rows as row}
        <div class="row">
          <div class="row-label">
            <span class="row-name">{row.label}</span>
            {#if row.sub}<span class="row-sub">{row.sub}</span>{/if}
          </div>
          <div class="stepper">
            <button
              type="button"
              class="step-btn"
              disabled={!canDecrement(row)}
              onclick={() => row.set(row.get() - 1)}
            >-</button>
            <span class="step-val">{row.get()}</span>
            <button
              type="button"
              class="step-btn"
              disabled={!canIncrement(row)}
              onclick={() => row.set(row.get() + 1)}
            >+</button>
          </div>
        </div>
      {/each}
      {#if total >= 9}
        <p class="limit-note">Max 9 passengers</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .passenger-picker {
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-muted);
    margin-bottom: 4px;
  }
  .trigger {
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 0.95rem;
    background: var(--color-surface-raised);
    color: var(--color-text);
    text-align: left;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .trigger:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-amber-glow);
  }
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    z-index: 20;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 220px;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 0;
  }
  .row-label {
    display: flex;
    flex-direction: column;
  }
  .row-name {
    font-size: 0.85rem;
    font-weight: 500;
  }
  .row-sub {
    font-size: 0.72rem;
    color: var(--color-muted);
  }
  .stepper {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .step-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 1rem;
    padding: 0;
    cursor: pointer;
    transition: border-color 0.12s, color 0.12s;
  }
  .step-btn:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  .step-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .step-val {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    min-width: 20px;
    text-align: center;
  }
  .limit-note {
    font-size: 0.72rem;
    color: var(--color-muted);
    text-align: center;
    padding-top: 2px;
  }
</style>
