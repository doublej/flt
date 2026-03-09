<script lang="ts">
import { loadPreferences, savePreferences } from '$lib/preferences'
import type { RecentSearch } from '$lib/recent-searches'
import { saveRecent } from '$lib/recent-searches'
import type { SearchParams } from '$lib/types'
import { dateDiff, flexRange } from '$lib/utils/dates'
import { onMount } from 'svelte'
// biome-ignore lint/style/useImportType: Svelte component used in template
import AirportInput from './AirportInput.svelte'
import DateFlexInput from './DateFlexInput.svelte'
import PassengerPicker from './PassengerPicker.svelte'

const {
  onsearch,
  showCachedButton = false,
}: { onsearch: (params: SearchParams) => void; showCachedButton?: boolean } = $props()

let tripType: 'one-way' | 'round-trip' = $state('round-trip')
let fromAirport = $state('')
let toAirport = $state('')
let fromDisplay = $state('')
let toDisplay = $state('')
let date = $state('')
let returnDate = $state('')
let depDaysBefore = $state(0)
let depDaysAfter = $state(0)
let retDaysBefore = $state(0)
let retDaysAfter = $state(0)
let adults = $state(1)
let children = $state(0)
let infants_in_seat = $state(0)
let infants_on_lap = $state(0)
let seat: 'economy' | 'premium-economy' | 'business' | 'first' = $state('economy')
let currency = $state('EUR')

let fromInput: ReturnType<typeof AirportInput> | undefined
let toInput: ReturnType<typeof AirportInput> | undefined

function setTripType(type: typeof tripType) {
  tripType = type
  if (type === 'one-way') {
    returnDate = ''
    retDaysBefore = 0
    retDaysAfter = 0
  }
}

function swapAirports() {
  const fromCode = fromAirport
  const fromName = fromDisplay
  fromInput?.fill(toAirport, toDisplay)
  toInput?.fill(fromCode, fromName)
}
function clearForm() {
  fromInput?.fill('', '')
  toInput?.fill('', '')
  date = ''
  returnDate = ''
  depDaysBefore = 0
  depDaysAfter = 0
  retDaysBefore = 0
  retDaysAfter = 0
}

function submitSearch() {
  if (!fromAirport || !toAirport || !date) return

  const dep = flexRange(date, depDaysBefore, depDaysAfter)
  const params: SearchParams = {
    from_airport: fromAirport,
    to_airport: toAirport,
    date: dep.start,
    date_end: dep.end,
    adults,
    children: children || undefined,
    infants_in_seat: infants_in_seat || undefined,
    infants_on_lap: infants_on_lap || undefined,
    seat,
    currency,
  }

  if (returnDate) {
    const ret = flexRange(returnDate, retDaysBefore, retDaysAfter)
    params.return_date = ret.start
    params.return_date_end = ret.end
  }

  saveRecent({ params, fromName: fromDisplay, toName: toDisplay, timestamp: Date.now() })
  onsearch(params)
}

function handleSubmit(e: SubmitEvent) {
  e.preventDefault()
  submitSearch()
}

function handleFormKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    submitSearch()
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: sequential assignments with defaults
export function fillFrom(entry: RecentSearch) {
  fromInput?.fill(entry.params.from_airport, entry.fromName)
  toInput?.fill(entry.params.to_airport, entry.toName)
  fromAirport = entry.params.from_airport
  toAirport = entry.params.to_airport

  date = entry.params.date
  depDaysBefore = 0
  depDaysAfter = entry.params.date_end ? dateDiff(entry.params.date, entry.params.date_end) : 0

  returnDate = entry.params.return_date ?? ''
  retDaysBefore = 0
  retDaysAfter =
    entry.params.return_date_end && returnDate
      ? dateDiff(returnDate, entry.params.return_date_end)
      : 0

  tripType = returnDate ? 'round-trip' : 'one-way'
  adults = entry.params.adults ?? 1
  children = entry.params.children ?? 0
  infants_in_seat = entry.params.infants_in_seat ?? 0
  infants_on_lap = entry.params.infants_on_lap ?? 0
  seat = entry.params.seat ?? 'economy'
  currency = entry.params.currency ?? 'EUR'
}

onMount(() => {
  const prefs = loadPreferences()
  adults = prefs.adults
  children = prefs.children
  infants_in_seat = prefs.infants_in_seat
  infants_on_lap = prefs.infants_on_lap
  seat = prefs.seat
  currency = prefs.currency
})

$effect(() => {
  savePreferences({ adults, children, infants_in_seat, infants_on_lap, seat, currency })
})

