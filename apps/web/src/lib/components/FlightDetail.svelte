<script lang="ts">
import type { Offer } from '$lib/types'
import type { BookingFilters } from '@flights/core/booking'
import BookingLinks from './BookingLinks.svelte'
import FlightMap from './FlightMap.svelte'

const { offer, filters }: { offer: Offer; filters?: BookingFilters } = $props()

const logoUrl = (code: string) => `https://www.gstatic.com/flights/airline_logos/70px/${code}.png`

function hideBrokenImg(e: Event) {
  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  return h ? `${h}h` : `${m}m`
}
</script>

<div class="itinerary">
  {#each offer.legs as leg, i}
    <div class="leg">
      <div class="leg-header">
        <img class="leg-logo" src={logoUrl(leg.airline)} alt="" onerror={hideBrokenImg} />
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
    {#if i < offer.layovers.length}
      <div class="layover">
        <span class="layover-icon">&#9201;</span>
        <span class="layover-text">
          <strong>{fmtDuration(offer.layovers[i].duration)}</strong> layover in {offer.layovers[i].airport_name} ({offer.layovers[i].airport})
        </span>
      </div>
    {/if}
  {/each}
  <FlightMap legs={offer.legs} />

  <div class="booking-section">
    <span class="booking-label">Book this flight</span>
    <BookingLinks {offer} {filters} />
  </div>
</div>

<style>
  .itinerary {
    margin-top: 14px;
    padding-top: 14px;
    border-top: none;
    background: repeating-linear-gradient(
      90deg,
      var(--color-muted) 0,
      var(--color-muted) 6px,
      transparent 6px,
      transparent 12px
    ) top / 100% 1px no-repeat;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .leg {
    padding: 8px 0 4px;
  }
  .leg-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }
  .leg-logo {
    width: 16px;
    height: 16px;
    object-fit: contain;
    border-radius: 2px;
  }
  .leg-airline {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .leg-detail {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--color-muted);
  }
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
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 400;
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
    border-top: 1px dashed var(--color-track);
  }
  .conn-duration {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--color-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .layover {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 2px 0;
    padding: 6px 10px;
    background: var(--color-bg);
    border-left: 2px solid var(--color-primary);
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
  .booking-section {
    margin-top: 8px;
    padding-top: 10px;
    border-top: 1px dashed var(--color-border);
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .booking-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text);
  }
</style>
