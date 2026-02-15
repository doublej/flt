<script lang="ts">
import { searchFlights } from '$lib/api'
// biome-ignore lint/style/useImportType: Svelte component used in template
import RecentSearches from '$lib/components/RecentSearches.svelte'
import ResultsList from '$lib/components/ResultsList.svelte'
// biome-ignore lint/style/useImportType: Svelte component used in template
import SearchForm from '$lib/components/SearchForm.svelte'
import type { RecentSearch } from '$lib/recent-searches'
import type { SearchParams, SearchResult } from '$lib/types'

let result = $state<SearchResult | null>(null)
let loading = $state(false)
let error = $state('')

let searchForm: ReturnType<typeof SearchForm> | undefined
let recentSearches: ReturnType<typeof RecentSearches> | undefined

async function handleSearch(params: SearchParams) {
  loading = true
  error = ''
  result = null

  try {
    result = await searchFlights(params)
  } catch (e) {
    error = e instanceof Error ? e.message : 'Search failed'
  } finally {
    loading = false
    recentSearches?.refresh()
  }
}

function handleRecentSelect(entry: RecentSearch) {
  searchForm?.fillFrom(entry)
  handleSearch(entry.params)
}
</script>

<header class="header">
  <h1>Flight Search</h1>
</header>

<SearchForm bind:this={searchForm} onsearch={handleSearch} />
<RecentSearches bind:this={recentSearches} onselect={handleRecentSelect} />

{#if loading}
  <div class="status">
    <div class="spinner"></div>
    <p>Searching flights...</p>
  </div>
{/if}

{#if error}
  <div class="error">{error}</div>
{/if}

{#if result}
  <ResultsList {result} />
{/if}

<style>
  .header {
    text-align: center;
    margin-bottom: 1.5rem;
  }
  .header h1 {
    font-size: 1.8rem;
    font-weight: 700;
  }
  .status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 2rem;
    color: var(--color-muted);
  }
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .error {
    margin-top: 1.5rem;
    padding: 12px 16px;
    background: #fce8e6;
    color: #c5221f;
    border-radius: var(--radius);
    text-align: center;
    font-size: 0.9rem;
  }
</style>
