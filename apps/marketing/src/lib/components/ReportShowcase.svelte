<script lang="ts">
import { getCopy } from '$lib/i18n/copy.svelte'

const copy = $derived(getCopy())
const PAGES = $derived([
  { id: 'cover', label: copy.report.showcase.cover, caption: copy.report.showcase.coverCaption },
  { id: 'chart', label: copy.report.showcase.chart, caption: copy.report.showcase.chartCaption },
  { id: 'table', label: copy.report.showcase.table, caption: copy.report.showcase.tableCaption },
])

let active = $state('cover')
const current = $derived(PAGES.find((p) => p.id === active) ?? PAGES[0])
</script>

<div class="showcase">
  <div class="switch" role="tablist" aria-label={copy.report.showcase.pagesLabel}>
    {#each PAGES as page}
      <button
        role="tab"
        aria-selected={active === page.id}
        class:on={active === page.id}
        onclick={() => (active = page.id)}
      >
        {page.label}
      </button>
    {/each}
  </div>

  <div class="frame">
    <picture>
      <source srcset="/report/{current.id}.webp" type="image/webp" />
      <img src="/report/{current.id}.png" alt={copy.report.showcase.pageAlt(current.label)} />
    </picture>
  </div>

  <p class="caption">{current.caption}</p>
</div>

<style>
  .switch {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }
  .switch button {
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    padding: 0.4rem 0.95rem;
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    transition: all 0.2s ease;
  }
  .switch button:hover {
    color: var(--color-text);
    border-color: var(--color-track);
  }
  .switch button.on {
    color: var(--color-primary);
    border-color: var(--color-primary);
    box-shadow: 0 0 16px var(--color-amber-glow);
  }
  .frame {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 0.75rem;
    box-shadow: var(--shadow-lg);
    max-height: 72vh;
    overflow: auto;
    overscroll-behavior: contain;
  }
  .frame img {
    display: block;
    width: 100%;
    border-radius: var(--radius);
  }
  .caption {
    margin-top: 1rem;
    color: var(--color-muted);
    max-width: var(--measure);
    font-size: 0.95rem;
  }
</style>
