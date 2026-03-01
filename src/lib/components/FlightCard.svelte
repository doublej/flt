<script lang="ts">
import type { Flight } from '$lib/types'
import { formatDateShort } from '$lib/utils/dates'
import FlightPath from './FlightPath.svelte'

const { flight, showDate = false }: { flight: Flight; showDate?: boolean } = $props()

let expanded = $state(false)

const stopsLabel = $derived(
  flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`,
)
const hasLegs = $derived(flight.legs.length > 0)

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  return h ? `${h}h` : `${m}m`
}
</script>

<div
  class="card"
  class:best={flight.is_best}
  class:expandable={hasLegs}
  role="button"
  tabindex="0"
  onclick={() => hasLegs && (expanded = !expanded)}
  onkeydown={(e) => { if (hasLegs && (e.key === 'Enter' || e.key === ' ')) expanded = !expanded }}
>
  {#if flight.is_best}
    <span class="badge">Best</span>
  {/if}

  <div class="summary">
    <div class="summary-main">
      <div class="airline">{flight.name}</div>
      <div class="times-row">
        <span class="time">{flight.departure}</span>
        <FlightPath legs={flight.legs} layovers={flight.layovers} stops={flight.stops} />
        <span class="time">
          {flight.arrival}
          {#if flight.arrival_time_ahead}
            <sup class="ahead">{flight.arrival_time_ahead}</sup>
          {/if}
        </span>
      </div>
      <div class="meta">
        {#if showDate}
          <span class="date-tag">{formatDateShort(flight.departure_date)}{#if flight.return_date} / {formatDateShort(flight.return_date)}{/if}</span>
          <span class="dot">&middot;</span>
        {/if}
        <span>{flight.duration}</span>
        <span class="dot">&middot;</span>
        <span class:nonstop={flight.stops === 0}>{stopsLabel}</span>
        {#if flight.delay}
          <span class="dot">&middot;</span>
          <span class="delay">{flight.delay}</span>
        {/if}
      </div>
    </div>

    <div class="summary-aside">
      <span class="price">{flight.price}</span>
      {#if hasLegs}
        <span class="chevron" class:open={expanded}>&#9662;</span>
      {/if}
    </div>
  </div>

  {#if expanded}
    <div class="itinerary">
      {#each flight.legs as leg, i}
        <div class="leg">
          <div class="leg-header">
            <span class="leg-airline">{leg.airline_name}</span>
            <span class="leg-detail">{leg.airline} {leg.flight_number}{leg.aircraft ? ` · ${leg.aircraft}` : ''}</span>
          </div>
          <div class="leg-route">
            <div class="endpoint">
              <span class="leg-time">{leg.departure_time}</span>
              <span class="leg-place">{leg.departure_airport}</span>
            </div>
            <div class="route-connector">
              <span class="conn-line"></span>
              <span class="conn-duration">{fmtDuration(leg.duration)}</span>
              <span class="conn-line"></span>
            </div>
            <div class="endpoint endpoint--right">
              <span class="leg-time">{leg.arrival_time}</span>
              <span class="leg-place">{leg.arrival_airport}</span>
            </div>
          </div>
        </div>
        {#if i < flight.layovers.length}
          <div class="layover">
            <span class="layover-icon">&#9201;</span>
            <span class="layover-text">
              <strong>{fmtDuration(flight.layovers[i].duration)}</strong> layover in {flight.layovers[i].airport_name} ({flight.layovers[i].airport})
            </span>
          </div>
        {/if}
      {/each}
    </div>
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
  }

  /* Badge */
  .badge {
    position: absolute;
    top: -8px;
    right: 12px;
    background: var(--color-primary);
    color: #fff;
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

  /* Airline name */
  .airline {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
  }

  /* Times row with path indicator */
  .times-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 8px;
  }
  .time {
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    white-space: nowrap;
    padding-top: 2px;
  }
  .ahead {
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

  /* Price + chevron */
  .price {
    font-weight: 700;
    font-size: 1.2rem;
    color: var(--color-primary);
  }
  .chevron {
    font-size: 0.7rem;
    color: var(--color-muted);
    transition: transform 0.2s;
  }
  .chevron.open {
    transform: rotate(180deg);
  }

  /* Itinerary */
  .itinerary {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* Leg */
  .leg {
    padding: 8px 0 4px;
  }
  .leg-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }
  .leg-airline {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .leg-detail {
    font-size: 0.78rem;
    color: var(--color-muted);
  }

  /* Leg route: 3-column */
  .leg-route {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .endpoint {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .endpoint--right {
    text-align: right;
  }
  .leg-time {
    font-size: 1rem;
    font-weight: 600;
    white-space: nowrap;
  }
  .leg-place {
    font-size: 0.75rem;
    color: var(--color-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }
  .endpoint--right .leg-place {
    text-align: right;
  }

  /* Route connector */
  .route-connector {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    padding-top: 6px;
    min-width: 0;
  }
  .conn-line {
    flex: 1;
    height: 1px;
    border-top: 1px dashed var(--color-border);
  }
  .conn-duration {
    font-size: 0.72rem;
    color: var(--color-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* Layover */
  .layover {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 2px 0;
    padding: 6px 10px;
    background: var(--color-bg);
    border-left: 2px solid var(--color-border);
    border-radius: 0 4px 4px 0;
  }
  .layover-icon {
    font-size: 0.8rem;
    flex-shrink: 0;
    margin-top: 1px;
    opacity: 0.6;
  }
  .layover-text {
    font-size: 0.78rem;
    color: var(--color-muted);
    line-height: 1.4;
  }
</style>
