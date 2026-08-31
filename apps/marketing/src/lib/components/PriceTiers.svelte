<script lang="ts">
import TierBoard from '$lib/components/TierBoard.svelte'

let { selected = $bindable('survey') }: { selected?: string } = $props()
</script>

<TierBoard bind:selected />

<p class="foot">
  You pay for how much searching you ask for, because that is the part that takes the time. A
  Survey is split across several runs, and return-trip date grids are capped at 21 departure and
  return combinations; everything else is a matter of how much work you want done.
</p>

<style>
  .foot {
    margin-top: var(--space-4);
    color: var(--color-muted);
    font-size: 0.9rem;
    max-width: var(--measure);
  }
</style>
