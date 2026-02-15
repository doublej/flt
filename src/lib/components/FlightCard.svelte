<script lang="ts">
import type { Flight } from '$lib/types'

const { flight }: { flight: Flight } = $props()

const stopsLabel = $derived(
  flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`,
)
</script>

<div class="card" class:best={flight.is_best}>
  {#if flight.is_best}
    <span class="badge">Best</span>
  {/if}

  <div class="header">
    <span class="airline">{flight.name}</span>
    <span class="price">{flight.price}</span>
  </div>

  <div class="times">
    <span class="time">{flight.departure}</span>
    <span class="arrow">&rarr;</span>
    <span class="time">
      {flight.arrival}
      {#if flight.arrival_time_ahead}
        <span class="ahead">{flight.arrival_time_ahead}</span>
      {/if}
    </span>
  </div>

  <div class="meta">
    <span>{flight.duration}</span>
    <span class="dot">&middot;</span>
    <span class:nonstop={flight.stops === 0}>{stopsLabel}</span>
    {#if flight.delay}
      <span class="dot">&middot;</span>
      <span class="delay">{flight.delay}</span>
    {/if}
  </div>
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
  .card.best {
    border-color: var(--color-primary);
  }
  .badge {
    position: absolute;
    top: -8px;
    right: 12px;
    background: var(--color-primary);
    color: #fff;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;
  }
  .airline {
    font-weight: 600;
    font-size: 0.95rem;
  }
  .price {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--color-primary);
  }
  .times {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .time {
    font-size: 1.05rem;
    font-weight: 500;
  }
  .arrow {
    color: var(--color-muted);
  }
  .ahead {
    font-size: 0.75rem;
    color: var(--color-error);
    vertical-align: super;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    color: var(--color-muted);
  }
  .dot {
    opacity: 0.4;
  }
  .nonstop {
    color: var(--color-success);
    font-weight: 500;
  }
  .delay {
    color: var(--color-error);
  }
</style>