const today = new Date().toISOString().slice(0, 10)
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<form class="search-form" onsubmit={handleSubmit} onkeydown={handleFormKeydown}>
  <div class="trip-toggle">
    <button
      type="button"
      class="toggle-btn"
      class:active={tripType === 'one-way'}
      onclick={() => setTripType('one-way')}
    >One-way</button>
    <button
      type="button"
      class="toggle-btn"
      class:active={tripType === 'round-trip'}
      onclick={() => setTripType('round-trip')}
    >Round-trip</button>
  </div>

  <div class="row airports">
    <AirportInput bind:this={fromInput} label="From" bind:value={fromAirport} bind:displayValue={fromDisplay} placeholder="Departure airport" />
    <button type="button" class="swap-btn" onclick={swapAirports} title="Swap airports" aria-label="Swap airports">⇄</button>
    <AirportInput bind:this={toInput} label="To" bind:value={toAirport} bind:displayValue={toDisplay} placeholder="Arrival airport" />
  </div>

  <div class="row dates" class:dates-single={tripType === 'one-way'}>
    <DateFlexInput
      id="date"
      label="Departure"
      bind:value={date}
      bind:daysBefore={depDaysBefore}
      bind:daysAfter={depDaysAfter}
      min={today}
      required
    />
    {#if tripType === 'round-trip'}
      <DateFlexInput
        id="return-date"
        label="Return"
        bind:value={returnDate}
        bind:daysBefore={retDaysBefore}
        bind:daysAfter={retDaysAfter}
        min={date || today}
      />
    {/if}
  </div>

  <div class="row options-3">
    <PassengerPicker bind:adults bind:children bind:infants_in_seat bind:infants_on_lap />
    <div class="field">
      <label class="label" for="seat">Class</label>
      <select id="seat" bind:value={seat}>
        <option value="economy">Economy</option>
        <option value="premium-economy">Premium Economy</option>
        <option value="business">Business</option>
        <option value="first">First</option>
      </select>
    </div>
    <div class="field">
      <label class="label" for="currency">Currency</label>
      <select id="currency" bind:value={currency}>
        {#each ['EUR', 'USD', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'JPY', 'AUD', 'CAD'] as c}
          <option value={c}>{c}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="form-actions">
    <button type="button" class="clear-btn" onclick={clearForm}>Clear</button>
    {#if showCachedButton}
      <button type="button" class="cached-btn" onclick={submitSearch} disabled={!fromAirport || !toAirport || !date}>
        Show cached results
      </button>
    {/if}
    <button type="submit" class="submit" disabled={!fromAirport || !toAirport || !date}>
      Search Flights
    </button>
  </div>
</form>

<style>
  .search-form {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: 2rem;
    display: flex;
    flex-direction: column;    gap: 1.25rem;
  }
  .trip-toggle {
    display: flex;
    gap: 2px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 100px;
    padding: 3px;
    width: fit-content;
  }
  .toggle-btn {
    padding: 5px 16px;
    border: none;
    background: transparent;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-muted);
    cursor: pointer;
    transition: background 0.15s, color 0.15s, box-shadow 0.15s;
    border-radius: 100px;
  }
  .toggle-btn.active {
    background: var(--color-primary);
    color: var(--color-bg);
    box-shadow: 0 1px 4px rgb(0 0 0 / 0.3);
  }
  .row {
    display: grid;
    gap: 1rem;
  }
  .airports {
    grid-template-columns: 1fr auto 1fr;
  }
  .dates {
    grid-template-columns: 1fr 1fr;
  }
  .dates-single {
    grid-template-columns: 1fr;
  }
  .options-3 {
    grid-template-columns: 1fr 1fr 1fr;
  }
  .field {
    display: flex;
    flex-direction: column;
  }
  .label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-muted);
    margin-bottom: 4px;
  }
  select {
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 0.95rem;
    background: var(--color-surface-raised);
    color: var(--color-text);
  }
  select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-amber-glow);
  }
  .swap-btn {
    align-self: end;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    background: var(--color-surface);
    color: var(--color-muted);
    font-size: 1rem;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: all 0.15s;
  }
  .form-actions {
    display: flex;
    gap: 8px;
  }
  .clear-btn {
    padding: 12px 16px;
    background: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    color: var(--color-muted);
    font-size: 0.9rem;
    cursor: pointer;
    white-space: nowrap;
  }
  .cached-btn {
    padding: 12px 16px;
    background: none;
    border: 1px solid var(--color-primary);
    border-radius: var(--radius);
    color: var(--color-primary);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;
  }
  .cached-btn:hover:not(:disabled) {
    background: var(--color-primary);
    color: var(--color-bg);
  }
  .submit {
    flex: 1;
    padding: 12px;
    background: var(--color-primary);
    color: var(--color-bg);
    border: none;
    border-radius: var(--radius);
    font-size: 1rem;
    font-weight: 600;
    transition: background 0.15s, box-shadow 0.15s;
    cursor: pointer;
    box-shadow: 0 2px 8px var(--color-amber-glow);
  }
  .submit:hover:not(:disabled) {
    background: var(--color-primary-hover);
    box-shadow: 0 3px 12px var(--color-amber-glow);
  }
  .submit:disabled, .cached-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }
  .swap-btn:hover, .clear-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  .swap-btn:hover {
    background: rgb(240 160 48 / 0.06);
  }
  @media (max-width: 540px) {
    .airports {
      grid-template-columns: 1fr;
    }
    .airports .swap-btn {
      display: none;
    }
    .dates,
    .options-3 {
      grid-template-columns: 1fr;
    }
  }
</style>
