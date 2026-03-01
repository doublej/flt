<script lang="ts">
import { searchFlights, searchFlightsStream } from '$lib/api'
// biome-ignore lint/style/useImportType: Svelte component used in template
import RecentSearches from '$lib/components/RecentSearches.svelte'
import ResultsList from '$lib/components/ResultsList.svelte'
// biome-ignore lint/style/useImportType: Svelte component used in template
import SearchForm from '$lib/components/SearchForm.svelte'
import type { RecentSearch } from '$lib/recent-searches'
import type { Flight, SearchParams, SearchResult } from '$lib/types'

let result = $state<SearchResult | null>(null)
let loading = $state(false)
let error = $state('')
let searchMessage = $state('')
let completionMessage = $state('')
let abortStream: (() => void) | null = $state(null)

let searchForm: ReturnType<typeof SearchForm> | undefined
let recentSearches: ReturnType<typeof RecentSearches> | undefined

function isMultiDate(params: SearchParams): boolean {
  return !!(params.date_end || params.return_date_end)
}

async function handleSearch(params: SearchParams) {
  abortStream?.()
  abortStream = null
  loading = true
  error = ''
  result = null
  completionMessage = ''

  if (isMultiDate(params)) {
    handleStreamSearch(params)
  } else {
    handleSingleSearch(params)
  }
}

async function handleSingleSearch(params: SearchParams) {
  searchMessage = 'Searching flights...'
  try {
    result = await searchFlights(params)
    if (result) {
      const n = result.flights.length
      completionMessage = `Found ${n} flight${n !== 1 ? 's' : ''}`
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Search failed'
  } finally {
    loading = false
    searchMessage = ''
    recentSearches?.refresh()
  }
}

function finishStream() {
  loading = false
  searchMessage = ''
  abortStream = null
  recentSearches?.refresh()
  if (result) {
    const n = result.flights.length
    completionMessage = `Found ${n} flight${n !== 1 ? 's' : ''}`
  }
}

function handleStreamSearch(params: SearchParams) {
  const flights: Flight[] = []
  const partial: SearchResult = { current_price: '', flights: [], google_flights_url: '' }
  result = partial
  searchMessage = 'Searching dates...'

  abortStream = searchFlightsStream(params, {
    onFlights(batch) {
      flights.push(...batch)
      result = { ...partial, flights: [...flights] }
    },
    onProgress(completed, total) {
      searchMessage = `Searched ${completed} of ${total} dates...`
    },
    onDone(meta) {
      result = { ...partial, flights: [...flights], ...meta }
      finishStream()
    },
    onError(detail) {
      if (!flights.length) error = detail
      finishStream()
    },
  })
}

let hasPendingRecent = $state(false)

function handleRecentSelect(entry: RecentSearch) {
  searchForm?.fillFrom(entry)
  hasPendingRecent = true
}

async function handleSearchWithReset(params: SearchParams) {
  hasPendingRecent = false
  handleSearch(params)
}
</script>

<header class="header">
  <h1>Flight Search</h1>
</header>

<SearchForm bind:this={searchForm} onsearch={handleSearchWithReset} showCachedButton={hasPendingRecent} />
<RecentSearches bind:this={recentSearches} onselect={handleRecentSelect} />

{#if loading}
  <div class="status">
    <div class="spinner"></div>
    <p>{searchMessage}</p>
  </div>
{/if}

{#if error}
  <div class="error" role="alert">
    <span>⚠ {error}</span>
    <small>Try adjusting your dates or route</small>
  </div>
{/if}

{#if completionMessage && !loading}
  <p class="completion">{completionMessage}</p>
{/if}

{#if result && result.flights.length > 0}
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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .error small {
    opacity: 0.8;
    font-size: 0.8rem;
  }
  .completion {
    margin-top: 1rem;
    text-align: center;
    font-size: 0.85rem;
    color: var(--color-muted);
  }
</style>
