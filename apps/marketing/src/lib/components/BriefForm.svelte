<script lang="ts">
import { TIERS } from '$lib/tiers'

let { tier = 'survey' }: { tier?: string } = $props()

let from = $state('')
let to = $state('')
let when = $state('')
let matters = $state('')

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

<form onsubmit={pay}>
  <div class="row">
    <label>
      <span>Flying from</span>
      <input bind:value={from} required placeholder="Amsterdam" autocomplete="off" />
    </label>
    <label>
      <span>Going to</span>
      <input
        bind:value={to}
        required
        placeholder="Vietnam: Hanoi, Da Nang, anywhere sensible"
        autocomplete="off"
      />
    </label>
  </div>

  <label>
    <span>Roughly when</span>
    <input
      bind:value={when}
      required
      placeholder="Late October, two weeks, flexible either side"
      autocomplete="off"
    />
  </label>

  <label>
    <span>What matters to you</span>
    <textarea
      bind:value={matters}
      rows="4"
      placeholder="Cheap over fast. No more than one stop. I would rather leave a day early than pay another €200."
    ></textarea>
  </label>

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
    real; the checkout is a placeholder while billing is built.
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
          <div><dt>Route</dt><dd>{from || '—'} to {to || '—'}</dd></div>
          <div><dt>Dates</dt><dd>{when || '—'}</dd></div>
          <div class="pay-total"><dt>Total</dt><dd>{chosen.price}</dd></div>
        </dl>
        <button class="confirm" onclick={confirm}>Confirm with Face ID</button>
      {:else}
        <div class="done">
          <span class="tick" aria-hidden="true">✓</span>
          <h3>Brief received</h3>
          <p>
            The Bureau starts on {from || 'your route'} to {to || 'your destination'}. The report
            lands in about {chosen.time}.
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
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
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
</style>
