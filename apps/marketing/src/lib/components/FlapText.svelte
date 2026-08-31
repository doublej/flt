<script lang="ts" module>
import { FLAPS } from '$lib/splitflap'

/** The drums carry ' A-Z0-9.-/' and nothing else, so anything a page hands us
 *  has to be spoken in that alphabet: € becomes EUR, dashes of every width
 *  become the hyphen the drum actually has, and thousands separators go. */
export function toFlaps(text: string): string {
  return text
    .toUpperCase()
    .replace(/€/g, 'EUR ')
    .replace(/[–—]/g, '-')
    .replace(/[·•]/g, '/')
    .replace(/,/g, '')
    .split('')
    .filter((c) => FLAPS.includes(c))
    .join('')
}
</script>

<script lang="ts">
import SplitFlapBoard, { type Column } from '$lib/components/SplitFlapBoard.svelte'

let {
  text,
  variant = 'plain',
  size = '0.62rem',
}: {
  text: string
  variant?: 'cased' | 'bare' | 'plain' | 'night'
  /** width of one flap — the board derives every other dimension from it */
  size?: string
} = $props()

const cells = $derived(toFlaps(text))
const columns = $derived<Column[]>([{ id: 't', width: cells.length }])
const rows = $derived([{ t: cells }])
</script>

<span class="flaptext" style="--n:{cells.length}; --flap:{size}">
  <SplitFlapBoard {rows} {columns} {variant} />
</span>

<style>
  /* The board fills whatever width it is given and divides it into cells, so the
     wrapper does the arithmetic backwards: one flap wide times the board's own
     budget of 1.09 per cell, less the gap it does not need after the last one,
     plus the bezel either side. */
  .flaptext {
    display: inline-block;
    width: calc((var(--n) * 1.09 - 0.09 + 1) * var(--flap));
    vertical-align: middle;
  }
</style>
