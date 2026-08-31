<script lang="ts">
import { en as copy } from '$lib/i18n/en'
import { TIERS } from '$lib/tiers'

/** A brief should be a minute of tapping, not a form to fill in. The
 *  destination is the only thing we cannot guess. Every other row is chips,
 *  and an empty row is a real answer: it means you have no view, so we use
 *  ours. Tapping a chosen chip again clears it. */
let { tier = 'survey' }: { tier?: string } = $props()

const ORIGINS = copy.brief.origins
const LENGTHS = copy.brief.lengths
const DATES = copy.brief.dates
const CABINS = copy.brief.cabins
const PRIORITIES = copy.brief.priorities
const DISLIKES = copy.brief.dislikes
const DEALBREAKERS = copy.brief.dealbreakers
/** The last origin is the escape hatch: picking it opens the free-text airport
 *  field, so the two have to be the same string in every language. */
const ELSEWHERE = ORIGINS[ORIGINS.length - 1]

/** The next nine months by name, so nobody has to type a date. */
const now = new Date()
const MONTHS = Array.from({ length: 9 }, (_, n) => {
  const d = new Date(now.getFullYear(), now.getMonth() + n, 1)
  const m = d.toLocaleString('en-GB', { month: 'long' })
  return d.getFullYear() === now.getFullYear() ? m : `${m} ${d.getFullYear()}`
})

let to = $state('')
let email = $state('')
let from = $state(ORIGINS[0])
let elsewhere = $state('')
let month = $state('')
let length = $state('')
let dates = $state(DATES[1])
let cabin = $state(CABINS[0])
let priorities = $state<string[]>([])
let dislikes = $state<string[]>([])
let dealbreakers = $state<string[]>([])
let notes = $state('')

const origin = $derived(from === ELSEWHERE ? elsewhere || 'anywhere' : from || 'anywhere')

const only = (cur: string, v: string) => (cur === v ? '' : v)
const also = (list: string[], v: string) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

const chosen = $derived(TIERS.find((t) => t.id === tier) ?? TIERS[2])

let busy = $state(false)
let failed = $state('')

/** The server prices the brief and opens a Stripe Checkout session; all we do
 *  is hand over the answers and follow the redirect. */
async function pay(e: SubmitEvent) {
  e.preventDefault()
  busy = true
  failed = ''

  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      tier: chosen.id,
      email,
      to,
      from: origin,
      month,
      length,
      dates,
      cabin,
      priorities,
      dislikes,
      dealbreakers,
      notes,
    }),
  }).catch(() => null)

  if (!res?.ok) {
    const body = await res?.json().catch(() => null)
    failed = body?.message ?? copy.errors.checkoutUnreachable
    busy = false
    return
  }

  const { url } = await res.json()
  window.location.assign(url)
}
</script>

