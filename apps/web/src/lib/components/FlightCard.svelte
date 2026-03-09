<script lang="ts">
import { addLeg, createItinerary, getActive } from '$lib/itinerary-store'
import type { Offer } from '$lib/types'
import { formatDateShort } from '$lib/utils/dates'
import FlightDetail from './FlightDetail.svelte'
import FlightPath from './FlightPath.svelte'

const {
  offer,
  showDate = false,
  onaddleg,
}: { offer: Offer; showDate?: boolean; onaddleg?: () => void } = $props()

let expanded = $state(false)

const stopsLabel = $derived(
  offer.stops === 0 ? 'Nonstop' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`,
)
const hasLegs = $derived(offer.legs.length > 0)
const airlineCodes = $derived([...new Set(offer.legs.map((l) => l.airline))])
const logoUrl = (code: string) => `https://www.gstatic.com/flights/airline_logos/70px/${code}.png`

let addedToast = $state(false)

function handleAddToItinerary(e: MouseEvent) {
  e.stopPropagation()
  let active = getActive()
  if (!active) active = createItinerary('Trip 1')
  addLeg(active.id, offer)
  addedToast = true
  setTimeout(() => {
    addedToast = false
  }, 1500)
  onaddleg?.()
}

function hideBrokenImg(e: Event) {
  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
}
</script>

<div
  class="card"
  class:best={offer.is_best}
  class:expandable={hasLegs}
  role="button"
  tabindex="0"
  onclick={() => hasLegs && (expanded = !expanded)}
  onkeydown={(e) => { if (hasLegs && (e.key === 'Enter' || e.key === ' ')) expanded = !expanded }}
>
  {#if offer.is_best}
    <span class="badge">Best</span>
  {/if}

  <div class="summary">
    <div class="summary-main">
      <div class="airline">
        {#each airlineCodes as code}<img class="airline-logo" src={logoUrl(code)} alt="" onerror={hideBrokenImg} />{/each}
        {offer.name}
      </div>
      <div class="times-row">
        <span class="time">{offer.departure}</span>
        <FlightPath legs={offer.legs} layovers={offer.layovers} stops={offer.stops} />
        <span class="time">
          {offer.arrival}
          {#if offer.arrival_time_ahead}
            <sup class="ahead">{offer.arrival_time_ahead}</sup>
          {/if}
        </span>
      </div>
      <div class="meta">
        {#if offer.countries.length > 0}
          <span class="countries">{offer.countries.join(' \u2192 ')}</span>
          <span class="dot">&middot;</span>
        {/if}
        {#if showDate}
          <span class="date-tag">{formatDateShort(offer.departure_date)}{#if offer.return_date} / {formatDateShort(offer.return_date)}{/if}</span>
          <span class="dot">&middot;</span>
        {/if}
        <span>{offer.duration}</span>
        <span class="dot">&middot;</span>
        <span class:nonstop={offer.stops === 0}>{stopsLabel}</span>
        {#if offer.delay}
          <span class="dot">&middot;</span>
          <span class="delay">{offer.delay}</span>
        {/if}
      </div>
    </div>

    <div class="summary-aside">
      <span class="price">{offer.price}</span>
      <div class="aside-row">
        <button type="button" class="add-btn" onclick={handleAddToItinerary} title="Add to itinerary">
          {addedToast ? '✓' : '+'}
        </button>
        {#if hasLegs}
          <span class="chevron" class:open={expanded}>&#9662;</span>
        {/if}
      </div>
    </div>
  </div>

  {#if expanded}
    <FlightDetail {offer} />
  {/if}
</div>

<style>
  .card {
    position: relative;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 1rem 1.25rem;
    transition: box-shadow 0.15s;
  }
  .card:hover {
    box-shadow: var(--shadow);
  }
  .card.expandable {
    cursor: pointer;
  }
  .card.best {
    border-color: var(--color-primary);
    box-shadow: 0 0 12px var(--color-amber-glow);
  }

  /* Badge */
  .badge {
    position: absolute;
    top: -8px;
    right: 12px;
    background: var(--color-primary);
    color: var(--color-bg);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
  }

  /* Summary layout */
  .summary {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }
  .summary-main {
    flex: 1;
    min-width: 0;
  }
  .summary-aside {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    flex-shrink: 0;
  }

  /* Airline name + logo */
  .airline {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
  }
  .airline-logo {
    width: 20px;
    height: 20px;
    object-fit: contain;
    border-radius: 2px;
  }
  /* Times row with path indicator */
  .times-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 8px;
  }
  .time {
    font-family: var(--font-mono);
    font-size: 1.3rem;
    font-weight: 400;
    letter-spacing: -0.02em;
    white-space: nowrap;
    padding-top: 2px;
  }
  .ahead {
    font-family: var(--font-body);
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--color-error);
  }

  /* Meta row */
  .meta {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.82rem;
    color: var(--color-muted);
  }
  .countries {
    font-weight: 500;
    letter-spacing: 0.03em;
  }
  .dot {
    opacity: 0.35;
  }
  .nonstop {
    color: var(--color-success);
    font-weight: 500;
  }
  .delay {
    color: var(--color-error);
  }
  .date-tag {
    font-weight: 500;
    color: var(--color-primary);
  }

  /* Aside actions */
  .aside-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .add-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    background: transparent;
    color: var(--color-muted);
    font-size: 0.85rem;
    padding: 0;
    cursor: pointer;
    transition: border-color 0.12s, color 0.12s;
  }
  .add-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  /* Price + chevron */
  .price {
    font-family: var(--font-mono);
    font-weight: 400;
    font-size: 1.2rem;
    color: var(--color-primary);
    text-shadow: 0 0 10px var(--color-amber-glow);
  }
  .chevron {
    font-size: 0.7rem;
    color: var(--color-muted);
    transition: transform 0.2s;
  }
  .chevron.open {
    transform: rotate(180deg);
  }
</style>
