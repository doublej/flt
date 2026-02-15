<script lang="ts">
import type { RecentSearch } from '$lib/recent-searches'
import { saveRecent } from '$lib/recent-searches'
import type { SearchParams } from '$lib/types'
// biome-ignore lint/style/useImportType: Svelte component used in template
import AirportInput from './AirportInput.svelte'

const { onsearch }: { onsearch: (params: SearchParams) => void } = $props()

let tripType: 'one-way' | 'round-trip' = $state('round-trip')
let fromAirport = $state('')
let toAirport = $state('')
let fromDisplay = $state('')
let toDisplay = $state('')
let date = $state('')
let returnDate = $state('')
let adults = $state(1)
let seat = $state('economy')
let currency = $state('EUR')

let fromInput: ReturnType<typeof AirportInput> | undefined
let toInput: ReturnType<typeof AirportInput> | undefined

function setTripType(type: typeof tripType) {
  tripType = type
  if (type === 'one-way') returnDate = ''
}

function handleSubmit(e: SubmitEvent) {
  e.preventDefault()
  if (!fromAirport || !toAirport || !date) return

  const params: SearchParams = {
    from_airport: fromAirport,
    to_airport: toAirport,
    date,
    adults,
    seat,
    currency,
  }
  if (returnDate) params.return_date = returnDate

  saveRecent({
    params,
    fromName: fromDisplay,
    toName: toDisplay,
    timestamp: Date.now(),
  })

  onsearch(params)
}

export function fillFrom(entry: RecentSearch) {
  fromInput?.fill(entry.params.from_airport, entry.fromName)
  toInput?.fill(entry.params.to_airport, entry.toName)
  fromAirport = entry.params.from_airport
  toAirport = entry.params.to_airport
  date = entry.params.date
  returnDate = entry.params.return_date ?? ''
  tripType = returnDate ? 'round-trip' : 'one-way'
  adults = entry.params.adults ?? 1
  seat = entry.params.seat ?? 'economy'
  currency = entry.params.currency ?? 'EUR'
}

const today = new Date().toISOString().slice(0, 10)
</script>

<form class="search-form" onsubmit={handleSubmit}>
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
    <AirportInput bind:this={toInput} label="To" bind:value={toAirport} bind:displayValue={toDisplay} placeholder="Arrival airport" />
  </div>

  <div class="row dates" class:dates-single={tripType === 'one-way'}>
    <div class="field">
      <label class="label" for="date">Departure</label>
      <input id="date" type="date" bind:value={date} min={today} required />
    </div>
    {#if tripType === 'round-trip'}
      <div class="field">
        <label class="label" for="return-date">Return</label>
        <input id="return-date" type="date" bind:value={returnDate} min={date || today} />
      </div>
    {/if}
  </div>

  <div class="row options-3">
    <div class="field">
      <label class="label" for="adults">Passengers</label>
      <select id="adults" bind:value={adults}>
        {#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as n}
          <option value={n}>{n} {n === 1 ? 'adult' : 'adults'}</option>
        {/each}
      </select>
    </div>
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
        <option value="EUR">EUR</option>
        <option value="USD">USD</option>
        <option value="GBP">GBP</option>
        <option value="CHF">CHF</option>
        <option value="SEK">SEK</option>
        <option value="NOK">NOK</option>
        <option value="DKK">DKK</option>
        <option value="PLN">PLN</option>
        <option value="CZK">CZK</option>
        <option value="JPY">JPY</option>
        <option value="AUD">AUD</option>
        <option value="CAD">CAD</option>
      </select>
    </div>
  </div>

  <button type="submit" class="submit" disabled={!fromAirport || !toAirport || !date}>
    Search Flights
  </button>
</form>

<style>
  .search-form {
    background: var(--color-surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .trip-toggle {
    display: flex;
    gap: 0;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    overflow: hidden;
    width: fit-content;
  }
  .toggle-btn {
    padding: 6px 16px;
    border: none;
    background: var(--color-surface);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-muted);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .toggle-btn:not(:last-child) {
    border-right: 1px solid var(--color-border);
  }
  .toggle-btn.active {
    background: var(--color-primary);
    color: #fff;
  }
  .row {
    display: grid;
    gap: 1rem;
  }
  .airports,
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
  input,
  select {
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 0.95rem;
    background: var(--color-surface);
  }
  input:focus,
  select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgb(26 115 232 / 0.15);
  }
  .submit {
    padding: 12px;
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: var(--radius);
    font-size: 1rem;
    font-weight: 600;
    transition: background 0.15s;
  }
  .submit:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
  .submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 540px) {
    .airports,
    .dates,
    .options-3 {
      grid-template-columns: 1fr;
    }
  }
</style>