{#snippet row(
  label: string,
  items: string[],
  picked: string[],
  tap: (v: string) => void,
  ranked: boolean,
)}
  <div class="field">
    <span class="cap">{label}</span>
    <div class="chips" role="group" aria-label={label}>
      {#each items as it (it)}
        {@const n = picked.indexOf(it)}
        <button type="button" class:on={n >= 0} aria-pressed={n >= 0} onclick={() => tap(it)}>
          {#if ranked && n >= 0}<i>{n + 1}</i>{/if}{it}
        </button>
      {/each}
    </div>
  </div>
{/snippet}

<form onsubmit={pay}>
  <label>
    <span>{copy.brief.toLabel}</span>
    <input bind:value={to} required placeholder={copy.brief.toPlaceholder} autocomplete="off" />
  </label>

  {@render row(copy.brief.fromLabel, ORIGINS, [from], (v) => (from = only(from, v)), false)}
  {#if from === ELSEWHERE}
    <label class="tuck">
      <span>{copy.brief.elsewhereLabel}</span>
      <input bind:value={elsewhere} placeholder={copy.brief.elsewherePlaceholder} autocomplete="off" />
    </label>
  {/if}

  {@render row(copy.brief.monthLabel, MONTHS, [month], (v) => (month = only(month, v)), false)}
  {@render row(copy.brief.lengthLabel, LENGTHS, [length], (v) => (length = only(length, v)), false)}

  <!-- Everything below has a sane default, so it stays folded away. Opening it
       is a choice, not a step: the brief is complete without ever touching it. -->
  <details>
    <summary>
      {copy.brief.moreSummary}
      <span>{copy.brief.moreHint(dates.toLowerCase(), cabin.toLowerCase())}</span>
    </summary>
    <div class="more">
      {@render row(copy.brief.datesLabel, DATES, [dates], (v) => (dates = only(dates, v)), false)}
      {@render row(copy.brief.cabinLabel, CABINS, [cabin], (v) => (cabin = only(cabin, v)), false)}
      {@render row(
        copy.brief.prioritiesLabel,
        PRIORITIES,
        priorities,
        (v) => (priorities = also(priorities, v)),
        true,
      )}
      {@render row(
        copy.brief.dislikesLabel,
        DISLIKES,
        dislikes,
        (v) => (dislikes = also(dislikes, v)),
        false,
      )}
      {@render row(
        copy.brief.dealbreakersLabel,
        DEALBREAKERS,
        dealbreakers,
        (v) => (dealbreakers = also(dealbreakers, v)),
        false,
      )}

      <label>
        <span>{copy.brief.notesLabel}</span>
        <textarea bind:value={notes} rows="2" placeholder={copy.brief.notesPlaceholder}></textarea>
      </label>
    </div>
  </details>

  <label>
    <span>{copy.brief.emailLabel}</span>
    <input
      bind:value={email}
      type="email"
      required
      placeholder={copy.brief.emailPlaceholder}
      autocomplete="email"
    />
  </label>

  <div class="total">
    <span class="label">
      {copy.brief.total(
        copy.pricing.tiers[chosen.id].name,
        copy.pricing.searchCount(chosen.searches),
      )}
    </span>
    <span class="amount">{chosen.price}</span>
  </div>

  <button type="submit" class="pay" disabled={busy}>
    {busy ? copy.brief.payBusy : copy.brief.pay(chosen.price)}
  </button>

  {#if failed}
    <p class="failed" role="alert">{failed}</p>
  {/if}

  <p class="note">{copy.brief.note(copy.pricing.tiers[chosen.id].time)}</p>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: var(--space-5);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: clamp(1.25rem, 3vw, 2.25rem);
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  label span {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
  input,
  textarea {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 0.7rem 0.85rem;
    color: var(--color-text);
    width: 100%;
    resize: vertical;
  }
  input:focus,
  textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-amber-glow);
  }

  .total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
  }
  .total .label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
  .total .amount {
    font-family: var(--font-mono);
    font-size: 1.8rem;
    color: var(--color-primary);
  }

  /* The wallet buttons live on Stripe's page now, so this one is just the
     black slab that used to carry them. */
  .pay {
    background: #000;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0.95rem 1.5rem;
    font-size: 1.15rem;
    font-weight: 500;
    letter-spacing: -0.01em;
    transition: opacity 0.2s ease;
  }
  .pay:hover {
    opacity: 0.85;
  }
  .pay:disabled {
    opacity: 0.5;
  }

  .failed {
    color: var(--color-primary);
    font-size: 0.9rem;
  }

  .note {
    color: var(--color-muted);
    font-size: 0.85rem;
    max-width: var(--measure);
  }

  /* Chips: one tap per answer, and a second tap to take it back. */
  .field {
    display: grid;
    gap: 0.5rem;
  }
  .cap {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .chips button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    padding: 0.42rem 0.85rem;
    font-size: 0.88rem;
    color: var(--color-text);
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }
  .chips button:hover {
    border-color: var(--color-primary);
  }
  .chips button.on {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-surface);
  }
  /* The rank a priority was tapped in, carried on the chip itself. */
  .chips i {
    display: grid;
    place-items: center;
    width: 1.15rem;
    height: 1.15rem;
    margin-left: -0.2rem;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.22);
    font-family: var(--font-mono);
    font-style: normal;
    font-size: 0.68rem;
  }
  .tuck {
    max-width: 18rem;
  }

  /* The optional half of the brief, folded. */
  details {
    border-top: 1px solid var(--color-border);
    padding-top: 1rem;
  }
  summary {
    cursor: pointer;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.6rem;
    list-style: none;
    color: var(--color-text);
    font-size: 0.95rem;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary::before {
    content: '+';
    font-family: var(--font-mono);
    color: var(--color-primary);
  }
  details[open] summary::before {
    content: '\2212';
  }
  summary span {
    color: var(--color-muted);
    font-size: 0.85rem;
  }
  .more {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-top: 1rem;
  }
</style>
