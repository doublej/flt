<script lang="ts">
import { TIERS } from '$lib/tiers'

/** A brief should be a minute of tapping, not a form to fill in. The
 *  destination is the only thing we cannot guess. Every other row is chips,
 *  and an empty row is a real answer: it means you have no view, so we use
 *  ours. Tapping a chosen chip again clears it. */
let { tier = 'survey' }: { tier?: string } = $props()

const ORIGINS = ['Amsterdam', 'Brussels', 'Paris', 'Düsseldorf', 'Frankfurt', 'Somewhere else']
const LENGTHS = ['A long weekend', 'A week', 'Two weeks', 'Longer', 'One way']
const DATES = ['Exact dates', 'Give or take a few days', 'Any week that month']
const CABINS = ['Economy', 'Premium economy', 'Business']
const PRIORITIES = [
  'Price',
  'Fewest stops',
  'Shortest journey',
  'Daytime flights',
  'Bag included',
  'An airline I know',
]
const DISLIKES = [
  'Overnight flights',
  'Layovers over four hours',
  'Low-cost carriers',
  'Departures before 8am',
  'Changing airport in a city',
]
const DEALBREAKERS = [
  'More than one stop',
  'Gulf hubs',
  'Overnight layovers',
  'Landing after midnight',
  'Separate tickets',
]

/** The next nine months by name, so nobody has to type a date. */
const now = new Date()
const MONTHS = Array.from({ length: 9 }, (_, n) => {
  const d = new Date(now.getFullYear(), now.getMonth() + n, 1)
  const m = d.toLocaleString('en-GB', { month: 'long' })
  return d.getFullYear() === now.getFullYear() ? m : `${m} ${d.getFullYear()}`
})

let to = $state('')
let from = $state('Amsterdam')
let elsewhere = $state('')
let month = $state('')
let length = $state('')
let dates = $state('Give or take a few days')
let cabin = $state('Economy')
let priorities = $state<string[]>([])
let dislikes = $state<string[]>([])
let dealbreakers = $state<string[]>([])
let notes = $state('')

const origin = $derived(from === 'Somewhere else' ? elsewhere || 'anywhere' : from || 'anywhere')
const when = $derived([month, length, dates].filter(Boolean).join(' · '))

const only = (cur: string, v: string) => (cur === v ? '' : v)
const also = (list: string[], v: string) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

/** idle → sheet (mock Apple Pay sheet) → done. No payment is taken anywhere. */
let stage = $state<'idle' | 'sheet' | 'done'>('idle')

const chosen = $derived(TIERS.find((t) => t.id === tier) ?? TIERS[2])

function pay(e: SubmitEvent) {
  e.preventDefault()
  stage = 'sheet'
}

