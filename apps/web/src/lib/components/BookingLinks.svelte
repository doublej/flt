<script lang="ts">
import type { Offer } from '$lib/types'
import { offerBookingUrls } from '$lib/utils/booking'
import { PROGRAM_LABELS, type BookingFilters, type ProgramName } from '@flights/core/booking'

const { offer, size = 'normal', filters }: { offer: Offer; size?: 'normal' | 'small'; filters?: BookingFilters } = $props()

const urls = $derived(offerBookingUrls(offer, filters))
</script>

{#if urls}
  <div class="links" class:small={size === 'small'}>
    {#each Object.entries(urls) as [program, url]}
      <a href={url} target="_blank" rel="noopener noreferrer" class="link" onclick={(e) => e.stopPropagation()}>
        {PROGRAM_LABELS[program as ProgramName] ?? program}
      </a>
    {/each}
    <a href={offer.url} target="_blank" rel="noopener noreferrer" class="link link--secondary" onclick={(e) => e.stopPropagation()}>
      Google Flights
    </a>
  </div>
{:else}
  <a href={offer.url} target="_blank" rel="noopener noreferrer" class="link link--secondary" onclick={(e) => e.stopPropagation()}>
    Google Flights
  </a>
{/if}

<style>
  .links {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .link {
    padding: 5px 14px;
    font-size: 0.82rem;
    font-weight: 600;
    border-radius: 16px;
    text-decoration: none;
    transition: background 0.15s, border-color 0.15s;
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: transparent;
    white-space: nowrap;
  }
  .link:hover {
    background: var(--color-primary);
    color: var(--color-bg);
  }
  .link--secondary {
    border-color: var(--color-border);
    color: var(--color-muted);
  }
  .link--secondary:hover {
    border-color: var(--color-primary);
    background: transparent;
    color: var(--color-primary);
  }
  .small .link {
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 10px;
  }
</style>
