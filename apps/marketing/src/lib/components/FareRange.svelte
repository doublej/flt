<script lang="ts">
import { SPREADS } from '$lib/scenarios'

/** One bar per route, drawn to the dearest fare and split where the cheapest
 *  day ends. The dark part is what you pay if you are flexible; the gold part
 *  is what the worst day in the same week adds on top. */
const rows = [...SPREADS]
  .map((r) => ({
    ...r,
    spread: r.high - r.low,
    share: Math.round(((r.high - r.low) / r.low) * 100),
  }))
  .sort((a, b) => b.spread - a.spread)

const max = Math.max(...rows.map((r) => r.high))
const pct = (v: number) => `${(v / max) * 100}%`
</script>

<figure>
  <figcaption>
    <span><i class="key pay"></i>Cheapest day of the week</span>
    <span><i class="key add"></i>What the dearest day adds</span>
  </figcaption>

  <table>
    <thead>
      <tr>
        <th scope="col">Route</th>
        <th scope="col" class="chart">One-way fare across the week</th>
        <th scope="col" class="num">Cheapest</th>
        <th scope="col" class="num">Dearest</th>
        <th scope="col" class="num">You save</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as r}
        <tr>
          <th scope="row">{r.route.replace('Amsterdam → ', '')}</th>
          <td class="chart">
            <div class="bar">
              <span class="pay" style:width={pct(r.low)}></span>
              <span class="add" style:width={pct(r.spread)}></span>
            </div>
          </td>
          <td class="num">€{r.low}</td>
          <td class="num dear">€{r.high}</td>
          <td class="num save">€{r.spread} <span class="pc">{r.share}%</span></td>
        </tr>
      {/each}
    </tbody>
  </table>

  <p class="note">
    Every route was searched on all seven of its departure dates, and the bars share one scale, so
    the Alpine routes really are that much cheaper than the Atlantic ones. The percentage is the
    saving measured against the cheapest fare, which is why Innsbruck beats New York on flexibility
    while costing a tenth as much. One-way economy fares, the cheapest showing when we looked.
  </p>
</figure>

<style>
  figure {
    margin: var(--space-5) 0 0;
  }

  figcaption {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
    font-size: 0.78rem;
    color: var(--color-muted);
  }
  figcaption span {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  .key {
    width: 1.6rem;
    height: 0.55rem;
    border-radius: 1px;
  }
  .key.pay {
    background: var(--color-primary);
  }
  .key.add {
    background: var(--color-saving);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    text-align: left;
    padding: var(--space-2) var(--space-3) var(--space-2) 0;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }
  th:last-child,
  td:last-child {
    padding-right: 0;
  }
  thead th {
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-muted);
    padding-bottom: var(--space-2);
  }
  tbody th {
    font-weight: 400;
    font-size: 0.95rem;
    white-space: nowrap;
  }

  .chart {
    width: 42%;
  }
  .bar {
    display: flex;
    align-items: stretch;
    height: 0.85rem;
    background: var(--color-track);
    border-radius: 1px;
  }
  .bar .pay {
    background: var(--color-primary);
    border-radius: 1px 0 0 1px;
  }
  .bar .add {
    background: var(--color-saving);
    border-radius: 0 1px 1px 0;
  }

  .num {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 0.9rem;
    color: var(--color-muted);
    text-align: right;
    white-space: nowrap;
  }
  thead .num {
    text-align: right;
  }
  .num.dear {
    color: var(--color-text);
  }
  .num.save {
    color: var(--color-saving);
  }
  .pc {
    color: var(--color-muted);
    font-size: 0.76rem;
  }

  .note {
    margin-top: var(--space-4);
    font-size: 0.84rem;
    color: var(--color-muted);
    max-width: var(--measure);
  }

  @media (max-width: 760px) {
    .chart {
      display: none;
    }
    tbody th {
      white-space: normal;
      font-size: 0.85rem;
    }
    .num {
      font-size: 0.82rem;
    }
    .pc {
      display: none;
    }
  }
</style>