function confirm() {
  stage = 'done'
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
    <span>Where do you want to go?</span>
    <input
      bind:value={to}
      required
      placeholder="Vietnam. Or Hanoi. Or anywhere warm in November."
      autocomplete="off"
    />
  </label>

  {@render row('Where from', ORIGINS, [from], (v) => (from = only(from, v)), false)}
  {#if from === 'Somewhere else'}
    <label class="tuck">
      <span>Which airport</span>
      <input bind:value={elsewhere} placeholder="Berlin" autocomplete="off" />
    </label>
  {/if}

  {@render row('Which month', MONTHS, [month], (v) => (month = only(month, v)), false)}
  {@render row('How long', LENGTHS, [length], (v) => (length = only(length, v)), false)}

  <!-- Everything below has a sane default, so it stays folded away. Opening it
       is a choice, not a step: the brief is complete without ever touching it. -->
  <details>
    <summary>
      Fussy about anything?
      <span>Optional — {dates.toLowerCase()}, {cabin.toLowerCase()}, no other rules</span>
    </summary>
    <div class="more">
      {@render row('Your dates', DATES, [dates], (v) => (dates = only(dates, v)), false)}
      {@render row('Cabin', CABINS, [cabin], (v) => (cabin = only(cabin, v)), false)}
      {@render row(
        'What matters most, in the order you tap them',
        PRIORITIES,
        priorities,
        (v) => (priorities = also(priorities, v)),
        true,
      )}
      {@render row('Rather not', DISLIKES, dislikes, (v) => (dislikes = also(dislikes, v)), false)}
      {@render row(
        'Dealbreakers',
        DEALBREAKERS,
        dealbreakers,
        (v) => (dealbreakers = also(dealbreakers, v)),
        false,
      )}

      <label>
        <span>Anything else</span>
        <textarea bind:value={notes} rows="2" placeholder="Optional. We read every word of it."
        ></textarea>
      </label>
    </div>
  </details>

  <div class="total">
    <span class="label">{chosen.name} · {chosen.searches}</span>
    <span class="amount">{chosen.price}</span>
  </div>

  <button type="submit" class="applepay">
    <svg viewBox="0 0 24 24" aria-hidden="true"
      ><path
        fill="currentColor"
        d="M17.05 12.54c-.03-3.07 2.51-4.54 2.62-4.61-1.43-2.09-3.65-2.38-4.44-2.41-1.89-.19-3.69 1.11-4.65 1.11-.96 0-2.44-1.08-4.01-1.05-2.06.03-3.96 1.2-5.02 3.05-2.14 3.71-.55 9.21 1.53 12.22 1.02 1.47 2.23 3.12 3.82 3.06 1.53-.06 2.11-.99 3.96-.99 1.85 0 2.37.99 3.99.96 1.65-.03 2.69-1.5 3.7-2.98 1.17-1.71 1.65-3.37 1.68-3.45-.04-.02-3.22-1.24-3.25-4.91zM14.01 3.9c.85-1.03 1.42-2.46 1.26-3.9-1.22.05-2.7.81-3.58 1.84-.79.91-1.48 2.37-1.29 3.77 1.36.11 2.75-.69 3.61-1.71z"
      /></svg
    >
    <span>Pay</span>
  </button>

  <p class="note">
    <strong>Mockup.</strong> Nothing is charged and no card is read. The brief and the price are
    real. The checkout is a placeholder while billing is built.
  </p>
</form>

{#if stage !== 'idle'}
  <div class="scrim" role="dialog" aria-modal="true" aria-label="Apple Pay (mockup)">
    <div class="sheet">
      <span class="demo">Demo — no payment is taken</span>

      {#if stage === 'sheet'}
        <div class="sheet-head">
          <svg viewBox="0 0 24 24" aria-hidden="true"
            ><path
              fill="currentColor"
              d="M17.05 12.54c-.03-3.07 2.51-4.54 2.62-4.61-1.43-2.09-3.65-2.38-4.44-2.41-1.89-.19-3.69 1.11-4.65 1.11-.96 0-2.44-1.08-4.01-1.05-2.06.03-3.96 1.2-5.02 3.05-2.14 3.71-.55 9.21 1.53 12.22 1.02 1.47 2.23 3.12 3.82 3.06 1.53-.06 2.11-.99 3.96-.99 1.85 0 2.37.99 3.99.96 1.65-.03 2.69-1.5 3.7-2.98 1.17-1.71 1.65-3.37 1.68-3.45-.04-.02-3.22-1.24-3.25-4.91zM14.01 3.9c.85-1.03 1.42-2.46 1.26-3.9-1.22.05-2.7.81-3.58 1.84-.79.91-1.48 2.37-1.29 3.77 1.36.11 2.75-.69 3.61-1.71z"
            /></svg
          >
          <span>Pay</span>
        </div>
        <dl>
          <div><dt>Bureau</dt><dd>{chosen.name} report</dd></div>
          <div><dt>Route</dt><dd>{origin} to {to || '—'}</dd></div>
          <div><dt>When</dt><dd>{when || 'you decide'}</dd></div>
          {#if priorities.length}
            <div><dt>In order</dt><dd>{priorities.join(', ')}</dd></div>
          {/if}
          {#if dealbreakers.length}
            <div><dt>Never</dt><dd>{dealbreakers.join(', ')}</dd></div>
          {/if}
          <div class="pay-total"><dt>Total</dt><dd>{chosen.price}</dd></div>
        </dl>
        <button class="confirm" onclick={confirm}>Confirm with Face ID</button>
      {:else}
        <div class="done">
          <span class="tick" aria-hidden="true">✓</span>
          <h3>Brief received</h3>
          <p>
            We are searching {from || 'your route'} to {to || 'your destination'} now, and the
            report lands in about {chosen.time}.
          </p>
        </div>
      {/if}

      <button class="close" onclick={() => (stage = 'idle')}>Close</button>
    </div>
  </div>
{/if}

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

  .applepay {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    /* Apple's black button is the one for light backgrounds. */
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
  .applepay:hover {
    opacity: 0.85;
  }
  .applepay svg {
    width: 1.05em;
    height: 1.05em;
    margin-top: -0.14em;
  }

  .note {
    color: var(--color-muted);
    font-size: 0.85rem;
    max-width: var(--measure);
  }
  .note strong {
    color: var(--color-text);
    font-weight: 500;
  }

  .scrim {
    position: fixed;
    inset: 0;
    z-index: 20;
    background: rgb(0 0 0 / 0.55);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .sheet {
    width: min(420px, 100%);
    background: #1c1c1e;
    color: #fff;
    border-radius: 16px 16px 0 0;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    animation: up 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @keyframes up {
    from {
      transform: translateY(100%);
    }
  }
  .demo {
    align-self: center;
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    border-radius: 999px;
    padding: 0.2rem 0.7rem;
  }
  .sheet-head {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    font-size: 1.35rem;
    font-weight: 500;
  }
  .sheet-head svg {
    width: 1.05em;
    height: 1.05em;
    margin-top: -0.14em;
  }
  dl {
    display: flex;
    flex-direction: column;
  }
  dl div {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 0.7rem 0;
    border-bottom: 1px solid rgb(255 255 255 / 0.1);
    font-size: 0.9rem;
  }
  dt {
    color: rgb(255 255 255 / 0.55);
    flex-shrink: 0;
  }
  dd {
    text-align: right;
    overflow-wrap: anywhere;
  }
  .pay-total {
    border-bottom: none;
    font-size: 1.05rem;
  }
  .pay-total dd {
    font-family: var(--font-mono);
  }
  .confirm {
    background: #0a84ff;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 0.85rem;
    font-size: 1rem;
    font-weight: 500;
  }
  .done {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem 0 0.25rem;
  }
  .tick {
    font-size: 2.25rem;
    color: #30d158;
    line-height: 1;
  }
  .done p {
    color: rgb(255 255 255 / 0.6);
    font-size: 0.9rem;
  }
  .close {
    background: transparent;
    border: none;
    color: rgb(255 255 255 / 0.55);
    padding: 0.5rem;
    font-size: 0.9rem;
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
