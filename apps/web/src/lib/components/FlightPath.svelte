<script lang="ts">
import type { FlightLayover, FlightLeg } from '$lib/types'

const { legs, layovers, stops }: { legs: FlightLeg[]; layovers: FlightLayover[]; stops: number } =
  $props()

const hasLegs = $derived(legs.length > 0)
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
    background: var(--color-track);
  }
  .track-lay {
    display: flex;
    align-items: center;
    min-width: 20px;
  }
  .lay-half {
    flex: 1;
    height: 1px;
    background: var(--color-track);
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
</style>
