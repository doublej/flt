<script lang="ts">
import type { FlightLayover, FlightLeg } from '$lib/types'

const { legs, layovers, stops }: { legs: FlightLeg[]; layovers: FlightLayover[]; stops: number } =
  $props()

const hasLegs = $derived(legs.length > 0)

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  return h ? `${h}h` : `${m}m`
}
</script>

<div class="flight-path">
  {#if hasLegs}
    <div class="path-track">
      {#each legs as leg, i}
        <div class="track-seg" style="flex: {leg.duration}"></div>
        {#if i < layovers.length}
          <div class="track-lay" style="flex: {layovers[i].duration}">
            <div class="lay-half"></div>
            <span class="stop-dot"></span>
            <div class="lay-half"></div>
          </div>
        {/if}
      {/each}
    </div>
    <div class="path-labels">
      {#each legs as leg, i}
        <div class="label-seg" style="flex: {leg.duration}">{fmtDuration(leg.duration)}</div>
        {#if i < layovers.length}
          <div class="label-lay" style="flex: {layovers[i].duration}">{fmtDuration(layovers[i].duration)}</div>
        {/if}
      {/each}
    </div>
  {:else}
    <div class="path-track">
      <div class="track-seg"></div>
      {#each Array(stops) as _}
        <span class="stop-dot"></span>
        <div class="track-seg"></div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .flight-path {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 40px;
  }
  .path-track {
    display: flex;
    align-items: center;
    height: 12px;
  }
  .track-seg {
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }
  .track-lay {
    display: flex;
    align-items: center;
    min-width: 20px;
  }
  .lay-half {
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }
  .stop-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    border: 1.5px solid var(--color-muted);
    background: var(--color-surface);
    flex-shrink: 0;
    margin: 0 2px;
  }
  .path-labels {
    display: flex;
    align-items: flex-start;
  }
  .label-seg {
    flex: 1;
    text-align: center;
    font-size: 0.64rem;
    color: var(--color-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }
  .label-lay {
    text-align: center;
    font-size: 0.6rem;
    color: var(--color-muted);
    opacity: 0.7;
    white-space: nowrap;
    min-width: 0;
    font-style: italic;
  }
</style>
