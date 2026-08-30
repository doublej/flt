<script lang="ts">
const TABS = [
  'Skyscanner — AMS to DAD',
  'Google Flights',
  'KLM · Amsterdam',
  'Kayak — flexible dates',
  'Momondo',
  'Expedia · Nov 3',
  'Vietnam Airlines',
  'Kiwi.com multi-city',
  'Booking.com Flights',
  'Qatar Airways',
  'Google Flights (2)',
]

let collapsed = $state(false)
let strip: HTMLDivElement

$effect(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return
      io.disconnect()
      setTimeout(() => {
        collapsed = true
      }, 900)
    },
    { threshold: 0.6 },
  )
  io.observe(strip)
  return () => io.disconnect()
})
</script>

<div class="chrome" bind:this={strip} class:collapsed aria-hidden="true">
  <div class="dots"><span></span><span></span><span></span></div>
  <div class="tabs">
    {#each TABS as tab}
      <div class="tab">{tab}</div>
    {/each}
    <div class="tab bureau">Bureau — your report is ready</div>
  </div>
</div>

<style>
  .chrome {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 0.75rem 0.75rem 0;
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }
  .dots {
    display: flex;
    gap: 0.4rem;
    padding-bottom: 0.6rem;
  }
  .dots span {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--color-track);
  }
  .tabs {
    display: flex;
    gap: 2px;
    align-items: stretch;
  }
  .tab {
    flex: 1 1 0;
    min-width: 0;
    padding: 0.6rem 0.7rem;
    background: var(--color-surface-raised);
    border-radius: 6px 6px 0 0;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--color-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition:
      flex-grow 0.9s cubic-bezier(0.65, 0, 0.35, 1),
      opacity 0.5s ease,
      padding 0.9s cubic-bezier(0.65, 0, 0.35, 1);
  }
  .bureau {
    flex-grow: 0;
    opacity: 0;
    padding-inline: 0;
    background: var(--color-bg);
    color: var(--color-primary);
    box-shadow: inset 0 2px 0 var(--color-primary);
  }
  .collapsed .tab {
    flex-grow: 0;
    opacity: 0;
    padding-inline: 0;
  }
  .collapsed .bureau {
    flex-grow: 1;
    opacity: 1;
    padding-inline: 0.7rem;
  }
</style>
