<script lang="ts">
import { en as copy } from '$lib/i18n/en'
import { TIERS } from '$lib/tiers'

/** A schedule of charges, not three cards to choose between. Three cards put
 *  the prices next to each other, where the only scale on offer is €3 to €10;
 *  the scale that matters is the lead's, where €10 sits against the €147 a
 *  week of dates was worth. So this is a tariff: one row per tier, the
 *  amount of searching set as the row's numeral because that is what is being
 *  bought, and the charge in the column a tariff keeps it in, reached by a
 *  leader so the name and the price stay paired at any width.
 *
 *  Radios rather than three toggle buttons: the three are mutually exclusive,
 *  so the native control gives arrow-key selection, one tab stop and "1 of 3"
 *  announced, for less markup than the buttons needed. */
let { selected = $bindable('survey') }: { selected?: string } = $props()
</script>

<fieldset class="tariff">
  <legend>{copy.pricing.tariffLegend}</legend>

  {#each TIERS as tier (tier.id)}
    <label class="row">
      <input type="radio" name="tier" value={tier.id} bind:group={selected} />

      <span class="work" style:--n={tier.searches}>
        <b>{copy.pricing.searchMark(tier.searches)}{tier.searches}</b>
        <i>{copy.pricing.searchUnit(tier.searches)}</i>
      </span>

      <span class="what">
        <span class="head">
          <strong>{copy.pricing.tiers[tier.id].name}</strong>
          <i class="leader"></i>
          <b class="price">{tier.price}</b>
        </span>
        <span class="scope">{copy.pricing.tiers[tier.id].scope}</span>
        <span class="time">{copy.pricing.tiers[tier.id].time}</span>
      </span>
    </label>
  {/each}
</fieldset>

<p class="foot">{copy.pricing.tiersFoot}</p>

<style>
  /* A fieldset will not shrink below its own min-content unless it is told to,
     which pushed the charge column off the right edge at 390. */
  .tariff {
    border: 0;
    min-width: 0;
    max-width: var(--measure-heading);
    margin-top: var(--space-5);
  }
  .tariff legend {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
    padding-bottom: var(--space-2);
  }

  .row {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
    align-items: center;
    column-gap: var(--space-3);
    padding: var(--space-3) var(--space-2);
    margin-inline: calc(-1 * var(--space-2));
    border-top: 1px solid var(--color-border);
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .row:last-of-type {
    border-bottom: 1px solid var(--color-border);
  }
  .row:hover {
    background: color-mix(in oklab, var(--color-primary) 5%, transparent);
  }
  /* Three cues for the chosen row — the filled control, the numeral taking the
     spot colour and the row taking a ground — so it is never colour alone. */
  .row:has(:checked) {
    background: var(--color-surface-raised);
  }
  .row:has(:focus-visible) {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .row input {
    appearance: none;
    width: 1rem;
    height: 1rem;
    border: 1px solid var(--color-muted);
    border-radius: 50%;
    display: grid;
    place-content: center;
  }
  .row input::after {
    content: "";
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    scale: 0;
    background: var(--color-primary);
    transition: scale 0.15s ease;
  }
  .row input:checked {
    border-color: var(--color-primary);
  }
  .row input:checked::after {
    scale: 1;
  }

  /* The searching is the row's numeral, sized off the count the way the job
     numerals in `#work` are, so one search and twenty-six are told apart before
     either figure is read. It is the largest thing in the row on purpose: a
     tariff whose biggest number is the charge argues against the heading. */
  .work {
    display: grid;
    justify-items: end;
    width: 6rem;
  }
  .work b {
    font-family: var(--font-display);
    font-stretch: var(--display-wide);
    font-weight: 600;
    font-size: calc(1.85rem + var(--n) * 0.055rem);
    line-height: 0.86;
    letter-spacing: -0.02em;
    font-variant-numeric: lining-nums tabular-nums;
    color: var(--color-muted);
  }
  .row:has(:checked) .work b {
    color: var(--color-primary);
  }
  .work i {
    font-family: var(--font-mono);
    font-style: normal;
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
    margin-top: 0.35rem;
  }

  .what {
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: var(--space-3);
    row-gap: 0.2rem;
    padding-left: var(--space-3);
    border-left: 1px solid var(--color-border);
  }
  .head {
    min-width: 0;
    grid-column: 1 / -1;
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
  }
  .head strong {
    font-family: var(--font-display);
    font-stretch: var(--display-wide);
    font-weight: 600;
    font-size: 1.15rem;
    letter-spacing: 0.01em;
  }
  /* What carries the eye from the name to its charge across a row this wide,
     the way a printed price list does. */
  .leader {
    flex: 1;
    border-bottom: 1px dotted var(--color-border);
    translate: 0 -0.22rem;
  }
  .price {
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: 1.25rem;
    font-variant-numeric: tabular-nums;
  }
  .scope {
    grid-column: 1;
    font-size: 0.9rem;
    line-height: 1.4;
    color: var(--color-muted);
  }
  .time {
    grid-column: 2;
    align-self: end;
    text-align: right;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--color-muted);
    white-space: nowrap;
  }

  /* Operational detail rather than another paragraph of argument, so it is set
     finer than the kicker below it and kept to the tariff's own width. */
  .foot {
    margin-top: var(--space-3);
    max-width: var(--measure-heading);
    font-size: 0.8rem;
    color: var(--color-muted);
  }

  /* Narrow: the numeral holds its column and the time drops under the scope,
     which is the only pair that cannot share a line at this width. */
  @media (max-width: 620px) {
    .work {
      width: 4.8rem;
    }
    .work b {
      font-size: calc(1.5rem + var(--n) * 0.042rem);
    }
    .work i {
      font-size: 0.58rem;
    }
    .what {
      column-gap: var(--space-2);
    }
    .time {
      grid-column: 1 / -1;
      text-align: left;
    }
  }
</style>
