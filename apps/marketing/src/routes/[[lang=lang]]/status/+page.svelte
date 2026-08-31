<script lang="ts">
import { getCopy, getLocale } from '$lib/i18n/copy.svelte'

const copy = $derived(getCopy())
const homeHref = $derived(getLocale() === 'nl' ? '/nl' : '/')

type Job = {
  job: string
  route: string
  tier: string
  updated: string
  state: 'working' | 'ready' | 'attention'
  progress: { done: number; total: number }
  line: string
  pdf: string | null
}

let job = $state<Job | null>(null)
let missing = $state(false)

/** The desk writes /status/<id>.json; this page just watches it. */
$effect(() => {
  const id = new URLSearchParams(location.search).get('job') ?? 'b7f3'

  async function poll() {
    const res = await fetch(`/status/${id}.json`, { cache: 'no-store' })
    if (!res.ok) {
      missing = true
      return
    }
    job = await res.json()
  }

  poll()
  const t = setInterval(poll, 5000)
  return () => clearInterval(t)
})

const pct = $derived(job ? Math.round((job.progress.done / job.progress.total) * 100) : 0)
</script>

<svelte:head><title>{copy.status.title}</title></svelte:head>

<main>
  <a class="mark" href={homeHref}>{copy.status.brand}</a>

  {#if missing}
    <p class="line">{copy.status.missing}</p>
  {:else if job}
    <p class="eyebrow">{copy.status.eyebrow(job.tier, job.job)}</p>
    <h1>{job.route}</h1>

    {#if job.state === 'attention'}
      <p class="line attention">{job.line}</p>
    {:else}
      <p class="line">{job.line}</p>
    {/if}

    {#if job.state !== 'attention'}
      <div class="bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
        <div style="width: {pct}%"></div>
      </div>
      <p class="count">{copy.status.count(job.progress.done, job.progress.total)}</p>
    {/if}

    {#if job.pdf}
      <a class="btn" href={job.pdf}>{copy.status.open}</a>
    {/if}
  {:else}
    <p class="line">{copy.status.looking}</p>
  {/if}
</main>

<style>
  main {
    max-width: 620px;
    margin: 0 auto;
    padding: clamp(3rem, 12vw, 7rem) clamp(1rem, 5vw, 2rem);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  .mark {
    font-family: var(--font-mono);
    font-size: 1.15rem;
    letter-spacing: 0.06em;
    color: var(--color-muted);
    text-decoration: none;
    margin-bottom: 2rem;
  }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-primary);
  }
  h1 {
    font-size: clamp(1.6rem, 4vw, 2.25rem);
    line-height: 1.15;
    letter-spacing: -0.02em;
    font-weight: 600;
  }
  .line {
    font-size: var(--text-lead);
    color: var(--color-text);
  }
  .attention {
    border-left: 2px solid var(--color-primary);
    padding-left: 1rem;
  }
  .bar {
    width: 100%;
    height: 3px;
    background: var(--color-track);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 1rem;
  }
  .bar div {
    height: 100%;
    background: var(--color-primary);
    box-shadow: 0 0 12px var(--color-amber-glow);
    transition: width 0.6s ease;
  }
  .count {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-muted);
  }
  .btn {
    background: var(--color-primary);
    color: var(--color-bg);
    border-radius: var(--radius);
    padding: 0.85rem 1.5rem;
    font-weight: 600;
    text-decoration: none;
    margin-top: 1rem;
  }
</style>
